import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiStartStream,
  apiTurnStream,
  apiAutoStream,
  apiDeleteSession,
  type SSEEvent,
} from '@/lib/api';
import { playAudioBase64, stopAudio } from '@/lib/audio';
import {
  type ChatMsg,
  type Round,
  FREE_SESSION_LIMIT,
  MAX_TURNS_PER_SESSION,
  nextId,
  getSessionCount,
  incrementSessionCount,
  dlog,
} from '@/lib/constants';

export function usePipeline() {
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [personality, setPersonality] = useState(0.5);
  const [gptCountdown, setGptCountdown] = useState<number | null>(null);
  const [claudeCountdown, setClaudeCountdown] = useState<number | null>(null);
  const [gptMotivation, setGptMotivation] = useState('');
  const [claudeMotivation, setClaudeMotivation] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<string | null>(null);
  const runningRef = useRef(false);
  const stoppedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const initDoneRef = useRef(false);
  const settingsVersionRef = useRef(0);
  const gptCountdownRef = useRef<number>(0);
  const claudeCountdownRef = useRef<number>(0);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const addMsg = useCallback((speaker: ChatMsg['speaker'], text: string) => {
    const msg: ChatMsg = { id: nextId(), speaker, text };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }, []);

  // ---- Abort helpers ----
  const abortAll = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const freshAbort = useCallback(() => {
    abortAll();
    abortRef.current = new AbortController();
    return abortRef.current;
  }, [abortAll]);

  // ---- Fetch a round from SSE ----
  const fetchRound = useCallback(async (
    sid: string,
    streamFn: (sid: string, onEvent: (e: SSEEvent) => void, signal: AbortSignal) => Promise<void>,
    controller: AbortController,
  ): Promise<Round | null> => {
    const round: Round = {};
    try {
      await streamFn(sid, (event) => {
        if (event.type === 'text') {
          if (event.speaker === 'gpt') round.gptText = event.text;
          else if (event.speaker === 'claude') round.claudeText = event.text;
        } else if (event.type === 'audio') {
          const clip = { base64: event.audio_base64, mime: event.mime_type };
          if (event.speaker === 'gpt') round.gptAudio = clip;
          else if (event.speaker === 'claude') round.claudeAudio = clip;
        } else if (event.type === 'session') {
          sessionRef.current = event.session_id;
          setSessionId(event.session_id);
          // Store random personality assignments for UI sync
          if (event.gpt_personality) {
            (round as Record<string, unknown>).gptPersonality = event.gpt_personality;
          }
          if (event.claude_personality) {
            (round as Record<string, unknown>).claudePersonality = event.claude_personality;
          }
        } else if (event.type === 'motivations') {
          setGptMotivation(event.gpt || '');
          setClaudeMotivation(event.claude || '');
        }
      }, controller.signal);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return null;
      throw err;
    }
    return round;
  }, []);

  // ---- Play a round: show text + play audio ----
  const playRound = useCallback(async (round: Round): Promise<boolean> => {
    const t0 = performance.now();
    if (round.gptText) {
      addMsg('gpt', round.gptText);
      setStatus('ChatGPT speaking...');
      dlog('audio', `GPT playing (${round.gptText.split(' ').length}w)...`);
    }
    if (round.gptAudio) {
      await playAudioBase64(round.gptAudio.base64, round.gptAudio.mime);
      dlog('audio', `GPT done in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
    }
    if (gptCountdownRef.current > 0) {
      gptCountdownRef.current--;
      setGptCountdown(gptCountdownRef.current || null);
    }
    if (stoppedRef.current || !runningRef.current) return false;

    const t1 = performance.now();
    if (round.claudeText) {
      addMsg('claude', round.claudeText);
      setStatus('Claude speaking...');
      dlog('audio', `Claude playing (${round.claudeText.split(' ').length}w)...`);
    }
    if (round.claudeAudio) {
      await playAudioBase64(round.claudeAudio.base64, round.claudeAudio.mime);
      dlog('audio', `Claude done in ${((performance.now() - t1) / 1000).toFixed(1)}s`);
    }
    if (claudeCountdownRef.current > 0) {
      claudeCountdownRef.current--;
      setClaudeCountdown(claudeCountdownRef.current || null);
    }
    if (stoppedRef.current || !runningRef.current) return false;

    dlog('audio', `Round playback total: ${((performance.now() - t0) / 1000).toFixed(1)}s`);
    return true;
  }, [addMsg]);

  // ---- Pipeline auto-loop with one-round-ahead prefetch ----
  const runPipeline = useCallback(async (
    sid: string,
    initialPrefetch?: Promise<Round | null> | null,
    initialController?: AbortController | null,
  ) => {
    runningRef.current = true;
    let pendingRound: Promise<Round | null> | null = initialPrefetch || null;
    let pendingController: AbortController | null = initialController || null;
    let roundNum = 0;

    while (runningRef.current && sessionRef.current === sid && !stoppedRef.current) {
      try {
        roundNum++;
        const roundT = performance.now();
        let round: Round | null;
        if (pendingRound) {
          dlog('pipeline', `Round ${roundNum}: using prefetched data...`);
          round = await pendingRound;
          pendingRound = null;
          pendingController = null;
          dlog('pipeline', `Round ${roundNum}: resolved in ${((performance.now() - roundT) / 1000).toFixed(1)}s`);
        } else {
          dlog('pipeline', `Round ${roundNum}: fetching fresh...`);
          setStatus('Bots are thinking...');
          const ctrl = new AbortController();
          abortRef.current = ctrl;
          round = await fetchRound(sid, (s, cb, sig) => apiAutoStream(s, cb, sig), ctrl);
          dlog('pipeline', `Round ${roundNum}: fresh fetch took ${((performance.now() - roundT) / 1000).toFixed(1)}s`);
        }

        if (!round || !runningRef.current || stoppedRef.current) break;

        setTurnCount(prev => {
          const next = prev + 1;
          if (next >= MAX_TURNS_PER_SESSION) {
            runningRef.current = false;
            addMsg('system', 'Session limit reached. Start a new conversation.');
          }
          return next;
        });

        // Prefetch NEXT round while playing THIS one
        pendingController = new AbortController();
        abortRef.current = pendingController;
        pendingRound = fetchRound(sid, (s, cb, sig) => apiAutoStream(s, cb, sig), pendingController);

        setStatus('Bots chatting...');
        const ok = await playRound(round);
        if (!ok) {
          pendingController?.abort();
          pendingRound = null;
          break;
        }

      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          break;
        }
        console.error('Pipeline error:', err);
        pendingRound = null;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    runningRef.current = false;
  }, [fetchRound, playRound, addMsg]);

  const stopPipeline = useCallback(() => {
    runningRef.current = false;
    stoppedRef.current = true;
    stopAudio();
    abortAll();
  }, [abortAll]);

  // ---- Settings changed callback (called from useSettings) ----
  const onSettingsChanged = useCallback((bots: ('gpt' | 'claude')[]) => {
    settingsVersionRef.current++;
    // Set countdown only for the bot(s) whose settings changed
    if (bots.includes('gpt')) {
      gptCountdownRef.current = 2;
      setGptCountdown(2);
    }
    if (bots.includes('claude')) {
      claudeCountdownRef.current = 2;
      setClaudeCountdown(2);
    }
    // Don't abort the prefetch — let it finish and play with old settings.
    // The backend session is already updated, so the NEXT prefetch will use new settings.
    // This eliminates the awkward pause.
    dlog('settings', `Settings changed for ${bots.join(', ')} — will apply in ~2 responses`);
  }, []);

  // ---- Handlers ----
  const handleStart = async (getSettings: () => Record<string, unknown>,
                              onPersonalitiesAssigned?: (gpt: string, claude: string) => void) => {
    const count = getSessionCount();
    if (count >= FREE_SESSION_LIMIT) return 'pricing';
    setLoading(true);
    try {
      incrementSessionCount();
      setStarted(true);
      stoppedRef.current = false;
      setStopped(false);
      setTurnCount(0);
      setStatus('Bots are thinking...');
      addMsg('system', 'Conversation started!');

      const startT = performance.now();
      dlog('start', 'Requesting first round from AI...');

      const ctrl = freshAbort();
      const round = await fetchRound('__pending__',
        async (_sid, onEvent, signal) => {
          await apiStartStream(personality, getSettings(), onEvent, signal);
        },
        ctrl,
      );

      if (!round) { setStarted(false); return null; }

      // Sync random personality assignments from backend
      if (onPersonalitiesAssigned && (round.gptPersonality || round.claudePersonality)) {
        onPersonalitiesAssigned(round.gptPersonality || 'default', round.claudePersonality || 'default');
      }

      initDoneRef.current = true;
      const sid = sessionRef.current;
      if (!sid) { setStarted(false); return null; }

      dlog('start', `First round ready in ${((performance.now() - startT) / 1000).toFixed(1)}s`);
      setStatus('Bots chatting...');
      runningRef.current = true;

      const prefetchCtrl = new AbortController();
      abortRef.current = prefetchCtrl;
      const prefetchPromise = fetchRound(sid, (s, cb, sig) => apiAutoStream(s, cb, sig), prefetchCtrl);
      dlog('start', 'Prefetching first auto round during opener playback');

      await playRound(round);

      if (sid && !stoppedRef.current) {
        runPipeline(sid, prefetchPromise, prefetchCtrl);
      } else {
        prefetchCtrl.abort();
      }
      return null;
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        alert('Failed to start. Make sure the backend is running.\n\n' + (err as Error).message);
        setStarted(false);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (overrideText?: string, typedText?: string, clearTypedText?: () => void) => {
    const text = (overrideText || typedText || '').trim();
    if (!text || !sessionId) return;

    stopPipeline();
    stoppedRef.current = false;

    addMsg('user', text);
    if (!overrideText && clearTypedText) clearTypedText();
    setStatus('Getting response...');

    try {
      const ctrl = freshAbort();
      const round = await fetchRound(sessionId,
        (sid, onEvent, signal) => apiTurnStream(sid, text, onEvent, signal),
        ctrl,
      );
      if (!round || stoppedRef.current) return;

      setTurnCount(prev => prev + 1);
      runningRef.current = true;
      setStatus('Bots chatting...');

      const prefetchCtrl = new AbortController();
      abortRef.current = prefetchCtrl;
      const prefetchPromise = fetchRound(sessionId,
        (s, cb, sig) => apiAutoStream(s, cb, sig), prefetchCtrl);

      await playRound(round);

      if (sessionRef.current && !stoppedRef.current) {
        runPipeline(sessionRef.current, prefetchPromise, prefetchCtrl);
      } else {
        prefetchCtrl.abort();
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        addMsg('system', `Error: ${(err as Error).message}`);
        setStatus('Error');
      }
    }
  };

  const handleStop = () => {
    stopPipeline();
    setStopped(true);
    setStatus('Paused');
    addMsg('system', 'Conversation paused. Hit GO to resume or NEW to start over.');
  };

  const handleGo = () => {
    if (!sessionId) return;
    stoppedRef.current = false;
    setStopped(false);
    setStatus('Bots chatting...');
    addMsg('system', 'Resumed!');
    runPipeline(sessionId);
  };

  const handleEnd = () => {
    stopPipeline();
    stoppedRef.current = false;
    initDoneRef.current = false;
    setStopped(false);
    setStatus('Conversation ended');
    addMsg('system', 'Conversation ended.');
    if (sessionId) {
      apiDeleteSession(sessionId);
      setSessionId(null);
    }
  };

  const handleNewConversation = (resetSettingsInit: () => void) => {
    const count = getSessionCount();
    if (count >= FREE_SESSION_LIMIT) return 'pricing';
    setMessages([]);
    setStarted(false);
    setSessionId(null);
    setTurnCount(0);
    initDoneRef.current = false;
    resetSettingsInit();
    return null;
  };

  return {
    // State
    started,
    sessionId,
    messages,
    setMessages,
    status,
    setStatus,
    loading,
    turnCount,
    stopped,
    setStopped,
    personality,
    setPersonality,
    gptCountdown,
    claudeCountdown,
    gptMotivation,
    claudeMotivation,
    // Refs
    chatEndRef,
    inputRef,
    sessionRef,
    runningRef,
    stoppedRef,
    abortRef,
    // Actions
    addMsg,
    freshAbort,
    fetchRound,
    playRound,
    runPipeline,
    stopPipeline,
    onSettingsChanged,
    handleStart,
    handleSend,
    handleStop,
    handleGo,
    handleEnd,
    handleNewConversation,
  };
}
