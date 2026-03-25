'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  apiStartStream,
  apiTurnStream,
  apiAutoStream,
  apiTranscribe,
  apiDeleteSession,
  apiUpdateSettings,
  type SSEEvent,
} from '@/lib/api';
import {
  initAudio,
  queueAudio,
  stopAllAudio,
  startMicRecording,
  stopMicRecording,
  requestMicPermission,
} from '@/lib/audio';

// ---- Types ----
type ChatMsg = {
  id: number;
  speaker: 'claude' | 'gpt' | 'user' | 'system';
  text: string;
  isThinking?: boolean;
};

const FREE_SESSION_LIMIT = 3;
const MAX_TURNS_PER_SESSION = 50;

const personalityLabels: [number, string][] = [
  [0.2, 'Very Agreeable'],
  [0.4, 'Mostly Agreeable'],
  [0.6, 'Balanced'],
  [0.8, 'Mostly Argumentative'],
  [1.01, 'Very Argumentative'],
];

function getPersonalityLabel(v: number): string {
  for (const [threshold, label] of personalityLabels) {
    if (v < threshold) return label;
  }
  return 'Very Argumentative';
}

let msgCounter = 0;
function nextId() { return ++msgCounter; }

// Track free sessions in localStorage
function getSessionCount(): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().slice(0, 10);
  const data = JSON.parse(localStorage.getItem('2bots_usage') || '{}');
  return data[today] || 0;
}

function incrementSessionCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  const data = JSON.parse(localStorage.getItem('2bots_usage') || '{}');
  data[today] = (data[today] || 0) + 1;
  localStorage.setItem('2bots_usage', JSON.stringify(data));
  return data[today];
}

// ---- Conversation starters ----
const CONVERSATION_IDEAS_LEFT = [
  'Will we ever achieve world peace?',
  'I need your advice',
  "What's the meaning of life?",
  "Let's play a game, who am I thinking of?",
  'I want to tell you both about my business idea',
  'Debate nature vs. nurture',
  'What will AI look like in 50 years?',
  'Tell me a story \u2014 I\u2019ll give you the characters',
];

const CONVERSATION_IDEAS_RIGHT = [
  'Convince me to quit my job',
  'What\u2019s the scariest thing about the future?',
  'Roast each other for 60 seconds',
  'If you could be human for a day, what would you do?',
  'Explain quantum physics like I\u2019m 5',
  'Is social media making us dumber?',
  'You\u2019re both detectives solving a murder mystery',
  'What conspiracy theory is most likely true?',
  'Argue about the best decade for music',
  'Plan me the perfect weekend',
];

const ALL_IDEAS = [...CONVERSATION_IDEAS_LEFT, ...CONVERSATION_IDEAS_RIGHT];

// Voice options (matches backend AVAILABLE_VOICES)
const VOICE_OPTIONS: Record<string, string> = {
  'en-US-AvaNeural':     'Ava (US)',
  'en-US-AndrewNeural':  'Andrew (US)',
  'en-US-JennyNeural':   'Jenny (US)',
  'en-US-GuyNeural':     'Guy (US)',
  'en-US-AriaNeural':    'Aria (US)',
  'en-US-DavisNeural':   'Davis (US)',
  'en-US-EmmaNeural':    'Emma (US)',
  'en-US-BrandonNeural': 'Brandon (US)',
  'en-GB-SoniaNeural':   'Sonia (UK)',
  'en-GB-RyanNeural':    'Ryan (UK)',
  'en-GB-LibbyNeural':   'Libby (UK)',
  'en-GB-ThomasNeural':  'Thomas (UK)',
  'en-GB-MaisieNeural':  'Maisie (UK)',
  'en-AU-NatashaNeural': 'Natasha (AU)',
  'en-AU-WilliamNeural': 'William (AU)',
  'en-IE-EmilyNeural':   'Emily (Irish)',
  'en-IE-ConnorNeural':  'Connor (Irish)',
  'en-IN-NeerjaNeural':  'Neerja (Indian)',
  'en-IN-PrabhatNeural': 'Prabhat (Indian)',
  'en-ZA-LeahNeural':    'Leah (S. African)',
  'en-ZA-LukeNeural':    'Luke (S. African)',
  'en-KE-AsiliaNeural':  'Asilia (Kenyan)',
  'en-KE-ChilembaNeural':'Chilemba (Kenyan)',
  'en-SG-LunaNeural':    'Luna (Singapore)',
  'en-SG-WayneNeural':   'Wayne (Singapore)',
};

const MODE_OPTIONS: Record<string, string> = {
  casual: 'Casual Chat',
  intellectual: 'Intellectual Debate',
  roleplay: 'Roleplay / Storytelling',
  comedy: 'Comedy Roast',
};

// ====== MAIN PAGE ======
export default function Home() {
  const [started, setStarted] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [personality, setPersonality] = useState(0.5);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [status, setStatus] = useState('');
  const [statusDot, setStatusDot] = useState('\u{1F3A4}');
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [listenState, setListenState] = useState<'idle' | 'waiting' | 'recording' | 'processing'>('idle');
  const [typedText, setTypedText] = useState('');
  const [partialText, setPartialText] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [stopped, setStopped] = useState(false);

  // Settings
  const [botMaxTokens, setBotMaxTokens] = useState(60);
  const [speechRate, setSpeechRate] = useState(10);
  const [userTimeout, setUserTimeout] = useState(3.0);
  const [doneSilence, setDoneSilence] = useState(2.5);
  const [interruptSens, setInterruptSens] = useState(0.04);
  const [micSens, setMicSens] = useState(0.004);
  const [gptVoice, setGptVoice] = useState('en-US-AvaNeural');
  const [claudeVoice, setClaudeVoice] = useState('en-US-AndrewNeural');
  const [conversationMode, setConversationMode] = useState('casual');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoLoopRef = useRef(false);
  const sessionRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoAbortRef = useRef<AbortController | null>(null);   // separate abort for auto-loop
  const pendingTextRef = useRef<Record<string, string>>({});
  const initDoneRef = useRef(false);  // true after opener finishes

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Abort any in-flight SSE streams
  const abortStreams = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  // Get a fresh AbortSignal for new stream calls
  const freshSignal = useCallback(() => {
    abortStreams();
    abortRef.current = new AbortController();
    return abortRef.current.signal;
  }, [abortStreams]);

  // Init audio
  useEffect(() => {
    initAudio({
      onPlayStart: (speaker) => {
        const label = speaker === 'gpt' ? 'ChatGPT' : 'Claude';
        setStatus(`${label} speaking...`);
        setStatusDot('\u{1F50A}');
      },
      onPlayEnd: () => {
        setStatus('Bots chatting...');
        setStatusDot('\u{1F4AC}');
      },
      onError: () => setStatusDot('\u{1F507}'),
    });
  }, []);

  // Message helpers
  const addMsg = useCallback((speaker: ChatMsg['speaker'], text: string, opts?: Partial<ChatMsg>) => {
    const msg: ChatMsg = { id: nextId(), speaker, text, ...opts };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }, []);

  const removeThinking = useCallback((speaker: string) => {
    setMessages((prev) => prev.filter(m => !(m.isThinking && m.speaker === speaker)));
  }, []);

  // ---- SSE event handler — buffers text, reveals it when audio STARTS PLAYING ----
  const handleSSE = useCallback((event: SSEEvent) => {
    if (event.type === 'session') {
      setSessionId(event.session_id);
    } else if (event.type === 'text') {
      // Buffer the text — don't show it yet, wait for actual playback
      pendingTextRef.current[event.speaker] = event.text;
      // Show thinking for claude after gpt text arrives
      if (event.speaker === 'gpt') {
        addMsg('claude', 'Claude is thinking...', { isThinking: true });
      }
    } else if (event.type === 'audio') {
      // Grab the buffered text for this speaker
      const buffered = pendingTextRef.current[event.speaker];
      const speaker = event.speaker as 'gpt' | 'claude';
      // Queue audio with an onStart callback that reveals text when playback begins
      queueAudio(event.speaker, event.audio_base64, event.mime_type, () => {
        removeThinking(speaker);
        if (buffered) {
          addMsg(speaker, buffered);
        }
      });
      if (buffered) {
        delete pendingTextRef.current[event.speaker];
      }
    }
  }, [addMsg, removeThinking]);

  // ---- AUTO-CONTINUE LOOP ----
  // Uses its OWN AbortController so it never kills the start/turn streams
  const runAutoLoop = useCallback(async (sid: string) => {
    autoLoopRef.current = true;

    while (autoLoopRef.current && sessionRef.current === sid) {
      if (!autoLoopRef.current || sessionRef.current !== sid) break;

      try {
        // Own controller — doesn't touch abortRef
        const controller = new AbortController();
        autoAbortRef.current = controller;
        await apiAutoStream(sid, handleSSE, controller.signal);
        setTurnCount(prev => {
          const next = prev + 1;
          if (next >= MAX_TURNS_PER_SESSION) {
            autoLoopRef.current = false;
            addMsg('system', 'Session limit reached. Start a new conversation.');
          }
          return next;
        });
        await new Promise(r => setTimeout(r, 400));
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') break;
        console.error('Auto loop error:', err);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }, [handleSSE, addMsg]);

  const stopAutoLoop = useCallback(() => {
    autoLoopRef.current = false;
    if (autoAbortRef.current) {
      autoAbortRef.current.abort();
      autoAbortRef.current = null;
    }
  }, []);

  // Auto-loop restarts whenever sessionId changes (but not before opener finishes)
  useEffect(() => {
    if (!sessionId || !initDoneRef.current) return;
    runAutoLoop(sessionId);
    return () => { stopAutoLoop(); };
  }, [sessionId, runAutoLoop, stopAutoLoop]);

  const getSettings = () => ({
    bot_max_tokens: botMaxTokens,
    speech_rate: `+${speechRate}%`,
    user_timeout: userTimeout,
    done_silence: doneSilence,
    interrupt_sens: interruptSens,
    mic_sens: micSens,
    gpt_voice: gptVoice,
    claude_voice: claudeVoice,
    conversation_mode: conversationMode,
  });

  // Hot-swap: push settings to backend AND flush audio queue so the user
  // immediately hears the new voice/mode on the very next utterance.
  // We use a ref to skip the flush on the initial render (only flush on actual changes).
  const settingsInitRef = useRef(false);
  useEffect(() => {
    if (!sessionId) return;

    const newSettings = {
      gpt_voice: gptVoice,
      claude_voice: claudeVoice,
      conversation_mode: conversationMode,
      bot_max_tokens: botMaxTokens,
      speech_rate: `+${speechRate}%`,
    };

    // Push to backend
    apiUpdateSettings(sessionId, newSettings);

    // On actual user-driven changes (not initial mount), flush everything queued
    // and restart so the next response uses the new settings immediately
    if (settingsInitRef.current && initDoneRef.current) {
      abortStreams();
      stopAllAudio();
      stopAutoLoop();
      pendingTextRef.current = {};
      setMessages(prev => prev.filter(m => !m.isThinking));
      // Small delay so the backend processes the update before we ask for new audio
      setTimeout(() => {
        if (sessionRef.current === sessionId) {
          runAutoLoop(sessionId);
        }
      }, 150);
    }
    settingsInitRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gptVoice, claudeVoice, conversationMode, botMaxTokens, speechRate]);

  // ---- START ----
  const handleStart = async () => {
    const count = getSessionCount();
    if (count >= FREE_SESSION_LIMIT) {
      setShowPricing(true);
      return;
    }

    setLoading(true);

    // Request mic permission early so the browser prompt appears now
    requestMicPermission();

    try {
      incrementSessionCount();
      setStarted(true);
      setStopped(false);
      setTurnCount(0);
      setStatus('Warming up...');
      setStatusDot('\u{1F7E2}');
      addMsg('system', 'Conversation started \u2014 bots are chatting. Hit INTERRUPT to jump in!');

      const signal = freshSignal();
      await apiStartStream(personality, getSettings(), handleSSE, signal);
      setStatus('Bots chatting...');

      // Opener is done — NOW start the auto-loop
      initDoneRef.current = true;
      if (sessionRef.current) {
        runAutoLoop(sessionRef.current);
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        alert('Failed to start. Make sure the backend is running.\n\n' + (err as Error).message);
        setStarted(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // ---- SEND TEXT (also used by idea chips) ----
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || typedText).trim();
    if (!text || !sessionId) return;

    abortStreams();
    stopAllAudio();       // interrupt whatever's playing right now
    stopAutoLoop();
    // Clear any buffered text that hasn't been shown yet
    pendingTextRef.current = {};
    setMessages(prev => prev.filter(m => !m.isThinking));
    addMsg('user', text);
    if (!overrideText) setTypedText('');
    setStatus('Getting response...');
    setStatusDot('\u{23F3}');

    try {
      const signal = freshSignal();
      await apiTurnStream(sessionId, text, handleSSE, signal);
      setTurnCount(prev => prev + 1);
      // Resume auto-loop after the bots respond to the user
      setStatus('Bots chatting...');
      setStatusDot('\u{1F4AC}');
      if (sessionRef.current) runAutoLoop(sessionRef.current);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        addMsg('system', `Error: ${(err as Error).message}`);
        setStatus('Error');
      }
    }
    inputRef.current?.focus();
  };

  // ---- INTERRUPT (mic recording) ----
  const handleListen = async () => {
    if (!sessionId) return;

    if (listenState === 'recording') {
      setListenState('processing');
      setStatus('Transcribing...');
      setStatusDot('\u{23F3}');

      const blob = await stopMicRecording();
      if (!blob) {
        setStatus('No audio captured');
        setListenState('idle');
        // Resume auto-loop
        if (sessionRef.current) runAutoLoop(sessionRef.current);
        return;
      }

      try {
        const result = await apiTranscribe(sessionId, blob, partialText || undefined);
        setPartialText('');

        if (result.text) {
          addMsg('user', result.text);
          setStatus('Getting response...');
          const signal = freshSignal();
          await apiTurnStream(sessionId, result.text, handleSSE, signal);
          setTurnCount(prev => prev + 1);
        } else {
          addMsg('system', "Didn't catch that \u2014 try again.");
          setStatus("Didn't catch that");
        }
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          addMsg('system', `Error: ${(err as Error).message}`);
          setStatus('Error');
        }
      }

      setListenState('idle');
      // Resume auto-loop after user speaks
      setStatus('Bots chatting...');
      setStatusDot('\u{1F4AC}');
      if (sessionRef.current) runAutoLoop(sessionRef.current);
      return;
    }

    // Interrupt — stop everything and start recording
    abortStreams();
    stopAllAudio();
    stopAutoLoop();
    pendingTextRef.current = {};
    setMessages(prev => prev.filter(m => !m.isThinking));
    setListenState('waiting');
    setStatus('Clearing mic...');
    setStatusDot('\u{1F507}');

    await new Promise(r => setTimeout(r, 1200));
    if (!sessionId) return;

    try {
      await startMicRecording();
      setListenState('recording');
      setStatus("Go ahead, they're listening...");
      setStatusDot('\u{1F7E2}');
    } catch {
      setStatus('Mic access denied');
      setStatusDot('\u{1F507}');
      addMsg('system', 'Microphone blocked. Try typing instead, or allow mic in your browser settings.');
      setListenState('idle');
      // Resume auto-loop if mic fails
      if (sessionRef.current) runAutoLoop(sessionRef.current);
    }
  };

  // ---- STOP ----
  const handleStop = () => {
    abortStreams();
    stopAllAudio();
    stopAutoLoop();
    pendingTextRef.current = {};
    if (listenState === 'recording') stopMicRecording();
    setListenState('idle');
    setStopped(true);
    setStatus('Paused');
    setStatusDot('\u{23F8}');
    // Remove any thinking indicators
    setMessages(prev => prev.filter(m => !m.isThinking));
    addMsg('system', 'Conversation paused. Hit GO to resume or NEW to start over.');
  };

  // ---- GO (resume after stop) ----
  const handleGo = () => {
    if (!sessionId) return;
    setStopped(false);
    setStatus('Bots chatting...');
    setStatusDot('\u{1F4AC}');
    addMsg('system', 'Resumed!');
    runAutoLoop(sessionId);
  };

  // ---- END (fully end session) ----
  const handleEnd = () => {
    abortStreams();
    stopAllAudio();
    stopAutoLoop();
    pendingTextRef.current = {};
    initDoneRef.current = false;
    if (listenState === 'recording') stopMicRecording();
    setListenState('idle');
    setStopped(false);
    setStatus('Conversation ended');
    setStatusDot('\u{23F9}');
    setMessages(prev => prev.filter(m => !m.isThinking));
    addMsg('system', 'Conversation ended.');

    if (sessionId) {
      apiDeleteSession(sessionId);
      setSessionId(null);
    }
  };

  // ---- NEW CONVERSATION (after stop) ----
  const handleNewConversation = () => {
    const count = getSessionCount();
    if (count >= FREE_SESSION_LIMIT) {
      setShowPricing(true);
      return;
    }
    setMessages([]);
    setStarted(false);
    setSessionId(null);
    setTurnCount(0);
    initDoneRef.current = false;
  };

  // ====== PRICING OVERLAY ======
  if (showPricing) {
    return (
      <div className="min-h-screen bg-bot-bg flex items-center justify-center px-6">
        <div className="max-w-lg text-center animate-fade-in" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          <h1 className="text-4xl font-normal tracking-wide mb-2">You&apos;re hooked!</h1>
          <p className="text-bot-muted mb-8">
            You&apos;ve used your {FREE_SESSION_LIMIT} free conversations for today.
            Upgrade to Pro to keep the conversation going.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            <div className="bg-bot-panel rounded-xl p-5 border border-white/5 text-left">
              <h3 className="font-normal tracking-wide mb-1">Free</h3>
              <div className="text-2xl font-normal mb-3">$0</div>
              <ul className="text-sm text-bot-muted space-y-1.5">
                <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>{FREE_SESSION_LIMIT} conversations / day</li>
                <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Voice + text</li>
                <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>All features</li>
              </ul>
            </div>

            <div className="bg-bot-panel rounded-xl p-5 border-2 border-bot-user text-left">
              <h3 className="font-normal tracking-wide mb-1">Pro</h3>
              <div className="mb-3">
                <span className="text-2xl font-normal">$9.99</span>
                <span className="text-bot-muted text-sm">/month</span>
              </div>
              <ul className="text-sm text-bot-muted space-y-1.5">
                <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Unlimited conversations</li>
                <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Priority speed</li>
                <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Conversation history</li>
                <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Early access to new features</li>
              </ul>
              <button className="mt-4 w-full bg-bot-user text-bot-bg py-2 rounded-lg font-normal text-sm tracking-wide hover:opacity-90 transition">
                Upgrade to Pro
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowPricing(false)}
            className="text-sm text-bot-muted hover:text-bot-text transition"
          >
            Come back tomorrow for more free conversations
          </button>
        </div>
      </div>
    );
  }

  // ====== RENDER ======
  return (
    <div className="min-h-screen bg-bot-bg flex flex-col items-center">

      {/* ===== START SCREEN ===== */}
      {!started && (
        <div className="w-full max-w-[620px] flex flex-col min-h-screen md:min-h-0">
          <div className="flex flex-col items-center justify-center text-center px-6 min-h-screen md:min-h-[85vh]">
            <h1 className="text-7xl md:text-8xl font-light tracking-widest mb-1 text-bot-text" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              2BOTS
            </h1>
            <p className="text-base text-bot-muted mb-12 font-normal">
              Claude &amp; ChatGPT
            </p>

            <div className="flex items-center gap-3 w-full max-w-sm mb-1">
              <span className="text-xs text-bot-gpt font-normal">Agreeable</span>
              <input
                type="range" min={0} max={1} step={0.05} value={personality}
                onChange={(e) => setPersonality(parseFloat(e.target.value))}
                className="flex-1 h-1.5"
              />
              <span className="text-xs text-bot-claude font-normal">Argumentative</span>
            </div>
            <p className="text-xs text-bot-muted mb-10 font-normal">{getPersonalityLabel(personality)}</p>

            <button
              onClick={handleStart}
              disabled={loading}
              className="bg-bot-user text-bot-bg px-16 py-3 rounded text-lg font-normal tracking-[0.2em] hover:opacity-90 transition disabled:opacity-50 mb-3"
              style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
            >
              {loading ? 'Starting...' : 'START'}
            </button>
            <p className="text-[10px] text-bot-muted/40 mt-3 font-normal">
              Requires ANTHROPIC_API_KEY and OPENAI_API_KEY
            </p>

            {/* Minimal footer on start screen */}
            <div className="absolute bottom-4 text-[10px] text-bot-muted/30 flex gap-3">
              <Link href="/terms" className="hover:text-bot-muted/60 transition">Terms</Link>
              <Link href="/privacy" className="hover:text-bot-muted/60 transition">Privacy</Link>
              <span>2bots.io</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHAT (with side idea panels) ===== */}
      {started && (
        <div className="w-full flex justify-center gap-4 px-2 md:px-6">

          {/* LEFT IDEAS — desktop only */}
          {sessionId && (
            <div className="hidden lg:flex flex-col gap-2 pt-12 w-48 shrink-0 items-end">
              {CONVERSATION_IDEAS_LEFT.map((idea) => (
                <button
                  key={idea}
                  onClick={() => handleSend(idea)}
                  className="text-right text-xs text-bot-muted/70 hover:text-bot-text bg-bot-panel/50 hover:bg-bot-panel border border-white/5 hover:border-white/10 rounded-lg px-3 py-2 transition leading-snug"
                >
                  {idea}
                </button>
              ))}
            </div>
          )}

          {/* CHAT COLUMN */}
          <div className="w-full max-w-[620px] flex flex-col min-h-screen md:min-h-0 md:my-6">
            <div className="flex flex-col flex-1 md:rounded-xl md:border md:border-white/5 md:overflow-hidden bg-bot-bg md:max-h-[calc(100vh-48px)] md:min-h-[600px]">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-bot-panel border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  <span className="text-bot-claude font-normal text-sm tracking-wide">CLAUDE</span>
                  <span className="text-bot-muted text-xs">&amp;</span>
                  <span className="text-bot-gpt font-normal text-sm tracking-wide">ChatGPT</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-bot-muted truncate max-w-[120px]">{status}</span>
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="text-bot-muted hover:text-bot-text text-lg transition"
                    title="Settings"
                  >&#9881;</button>
                </div>
              </div>

              {/* Settings */}
              {settingsOpen && (
                <div className="bg-bot-settings px-4 py-3 border-b border-white/5 shrink-0 max-h-[50vh] overflow-y-auto">
                  <div className="grid grid-cols-[120px_1fr_42px] gap-x-3 gap-y-2.5 items-center text-xs">

                    {/* Conversation mode */}
                    <label className="text-bot-muted">Mode</label>
                    <select value={conversationMode} onChange={(e) => setConversationMode(e.target.value)}
                      className="col-span-2 bg-bot-bg border border-white/10 rounded px-2 py-1 text-bot-text text-xs outline-none">
                      {Object.entries(MODE_OPTIONS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>

                    {/* Voice pickers */}
                    <label className="text-bot-gpt">ChatGPT voice</label>
                    <select value={gptVoice} onChange={(e) => setGptVoice(e.target.value)}
                      className="col-span-2 bg-bot-bg border border-white/10 rounded px-2 py-1 text-bot-text text-xs outline-none">
                      {Object.entries(VOICE_OPTIONS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>

                    <label className="text-bot-claude">Claude voice</label>
                    <select value={claudeVoice} onChange={(e) => setClaudeVoice(e.target.value)}
                      className="col-span-2 bg-bot-bg border border-white/10 rounded px-2 py-1 text-bot-text text-xs outline-none">
                      {Object.entries(VOICE_OPTIONS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>

                    {/* Divider */}
                    <div className="col-span-3 border-t border-white/5 my-1" />

                    <label className="text-bot-muted">Response length</label>
                    <input type="range" min={20} max={200} step={10} value={botMaxTokens}
                      onChange={(e) => setBotMaxTokens(parseInt(e.target.value))}
                      className="settings-slider w-full" />
                    <span className="text-right tabular-nums">{botMaxTokens}</span>

                    <label className="text-bot-muted">Speech speed</label>
                    <input type="range" min={0} max={40} step={5} value={speechRate}
                      onChange={(e) => setSpeechRate(parseInt(e.target.value))}
                      className="settings-slider w-full" />
                    <span className="text-right tabular-nums">+{speechRate}%</span>

                    <label className="text-bot-muted">User timeout (s)</label>
                    <input type="range" min={1} max={10} step={0.5} value={userTimeout}
                      onChange={(e) => setUserTimeout(parseFloat(e.target.value))}
                      className="settings-slider w-full" />
                    <span className="text-right tabular-nums">{userTimeout.toFixed(1)}</span>

                    <label className="text-bot-muted">Done silence (s)</label>
                    <input type="range" min={0.5} max={5} step={0.5} value={doneSilence}
                      onChange={(e) => setDoneSilence(parseFloat(e.target.value))}
                      className="settings-slider w-full" />
                    <span className="text-right tabular-nums">{doneSilence.toFixed(1)}</span>

                    <label className="text-bot-muted">Interrupt sens</label>
                    <input type="range" min={0.01} max={0.1} step={0.005} value={interruptSens}
                      onChange={(e) => setInterruptSens(parseFloat(e.target.value))}
                      className="settings-slider w-full" />
                    <span className="text-right tabular-nums">{interruptSens.toFixed(3)}</span>

                    <label className="text-bot-muted">Mic sensitivity</label>
                    <input type="range" min={0.001} max={0.02} step={0.001} value={micSens}
                      onChange={(e) => setMicSens(parseFloat(e.target.value))}
                      className="settings-slider w-full" />
                    <span className="text-right tabular-nums">{micSens.toFixed(3)}</span>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} />
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Mobile idea chips */}
              {sessionId && (
                <div className="lg:hidden flex gap-2 overflow-x-auto px-4 pb-2 shrink-0 scrollbar-hide">
                  {ALL_IDEAS.map((idea) => (
                    <button
                      key={idea}
                      onClick={() => handleSend(idea)}
                      className="whitespace-nowrap text-[11px] text-bot-muted/70 hover:text-bot-text bg-bot-panel/50 hover:bg-bot-panel border border-white/5 hover:border-white/10 rounded-full px-3 py-1.5 transition shrink-0"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              )}

              {/* Partial transcription */}
              {partialText && (
                <div className="mx-4 mb-2 bg-bot-panel/90 border border-bot-user/30 rounded-lg px-4 py-1.5 text-xs text-bot-user text-center">
                  {partialText}
                </div>
              )}

              {/* Bottom controls */}
              <div className="shrink-0 bg-bot-panel border-t border-white/5 px-4 py-3">

                {/* INTERRUPT */}
                <button
                  onClick={handleListen}
                  disabled={!sessionId || listenState === 'waiting' || listenState === 'processing'}
                  className={`w-full py-2.5 rounded-lg font-normal text-sm tracking-wide transition mb-2 ${
                    listenState === 'recording'
                      ? 'bg-green-500 text-white animate-rec-pulse'
                      : listenState === 'waiting' || listenState === 'processing'
                      ? 'bg-bot-muted text-bot-bg cursor-wait'
                      : 'bg-bot-user text-bot-bg hover:opacity-90'
                  }`}
                >
                  {listenState === 'recording'
                    ? '\u{1F7E2} LISTENING... (tap to send)'
                    : listenState === 'waiting' ? 'WAIT...'
                    : listenState === 'processing' ? 'PROCESSING...'
                    : 'INTERRUPT'}
                </button>

                {/* Text input */}
                <div className="flex gap-2 mb-2.5">
                  <input
                    ref={inputRef}
                    type="text" value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Or type here..."
                    disabled={!sessionId}
                    className="flex-1 bg-bot-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-bot-text placeholder:text-bot-muted outline-none focus:border-bot-user transition"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!sessionId || !typedText.trim()}
                    className="bg-bot-user text-bot-bg px-4 py-2 rounded-lg font-normal text-xs tracking-wide hover:opacity-90 transition disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>

                {/* Bottom row: status + GO / STOP / END / NEW */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 shrink">
                    <span className="text-sm shrink-0">{statusDot}</span>
                    <span className="text-[11px] text-bot-muted truncate">{status}</span>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {stopped && sessionId && (
                      <button
                        onClick={handleGo}
                        className="px-3 py-1 bg-green-600/20 border border-green-500/40 rounded-md text-[11px] font-normal tracking-wide text-green-400 hover:bg-green-600/30 transition"
                      >
                        GO
                      </button>
                    )}
                    {!sessionId && (
                      <button
                        onClick={handleNewConversation}
                        className="px-3 py-1 bg-bot-user/10 border border-bot-user/30 rounded-md text-[11px] font-normal tracking-wide text-bot-user hover:bg-bot-user/20 transition"
                      >
                        NEW
                      </button>
                    )}
                    {sessionId && !stopped && (
                      <button
                        onClick={handleStop}
                        className="px-3 py-1 border border-white/10 rounded-md text-[11px] font-normal tracking-wide text-bot-text hover:bg-white/5 transition"
                      >
                        STOP
                      </button>
                    )}
                    {sessionId && (
                      <button
                        onClick={handleEnd}
                        className="px-3 py-1 border border-red-500/20 rounded-md text-[11px] font-normal tracking-wide text-red-400/70 hover:bg-red-500/10 transition"
                      >
                        END
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT IDEAS — desktop only */}
          {sessionId && (
            <div className="hidden lg:flex flex-col gap-2 pt-12 w-48 shrink-0 items-start">
              {CONVERSATION_IDEAS_RIGHT.map((idea) => (
                <button
                  key={idea}
                  onClick={() => handleSend(idea)}
                  className="text-left text-xs text-bot-muted/70 hover:text-bot-text bg-bot-panel/50 hover:bg-bot-panel border border-white/5 hover:border-white/10 rounded-lg px-3 py-2 transition leading-snug"
                >
                  {idea}
                </button>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ---- Chat bubble ----
function ChatBubble({ msg }: { msg: ChatMsg }) {
  if (msg.speaker === 'system') {
    return (
      <div className="text-center text-[11px] text-bot-muted italic py-0.5">
        {msg.text}
      </div>
    );
  }

  if (msg.isThinking) {
    return (
      <div className="text-[12px] text-bot-muted italic animate-thinking px-3 py-1 self-start">
        {msg.text}
      </div>
    );
  }

  const styles: Record<string, string> = {
    claude: 'border-bot-claude/20 bg-bot-claude/[0.08]',
    gpt: 'border-bot-gpt/20 bg-bot-gpt/[0.07]',
    user: 'border-bot-user/20 bg-bot-user/[0.08]',
  };

  const nameColors: Record<string, string> = {
    claude: 'text-bot-claude',
    gpt: 'text-bot-gpt',
    user: 'text-bot-user',
  };

  const labels: Record<string, string> = {
    claude: 'Claude',
    gpt: 'ChatGPT',
    user: 'You',
  };

  return (
    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed border ${
      styles[msg.speaker] || ''
    } ${msg.speaker === 'user' ? 'self-end' : 'self-start'} animate-fade-in`}>
      <span className={`text-[10px] font-normal tracking-wide block mb-0.5 ${nameColors[msg.speaker] || ''}`}>
        {labels[msg.speaker] || msg.speaker}
      </span>
      {msg.text}
    </div>
  );
}
