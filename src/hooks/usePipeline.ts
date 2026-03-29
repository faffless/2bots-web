import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiStartStream,
  apiTurnStream,
  apiAutoStream,
  apiAutopilotStream,
  apiFillerStream,
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
  // Track which AI generates the next autopilot batch (leapfrog)
  const nextGeneratorRef = useRef<string>('claude');
  // Track total autopilot messages and batches for throttling
  const autopilotMsgCountRef = useRef(0);
  const autopilotBatchCountRef = useRef(0);
  const MAX_AUTOPILOT_BATCHES = 6;
  const MAX_AUTOPILOT_MESSAGES = 80;
  // Generation counter — bumped every time user sends a message.
  // Used to discard stale queued messages from old batches.
  const generationRef = useRef(0);
  // ---- CHAT MODE ---- Timer for auto-resuming autopilot after user goes quiet
  const chatModeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CHAT_MODE_TIMEOUT = 2000; // ---- CHAT MODE ---- 2 seconds before autopilot resumes
  // Batch timing — for estimating settings delay
  const batchStartTimeRef = useRef(0);
  const batchMsgsPlayedRef = useRef(0);
  const [settingsDelay, setSettingsDelay] = useState<number | null>(null);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
  useEffect(() => {
    // Scroll within the chat container only, not the whole page
    const el = chatEndRef.current;
    if (el?.parentElement) {
      el.parentElement.scrollTop = el.parentElement.scrollHeight;
    }
  }, [messages]);

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

  // ---- Fetch a round from SSE (used for opener only now) ----
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

  // ---- Play a round: show text + play audio (for opener) ----
  const playRound = useCallback(async (round: Round): Promise<boolean> => {
    const t0 = performance.now();
    if (round.gptText) {
      addMsg('gpt', round.gptText);
      setStatus('ChatGPT speaking...');
    }
    if (round.gptAudio) {
      await playAudioBase64(round.gptAudio.base64, round.gptAudio.mime);
    }
    if (gptCountdownRef.current > 0) {
      gptCountdownRef.current--;
      setGptCountdown(gptCountdownRef.current || null);
    }
    if (stoppedRef.current || !runningRef.current) return false;

    if (round.claudeText) {
      addMsg('claude', round.claudeText);
      setStatus('Claude speaking...');
    }
    if (round.claudeAudio) {
      await playAudioBase64(round.claudeAudio.base64, round.claudeAudio.mime);
    }
    if (claudeCountdownRef.current > 0) {
      claudeCountdownRef.current--;
      setClaudeCountdown(claudeCountdownRef.current || null);
    }
    if (stoppedRef.current || !runningRef.current) return false;

    dlog('audio', `Round playback total: ${((performance.now() - t0) / 1000).toFixed(1)}s`);
    return true;
  }, [addMsg]);

  // ---- Stream and play an autopilot batch message by message ----
  const streamAndPlayBatch = useCallback(async (
    sid: string,
    whoGenerates: string,
    controller: AbortController,
  ): Promise<string | null> => {
    // Returns the next_generator from the done event, or null if interrupted
    let nextGen: string | null = null;
    let batchMsgCount = 0;
    const myGeneration = generationRef.current;
    batchStartTimeRef.current = Date.now();
    batchMsgsPlayedRef.current = 0;

    try {
      await apiAutopilotStream(sid, whoGenerates, async (event) => {
        // Discard if a newer generation has started (user spoke)
        if (generationRef.current !== myGeneration) return;

        if (event.type === 'text') {
          const speaker = event.speaker as ChatMsg['speaker'];
          addMsg(speaker, event.text);
          setStatus(speaker === 'gpt' ? 'ChatGPT speaking...' : 'Claude speaking...');
          batchMsgCount++;
          batchMsgsPlayedRef.current = batchMsgCount;
          autopilotMsgCountRef.current++;

          // Tick countdowns
          if (speaker === 'gpt' && gptCountdownRef.current > 0) {
            gptCountdownRef.current--;
            setGptCountdown(gptCountdownRef.current || null);
          }
          if (speaker === 'claude' && claudeCountdownRef.current > 0) {
            claudeCountdownRef.current--;
            setClaudeCountdown(claudeCountdownRef.current || null);
          }
        } else if (event.type === 'audio') {
          await playAudioBase64(event.audio_base64, event.mime_type);
        } else if (event.type === 'motivations') {
          setGptMotivation(event.gpt || '');
          setClaudeMotivation(event.claude || '');
        } else if (event.type === 'done') {
          nextGen = (event as Record<string, unknown>).next_generator as string || null;
        }
      }, controller.signal);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return null;
      throw err;
    }

    autopilotBatchCountRef.current++;
    dlog('autopilot', `Batch done: ${batchMsgCount} msgs (total: ${autopilotMsgCountRef.current} msgs, ${autopilotBatchCountRef.current} batches)`);
    return nextGen;
  }, [addMsg]);

  // ---- Stream and play filler pair ----
  const streamAndPlayFiller = useCallback(async (
    sid: string,
    userText: string,
    controller: AbortController,
  ): Promise<boolean> => {
    const myGeneration = generationRef.current;
    try {
      await apiFillerStream(sid, userText, async (event) => {
        if (generationRef.current !== myGeneration) return;
        if (event.type === 'text') {
          const speaker = event.speaker as ChatMsg['speaker'];
          addMsg(speaker, event.text);
          setStatus(speaker === 'gpt' ? 'ChatGPT speaking...' : 'Claude speaking...');
        } else if (event.type === 'audio') {
          await playAudioBase64(event.audio_base64, event.mime_type);
        }
      }, controller.signal);
      return true;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return false;
      throw err;
    }
  }, [addMsg]);

  // ---- Autopilot pipeline loop ----
  const runAutopilot = useCallback(async (sid: string, firstGenerator?: string) => {
    runningRef.current = true;
    let whoGenerates = firstGenerator || nextGeneratorRef.current;
    let batchNum = 0;

    while (runningRef.current && sessionRef.current === sid && !stoppedRef.current) {
      // Throttle check
      if (autopilotBatchCountRef.current >= MAX_AUTOPILOT_BATCHES) {
        dlog('autopilot', `Batch limit reached (${MAX_AUTOPILOT_BATCHES}). Stopping.`);
        addMsg('system', 'Conversation paused — batch limit reached. Hit GO to continue or NEW to start over.');
        setStopped(true);
        stoppedRef.current = true;
        break;
      }
      if (autopilotMsgCountRef.current >= MAX_AUTOPILOT_MESSAGES) {
        dlog('autopilot', `Message limit reached (${MAX_AUTOPILOT_MESSAGES}). Stopping.`);
        addMsg('system', 'Conversation paused — message limit reached. Hit GO to continue or NEW to start over.');
        setStopped(true);
        stoppedRef.current = true;
        break;
      }

      try {
        batchNum++;
        dlog('autopilot', `Batch ${batchNum}: generating via ${whoGenerates}...`);
        setStatus('Bots are thinking...');

        const ctrl = freshAbort();
        const nextGen = await streamAndPlayBatch(sid, whoGenerates, ctrl);

        if (!nextGen || !runningRef.current || stoppedRef.current) break;

        // Leapfrog: switch to the other AI for next batch
        whoGenerates = nextGen;
        nextGeneratorRef.current = nextGen;

      } catch (err) {
        if ((err as Error)?.name === 'AbortError') break;
        console.error('Autopilot error:', err);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    runningRef.current = false;
  }, [freshAbort, streamAndPlayBatch, addMsg]);

  // Keep old runPipeline for backward compat (used by speech input)
  const runPipeline = useCallback(async (
    sid: string,
    _initialPrefetch?: Promise<Round | null> | null,
    _initialController?: AbortController | null,
  ) => {
    // Redirect to autopilot
    await runAutopilot(sid);
  }, [runAutopilot]);

  const stopPipeline = useCallback(() => {
    runningRef.current = false;
    stoppedRef.current = true;
    stopAudio();
    abortAll();
  }, [abortAll]);

  // ---- Settings changed callback ----
  const onSettingsChanged = useCallback((bots: ('gpt' | 'claude')[]) => {
    settingsVersionRef.current++;
    // Estimate seconds until settings take effect
    const elapsed = (Date.now() - batchStartTimeRef.current) / 1000;
    const played = batchMsgsPlayedRef.current || 1;
    const avgPerMsg = elapsed / played;
    const assumedBatchSize = 12;
    const remaining = Math.max(0, assumedBatchSize - played);
    const estSeconds = Math.round(remaining * avgPerMsg);
    setSettingsDelay(estSeconds > 0 ? estSeconds : 5);
    // Clear after the estimated time + a buffer
    setTimeout(() => setSettingsDelay(null), (estSeconds + 5) * 1000);

    if (bots.includes('gpt')) {
      gptCountdownRef.current = 2;
      setGptCountdown(2);
    }
    if (bots.includes('claude')) {
      claudeCountdownRef.current = 2;
      setClaudeCountdown(2);
    }
    dlog('settings', `Settings changed for ${bots.join(', ')} — will apply in ~2 responses`);
  }, []);

  // ---- Handlers ----
  const handleStart = async (getSettings: () => Record<string, unknown>,
                              onPersonalitiesAssigned?: (gpt: string, claude: string) => void,
                              formatLabel?: string) => {
    const count = getSessionCount();
    if (count >= FREE_SESSION_LIMIT) return 'pricing';
    setLoading(true);
    try {
      incrementSessionCount();
      setStarted(true);
      stoppedRef.current = false;
      setStopped(false);
      setTurnCount(0);
      autopilotBatchCountRef.current = 0;
      autopilotMsgCountRef.current = 0;
      setStatus('Bots are thinking...');
      const startedLabel = formatLabel || 'Conversation';
      addMsg('system', `${startedLabel} started!`);

      dlog('start', 'Requesting opener...');

      let prefetchStarted = false;
      let gptPersonalityResult = 'default';
      let claudePersonalityResult = 'default';

      const ctrl = freshAbort();

      // Stream opener and play each message as it arrives (same as autopilot)
      await apiStartStream(personality, getSettings(), async (event) => {
        if (event.type === 'session' && event.session_id) {
          sessionRef.current = event.session_id;
          setSessionId(event.session_id);
          if (event.gpt_personality) gptPersonalityResult = event.gpt_personality;
          if (event.claude_personality) claudePersonalityResult = event.claude_personality;

          // Prefetch Claude's batch as soon as we have a session ID
          if (!prefetchStarted) {
            prefetchStarted = true;
            const sid = event.session_id;
            dlog('start', `Got session ${sid.slice(0, 8)}... — prefetching Claude batch NOW`);
            const apiBase = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
            fetch(`${apiBase}/autopilot/prefetch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sid, who_generates: 'claude' }),
            }).catch(() => {});
          }
        } else if (event.type === 'text') {
          const who = event.speaker as 'gpt' | 'claude';
          addMsg(who, event.text);
          setStatus(who === 'gpt' ? 'ChatGPT speaking...' : 'Claude speaking...');
        } else if (event.type === 'audio') {
          await playAudioBase64(event.audio_base64, event.mime_type);
        }
      }, ctrl.signal);

      // Sync random personality assignments
      if (onPersonalitiesAssigned && (gptPersonalityResult !== 'default' || claudePersonalityResult !== 'default')) {
        onPersonalitiesAssigned(gptPersonalityResult, claudePersonalityResult);
      }

      initDoneRef.current = true;
      const sid = sessionRef.current;
      if (!sid) { setStarted(false); return null; }

      dlog('start', 'Opener done, starting autopilot...');
      runningRef.current = true;
      setStatus('Bots chatting...');

      // Start autopilot — Claude's batch may already be ready from the prefetch
      if (sid && !stoppedRef.current) {
        nextGeneratorRef.current = 'claude';
        runAutopilot(sid, 'claude');
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

    // Stop current autopilot and invalidate any queued messages
    stopPipeline();
    generationRef.current++;
    stoppedRef.current = false;

    // ---- CHAT MODE ---- Cancel any pending autopilot resume timer
    if (chatModeTimerRef.current) {
      clearTimeout(chatModeTimerRef.current);
      chatModeTimerRef.current = null;
    }

    addMsg('user', text);
    if (!overrideText && clearTypedText) clearTypedText();
    setStatus('Getting response...');

    try {
      const fillerCtrl = freshAbort();
      const batchGenerator = nextGeneratorRef.current;

      // ---- CHAT MODE ---- Play bridge/single-bot response
      runningRef.current = true;
      stoppedRef.current = false;
      await streamAndPlayFiller(sessionId, text, fillerCtrl);

      // ---- CHAT MODE ---- Bridge done — NOW prefetch autopilot batch (includes bridge context)
      const apiBase = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      dlog('chat_mode', `Bridge done — prefetching autopilot batch via ${batchGenerator}`);
      fetch(`${apiBase}/autopilot/prefetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, who_generates: batchGenerator }),
      }).catch(() => {});

      // ---- CHAT MODE ---- Short wait then launch autopilot (batch may be ready from prefetch)
      runningRef.current = true;
      stoppedRef.current = false;

      chatModeTimerRef.current = setTimeout(() => {
        chatModeTimerRef.current = null;
        if (sessionRef.current && !stoppedRef.current) {
          dlog('chat_mode', 'Bridge done — launching autopilot (batch likely prefetched)');
          setStatus('Bots chatting...');
          runAutopilot(sessionRef.current, batchGenerator);
        }
      }, CHAT_MODE_TIMEOUT);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        addMsg('system', `Error: ${(err as Error).message}`);
        setStatus('Error');
      }
    }
  };

  const handleStop = () => {
    generationRef.current++;  // Kill any queued messages
    stopPipeline();
    // ---- CHAT MODE ---- Clear autopilot resume timer
    if (chatModeTimerRef.current) { clearTimeout(chatModeTimerRef.current); chatModeTimerRef.current = null; }
    setStopped(true);
    setStatus('Paused');
    addMsg('system', 'Conversation paused. Hit GO to resume or NEW to start over.');
  };

  const handleGo = () => {
    if (!sessionId) return;
    stoppedRef.current = false;
    setStopped(false);
    // Reset throttle counters on resume
    autopilotBatchCountRef.current = 0;
    autopilotMsgCountRef.current = 0;
    setStatus('Bots chatting...');
    addMsg('system', 'Resumed!');
    runAutopilot(sessionId);
  };

  const handleEnd = () => {
    generationRef.current++;  // Kill any queued messages
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
    // Stop any playing audio and abort in-flight requests
    generationRef.current++;
    stopPipeline();
    // ---- CHAT MODE ---- Clear autopilot resume timer
    if (chatModeTimerRef.current) { clearTimeout(chatModeTimerRef.current); chatModeTimerRef.current = null; }
    setMessages([]);
    setStarted(false);
    setSessionId(null);
    setTurnCount(0);
    setStopped(false);
    stoppedRef.current = false;
    initDoneRef.current = false;
    nextGeneratorRef.current = 'claude';
    autopilotBatchCountRef.current = 0;
    autopilotMsgCountRef.current = 0;
    setStatus('');
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
    settingsDelay,
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
