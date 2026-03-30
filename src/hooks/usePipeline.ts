import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiStartStream,
  apiTurnStream,
  apiAutoStream,
  apiAutopilotStream,
  apiFillerStream,
  apiDeleteSession,
  apiResearchStream,
  apiResearchDiscardPrefetch,
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
  PINGPONG_MODES,
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
  // No batch/message limits — conversations run forever (rate limiting is on the backend)
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
  // ---- PING-PONG MODE ---- Track whether current session uses ping-pong (research, debate, advice)
  const isPingPongModeRef = useRef(false);
  const pingPongModeNameRef = useRef<string>('research');

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

  // ---- PING-PONG MODE ----
  // Ping-pong loop: alternates between GPT and Claude, each responding genuinely.
  // Prefetch happens server-side. Each turn streams text+tts, then tells us who goes next.
  const runResearchPingPong = useCallback(async (sid: string, firstWho?: string) => {
    runningRef.current = true;
    let who = firstWho || (Math.random() < 0.5 ? 'gpt' : 'claude');

    while (runningRef.current && sessionRef.current === sid && !stoppedRef.current) {
      // ---- PING-PONG MODE ---- No message limit for research
      // Research stops when 5 conclusions are reached (signaled by backend)

      try {
        dlog('research', `Ping-pong turn: ${who}`);
        setStatus(who === 'gpt' ? 'ChatGPT thinking...' : 'Claude thinking...');

        const ctrl = freshAbort();
        const myGeneration = generationRef.current;
        let nextWho: string | null = null;

        await apiResearchStream(sid, who, async (event) => {
          if (generationRef.current !== myGeneration) return;

          if (event.type === 'text') {
            const speaker = event.speaker as ChatMsg['speaker'];
            addMsg(speaker, event.text);
            setStatus(speaker === 'gpt' ? 'ChatGPT speaking...' : 'Claude speaking...');
            autopilotMsgCountRef.current++;

            // Show countdown to next milestone
            const textEvent = event as Record<string, unknown>;
            if (textEvent.msgs_until_review) {
              const m = pingPongModeNameRef.current;
              const countdownLabel = m === 'debate' ? 'Next motion'
                : m === 'advice' ? 'Next recommendation'
                : m === 'help_me_decide' ? 'Next decision'
                : 'Next finding';
              addMsg('system', `${countdownLabel} in ${textEvent.msgs_until_review} messages`);
            }

            if (speaker === 'gpt' && gptCountdownRef.current > 0) {
              gptCountdownRef.current--;
              setGptCountdown(gptCountdownRef.current || null);
            }
            if (speaker === 'claude' && claudeCountdownRef.current > 0) {
              claudeCountdownRef.current--;
              setClaudeCountdown(claudeCountdownRef.current || null);
            }
          } else if (event.type === 'research_status') {
            const statusEvent = event as Record<string, unknown>;
            const m = (statusEvent.mode as string) || pingPongModeNameRef.current;
            const total = (statusEvent.milestone_total as number) || '?';
            if (statusEvent.event === 'threshold_reached') {
              const thresholdLabel = m === 'debate' ? 'Motion review'
                : m === 'advice' ? 'Recommendation review'
                : m === 'help_me_decide' ? 'Decision review'
                : 'Finding review';
              addMsg('system', `⚡ ${thresholdLabel}`);
            } else if (statusEvent.event === 'conclusion_reached') {
              const latest = statusEvent.latest_conclusion as string || '';
              const num = statusEvent.conclusion_num as number;
              if (m === 'debate') {
                const gptScore = statusEvent.debate_score_gpt as number || 0;
                const claudeScore = statusEvent.debate_score_claude as number || 0;
                addMsg('system', `✓ Motion ${num}/${total} carried (Score: ChatGPT ${gptScore} - Claude ${claudeScore})`);
              } else if (m === 'advice') {
                addMsg('system', `✓ Recommendation ${num}/${total} agreed`);
              } else if (m === 'help_me_decide') {
                addMsg('system', `✓ Decision ${num}/${total} reached`);
              } else {
                addMsg('system', `✓ Finding ${num}/${total} reached`);
              }
            } else if (statusEvent.event === 'conclusion_rejected') {
              const rejectedLabel = m === 'debate' ? 'Motion disputed — continuing debate'
                : m === 'advice' ? 'Recommendation not agreed — continuing discussion'
                : m === 'help_me_decide' ? 'Decision not reached — continuing discussion'
                : 'Finding not reached — continuing research';
              addMsg('system', `✗ ${rejectedLabel}`);
            }
          } else if (event.type === 'audio') {
            await playAudioBase64(event.audio_base64, event.mime_type);
          } else if (event.type === 'done') {
            const doneEvent = event as Record<string, unknown>;
            nextWho = doneEvent.next_who as string || null;
            // Stop when all milestones reached — show recap
            if (doneEvent.pingpong_complete) {
              const m = (doneEvent.mode as string) || pingPongModeNameRef.current;
              const mt = (doneEvent.milestone_target as number) || '?';
              const conclusions = (doneEvent.conclusions as string[]) || [];

              // Header
              if (m === 'debate') {
                const gptScore = (doneEvent.debate_score_gpt as number) || 0;
                const claudeScore = (doneEvent.debate_score_claude as number) || 0;
                addMsg('system', `Debate complete — Final score: ChatGPT ${gptScore} - Claude ${claudeScore}`);
              } else if (m === 'advice') {
                addMsg('system', `Advice complete — ${mt} recommendations agreed`);
              } else if (m === 'help_me_decide') {
                addMsg('system', `All done — ${mt} decisions reached`);
              } else {
                addMsg('system', `Research complete — ${mt} findings reached`);
              }

              // Recap list
              if (conclusions.length > 0) {
                const milestoneWord = m === 'debate' ? 'Motion'
                  : m === 'advice' ? 'Recommendation'
                  : m === 'help_me_decide' ? 'Decision'
                  : 'Finding';
                conclusions.forEach((c, i) => {
                  addMsg('system', `${milestoneWord} ${i + 1}: ${c}`);
                });
              }

              setStopped(true);
              stoppedRef.current = true;
            }
          }
        }, ctrl.signal);

        if (!nextWho || !runningRef.current || stoppedRef.current) break;
        who = nextWho;

      } catch (err) {
        if ((err as Error)?.name === 'AbortError') break;
        console.error('Research ping-pong error:', err);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    runningRef.current = false;
  }, [freshAbort, addMsg]);
  // ---- END PING-PONG MODE ----

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

      dlog('start', 'Requesting buffered start (text + TTS pre-generated)...');

      let gptPersonalityResult = 'default';
      let claudePersonalityResult = 'default';
      let loadingDismissed = false;
      let startNextWho: string | null = null;
      let startNextGenerator: string | null = null;

      const ctrl = freshAbort();
      const myGeneration = generationRef.current;

      // Detect ping-pong mode for countdown handling
      const currentSettings = getSettings();
      const isPingPong = PINGPONG_MODES.has(currentSettings.mode as string);
      isPingPongModeRef.current = isPingPong;
      pingPongModeNameRef.current = (currentSettings.mode as string) || 'research';

      // Stream buffered start — all content + TTS pre-generated on server
      // Loading screen stays up until first text event arrives
      await apiStartStream(personality, currentSettings, async (event) => {
        // Discard if user interrupted (sent a message or stopped)
        if (generationRef.current !== myGeneration) return;

        if (event.type === 'session' && event.session_id) {
          sessionRef.current = event.session_id;
          setSessionId(event.session_id);
          if (event.gpt_personality) gptPersonalityResult = event.gpt_personality;
          if (event.claude_personality) claudePersonalityResult = event.claude_personality;
        } else if (event.type === 'text') {
          // Dismiss loading screen on first text event — content is ready to play
          if (!loadingDismissed) {
            loadingDismissed = true;
            setLoading(false);
          }
          const who = event.speaker as 'gpt' | 'claude';
          addMsg(who, event.text);
          setStatus(who === 'gpt' ? 'ChatGPT speaking...' : 'Claude speaking...');
          autopilotMsgCountRef.current++;

          // Handle ping-pong countdown
          const textEvent = event as Record<string, unknown>;
          if (textEvent.msgs_until_review && isPingPong) {
            const m = pingPongModeNameRef.current;
            const countdownLabel = m === 'debate' ? 'Next motion'
              : m === 'advice' ? 'Next recommendation'
              : m === 'help_me_decide' ? 'Next decision'
              : 'Next finding';
            addMsg('system', `${countdownLabel} in ${textEvent.msgs_until_review} messages`);
          }
        } else if (event.type === 'audio') {
          await playAudioBase64(event.audio_base64, event.mime_type);
        } else if (event.type === 'done') {
          const doneEvent = event as Record<string, unknown>;
          startNextWho = (doneEvent.next_who as string) || null;
          startNextGenerator = (doneEvent.next_generator as string) || null;
        }
      }, ctrl.signal);

      // Sync random personality assignments
      if (onPersonalitiesAssigned && (gptPersonalityResult !== 'default' || claudePersonalityResult !== 'default')) {
        onPersonalitiesAssigned(gptPersonalityResult, claudePersonalityResult);
      }

      initDoneRef.current = true;
      const sid = sessionRef.current;
      if (!sid) { setStarted(false); return null; }

      dlog('start', 'Buffered start done, launching main loop...');
      runningRef.current = true;

      if (isPingPong && sid && !stoppedRef.current) {
        // First 2 messages already played — continue ping-pong from next_who
        const modeLabelMap: Record<string, string> = { debate: 'Debate', advice: 'Advising', conversation: 'Conversation', research: 'Research', help_me_decide: 'Deciding' };
        const modeLabel = modeLabelMap[currentSettings.mode as string] || 'Research';
        dlog('research', `Ping-pong mode — continuing from ${startNextWho}`);
        setStatus(currentSettings.mode === 'conversation' ? 'Bots chatting...' : `${modeLabel} in progress...`);
        runResearchPingPong(sid, startNextWho || (Math.random() < 0.5 ? 'gpt' : 'claude'));
      } else if (sid && !stoppedRef.current) {
        // First batch already played — backend prefetch already kicked off
        // Continue autopilot from next generator (no manual prefetch needed)
        const nextGen = startNextGenerator || 'claude';
        dlog('start', `First batch played — continuing autopilot via ${nextGen}`);
        setStatus('Bots chatting...');
        nextGeneratorRef.current = nextGen;
        runAutopilot(sid, nextGen);
      }
      return null;
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        addMsg('system', 'Oops — the bots are having a nap. Give it 30 seconds and try again, they just need to wake up!');
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

      // ---- PING-PONG MODE ---- Handle user interruption differently
      if (isPingPongModeRef.current) {
        // Discard any prefetched research response
        apiResearchDiscardPrefetch(sessionId);

        // Play bridge/filler response as usual
        runningRef.current = true;
        stoppedRef.current = false;
        await streamAndPlayFiller(sessionId, text, fillerCtrl);

        // Resume ping-pong after bridge
        runningRef.current = true;
        stoppedRef.current = false;

        chatModeTimerRef.current = setTimeout(() => {
          chatModeTimerRef.current = null;
          if (sessionRef.current && !stoppedRef.current) {
            const m = pingPongModeNameRef.current;
            dlog('research', 'User interruption handled — resuming ping-pong');
            setStatus(m === 'debate' ? 'Debate in progress...' : m === 'advice' ? 'Advising...' : 'Research in progress...');
            const starter = Math.random() < 0.5 ? 'gpt' : 'claude';
            runResearchPingPong(sessionRef.current, starter);
          }
        }, CHAT_MODE_TIMEOUT);
      } else {
        // ---- END PING-PONG MODE ----

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
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        addMsg('system', 'The bots tripped over each other. Try sending that again!');
        setStatus('Ready');
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
    addMsg('system', 'Resumed!');
    // ---- PING-PONG MODE ----
    if (isPingPongModeRef.current) {
      const m = pingPongModeNameRef.current;
      setStatus(m === 'debate' ? 'Debate in progress...' : m === 'advice' ? 'Advising...' : 'Research in progress...');
      const starter = Math.random() < 0.5 ? 'gpt' : 'claude';
      runResearchPingPong(sessionId, starter);
    } else {
      setStatus('Bots chatting...');
      runAutopilot(sessionId);
    }
    // ---- END PING-PONG MODE ----
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
    isPingPongModeRef.current = false; // ---- PING-PONG MODE ----
    pingPongModeNameRef.current = 'research';
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
