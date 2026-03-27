'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { usePipeline } from '@/hooks/usePipeline';
import { useSettings } from '@/hooks/useSettings';
import { useSpeechInput } from '@/hooks/useSpeechInput';

import ChatBubble from '@/components/ChatBubble';
import BotSettingsPanel from '@/components/BotSettingsPanel';
import PricingOverlay from '@/components/PricingOverlay';
import StartupLoader from '@/components/StartupLoader';
// SettingsCountdown removed — replaced with simple toast


import {
  MODES_LANDING,
  MODES_CONVERSATION,
  CONVERSATION_IDEAS,
  PERSONALITY_OPTIONS,
  QUIRK_OPTIONS,
  VOICE_OPTIONS,
  getPersonalityLabel,
} from '@/lib/constants';

export default function Home() {
  const [showPricing, setShowPricing] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showGptSettings, setShowGptSettings] = useState(false);
  const [showClaudeSettings, setShowClaudeSettings] = useState(false);

  // Rotating placeholder from conversation ideas
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const placeholderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    placeholderTimerRef.current = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % CONVERSATION_IDEAS.length);
    }, 4000);
    return () => { if (placeholderTimerRef.current) clearInterval(placeholderTimerRef.current); };
  }, []);

  const pipeline = usePipeline();
  const settings = useSettings(pipeline.sessionId, pipeline.onSettingsChanged);

  // Randomize helpers
  const randomizeFormat = () => {
    const modes = pipeline.started ? MODES_CONVERSATION : MODES_LANDING;
    const keys = Object.keys(modes).filter(k => k !== 'random' && k !== 'mix');
    settings.setInteractionStyle(keys[Math.floor(Math.random() * keys.length)]);
  };

  const randomizeBot = (bot: 'gpt' | 'claude') => {
    const pKeys = Object.keys(PERSONALITY_OPTIONS).filter(k => k !== 'default');
    const personality = pKeys[Math.floor(Math.random() * pKeys.length)];
    const strength = Math.floor(Math.random() * 4);
    const qKeys = Object.keys(QUIRK_OPTIONS);
    const numQuirks = Math.floor(Math.random() * 3); // 0-2 quirks
    const shuffled = [...qKeys].sort(() => Math.random() - 0.5);
    const selectedQuirks = shuffled.slice(0, numQuirks);
    const vKeys = Object.keys(VOICE_OPTIONS);
    const voice = vKeys[Math.floor(Math.random() * vKeys.length)];

    if (bot === 'gpt') {
      settings.setGptPersonality(personality);
      settings.setGptPersonalityStrength(strength);
      settings.setGptVoice(voice);
      // Clear existing quirks then add new ones
      settings.gptQuirks.forEach(q => settings.toggleQuirk('gpt', q));
      selectedQuirks.forEach(q => settings.toggleQuirk('gpt', q));
    } else {
      settings.setClaudePersonality(personality);
      settings.setClaudePersonalityStrength(strength);
      settings.setClaudeVoice(voice);
      settings.claudeQuirks.forEach(q => settings.toggleQuirk('claude', q));
      selectedQuirks.forEach(q => settings.toggleQuirk('claude', q));
    }
  };

  const speech = useSpeechInput({
    sessionId: pipeline.sessionId,
    inputRef: pipeline.inputRef,
    stopPipeline: pipeline.stopPipeline,
    setStopped: pipeline.setStopped,
    stoppedRef: pipeline.stoppedRef,
    setStatus: pipeline.setStatus,
    setMessages: pipeline.setMessages,
    addMsg: pipeline.addMsg,
    freshAbort: pipeline.freshAbort,
    fetchRound: pipeline.fetchRound,
    playRound: pipeline.playRound,
    runPipeline: pipeline.runPipeline,
    runningRef: pipeline.runningRef,
    sessionRef: pipeline.sessionRef,
    abortRef: pipeline.abortRef,
  });

  const handleStartClick = async () => {
    // If "random" is selected, pick a random format and lock it in
    if (settings.interactionStyle === 'random') {
      const formatKeys = Object.keys(MODES_CONVERSATION).filter(k => k !== 'mix');
      const randomFormat = formatKeys[Math.floor(Math.random() * formatKeys.length)];
      settings.setInteractionStyle(randomFormat);
    }
    const result = await pipeline.handleStart(settings.getSettings, (gptP, claudeP) => {
      if (gptP !== 'default') settings.setGptPersonality(gptP);
      if (claudeP !== 'default') settings.setClaudePersonality(claudeP);
    });
    if (result === 'pricing') setShowPricing(true);
  };

  const handleSendClick = (overrideText?: string) => {
    pipeline.handleSend(overrideText, typedText, () => setTypedText(''));
  };

  const handleNewClick = () => {
    const result = pipeline.handleNewConversation(settings.resetSettingsInit);
    if (result === 'pricing') setShowPricing(true);
  };

  const isStartingUp = pipeline.loading && !pipeline.messages.some(m => m.speaker === 'gpt' || m.speaker === 'claude');

  if (showPricing) {
    return <PricingOverlay onClose={() => setShowPricing(false)} />;
  }

  return (
    <div className="h-screen h-[100dvh] bg-bot-bg flex flex-col items-center overflow-hidden">
      <div className="w-full h-full flex justify-center gap-4 px-2 md:px-6">

        {/* LEFT PANEL: ChatGPT — slide-in overlay */}
        {pipeline.started && pipeline.sessionId && (
          <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 ease-in-out ${showGptSettings ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-full bg-bot-panel border-r border-white/10 shadow-2xl overflow-y-auto w-64 p-3 pt-12">
              <button
                onClick={() => setShowGptSettings(false)}
                className="absolute top-2 right-2 text-bot-muted hover:text-bot-text text-sm transition"
              >✕</button>
              <BotSettingsPanel
                bot="gpt"
                personality={settings.gptPersonality}
                setPersonality={settings.setGptPersonality}
                personalityStrength={settings.gptPersonalityStrength}
                setPersonalityStrength={settings.setGptPersonalityStrength}
                voice={settings.gptVoice}
                setVoice={settings.setGptVoice}
                ttsSpeed={settings.gptTtsSpeed}
                setTtsSpeed={settings.setGptTtsSpeed}
                quirks={settings.gptQuirks}
                toggleQuirk={settings.toggleQuirk}
                responseLength={settings.gptResponseLength}
                setResponseLength={settings.setGptResponseLength}
                custom={settings.gptCustom}
                setCustom={settings.setGptCustom}
                customTrait={settings.gptCustomTrait}
                setCustomTrait={settings.setGptCustomTrait}
                onRandomize={() => randomizeBot('gpt')}
              />
            </div>
          </div>
        )}

        {/* CHAT COLUMN */}
        <div className="w-full max-w-[620px] flex flex-col h-full md:my-4 md:max-h-[calc(100vh-32px)]">
          <div className="flex flex-col flex-1 min-h-0 md:rounded-xl md:border md:border-white/5 overflow-hidden bg-bot-bg md:min-h-[600px]">

            {/* Header — single row: ChatGPT | status | Format about Topic | Claude */}
            <div className="bg-bot-panel border-b border-white/5 shrink-0 px-3 py-1.5" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              <div className="flex items-center justify-between gap-1">
                <button
                  onClick={() => pipeline.started && setShowGptSettings(!showGptSettings)}
                  className={`text-bot-gpt font-normal text-xs tracking-wide transition-opacity hover:opacity-70 shrink-0 ${pipeline.started ? 'opacity-100 cursor-pointer' : 'opacity-0 cursor-default'}`}
                ><span className="hidden md:inline">⚙ ChatGPT</span><span className="md:hidden">⚙</span></button>

                {pipeline.started && !isStartingUp && (
                  <span className="text-[9px] text-bot-muted truncate max-w-[90px] shrink-0">{pipeline.status}</span>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={randomizeFormat} title="Random format"
                    className="text-[10px] text-bot-muted hover:text-bot-text transition px-0.5">🎲</button>
                  <select value={settings.interactionStyle} onChange={(e) => settings.setInteractionStyle(e.target.value)}
                    className="bg-bot-bg border border-white/10 rounded px-1 py-0.5 text-bot-text text-[10px] outline-none">
                    {Object.entries(pipeline.started ? MODES_CONVERSATION : MODES_LANDING).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <span className="text-[9px] text-bot-muted">on</span>
                  <input
                    type="text"
                    value={settings.topic}
                    onChange={(e) => settings.setTopic(e.target.value)}
                    placeholder="Random"
                    className="bg-bot-bg border border-white/10 rounded px-1 py-0.5 text-bot-text text-[10px] outline-none w-20 placeholder:text-bot-muted/50 focus:border-bot-user transition"
                  />
                </div>

                <button
                  onClick={() => pipeline.started && setShowClaudeSettings(!showClaudeSettings)}
                  className={`text-bot-claude font-normal text-xs tracking-wide transition-opacity hover:opacity-70 shrink-0 ${pipeline.started ? 'opacity-100 cursor-pointer' : 'opacity-0 cursor-default'}`}
                ><span className="hidden md:inline">Claude ⚙</span><span className="md:hidden">⚙</span></button>
              </div>
            </div>

            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {!pipeline.started && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                  <h1 className="text-7xl md:text-8xl font-light tracking-widest mb-1 text-bot-text" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                    2BOTS
                  </h1>
                  <p className="text-base text-bot-muted mb-10 font-normal">
                    ChatGPT &amp; Claude
                  </p>

                  <div className="flex items-center gap-3 w-full max-w-sm mb-1">
                    <span className="text-xs text-bot-gpt font-normal">Agreeable</span>
                    <input
                      type="range" min={0} max={1} step={0.05} value={pipeline.personality}
                      onChange={(e) => pipeline.setPersonality(parseFloat(e.target.value))}
                      className="flex-1 h-1.5"
                    />
                    <span className="text-xs text-bot-claude font-normal">Disagreeable</span>
                  </div>
                  <p className="text-xs text-bot-muted mb-4 font-normal">{getPersonalityLabel(pipeline.personality)}</p>

                  <div className="mt-8 text-[10px] text-bot-muted/30 flex gap-3">
                    <Link href="/terms" className="hover:text-bot-muted/60 transition">Terms</Link>
                    <Link href="/privacy" className="hover:text-bot-muted/60 transition">Privacy</Link>
                    <span>2bots.ai</span>
                  </div>
                </div>
              )}

              {isStartingUp && (
                <StartupLoader />
              )}

              {pipeline.started && pipeline.messages
                .filter(msg => !(isStartingUp && msg.speaker === 'system'))
                .map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} />
                ))}
              <div ref={pipeline.chatEndRef} />
            </div>

            {/* Bottom controls — compact */}
            <div className="shrink-0 bg-bot-panel border-t border-white/5 px-3 py-2">
              {!pipeline.started ? (
                <button
                  onClick={handleStartClick}
                  disabled={pipeline.loading}
                  className="w-full py-2.5 rounded-lg font-normal text-sm tracking-[0.15em] transition bg-bot-user text-bot-bg hover:opacity-90 disabled:opacity-50"
                  style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                >
                  {pipeline.loading ? 'Starting...' : 'START'}
                </button>
              ) : (
                <>
                  {/* Input + mic + Send + action buttons — all one row */}
                  <div className="flex gap-1.5 items-center">
                    <div className="flex-1 min-w-0 relative">
                      <input
                        ref={pipeline.inputRef}
                        type="text" value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendClick()}
                        placeholder={CONVERSATION_IDEAS[placeholderIdx]}
                        disabled={!pipeline.sessionId}
                        className="w-full bg-bot-bg border border-white/10 rounded px-2 py-1.5 pr-8 text-xs text-bot-text placeholder:text-bot-muted/40 outline-none focus:border-bot-user transition"
                      />
                      {pipeline.sessionId && (
                        <button
                          onClick={speech.handleInterrupt}
                          className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition ${
                            speech.recording
                              ? 'text-[#10a37f] animate-pulse'
                              : 'text-bot-muted/50 hover:text-bot-text'
                          }`}
                          title={speech.recording ? 'Tap to send' : 'Voice input'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="23"/>
                            <line x1="8" y1="23" x2="16" y2="23"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    {/* Send — arrow icon */}
                    <button
                      onClick={() => handleSendClick()}
                      disabled={!pipeline.sessionId || !typedText.trim()}
                      className="w-8 h-8 flex items-center justify-center bg-white/10 border border-white/10 rounded-lg text-bot-text hover:bg-white/20 transition disabled:opacity-30 shrink-0"
                      title="Send"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </button>
                    {/* Pause/Play toggle */}
                    {pipeline.sessionId && (
                      <button
                        onClick={pipeline.stopped ? pipeline.handleGo : pipeline.handleStop}
                        className="w-8 h-8 flex items-center justify-center bg-white/10 border border-white/10 rounded-lg text-bot-text hover:bg-white/20 transition shrink-0"
                        title={pipeline.stopped ? 'Resume' : 'Pause'}
                      >
                        {pipeline.stopped ? '▶' : '⏸'}
                      </button>
                    )}
                    {/* New conversation */}
                    <button onClick={handleNewClick}
                      className="w-8 h-8 flex items-center justify-center bg-white/10 border border-white/10 rounded-lg text-bot-text hover:bg-white/20 transition shrink-0"
                      title="New conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Claude — slide-in overlay */}
        {pipeline.started && pipeline.sessionId && (
          <div className={`fixed right-0 top-0 h-full z-30 transition-transform duration-300 ease-in-out ${showClaudeSettings ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full bg-bot-panel border-l border-white/10 shadow-2xl overflow-y-auto w-64 p-3 pt-12">
              <button
                onClick={() => setShowClaudeSettings(false)}
                className="absolute top-2 left-2 text-bot-muted hover:text-bot-text text-sm transition"
              >✕</button>
              <BotSettingsPanel
                bot="claude"
                personality={settings.claudePersonality}
                setPersonality={settings.setClaudePersonality}
                personalityStrength={settings.claudePersonalityStrength}
                setPersonalityStrength={settings.setClaudePersonalityStrength}
                voice={settings.claudeVoice}
                setVoice={settings.setClaudeVoice}
                ttsSpeed={settings.claudeTtsSpeed}
                setTtsSpeed={settings.setClaudeTtsSpeed}
                quirks={settings.claudeQuirks}
                toggleQuirk={settings.toggleQuirk}
                responseLength={settings.claudeResponseLength}
                setResponseLength={settings.setClaudeResponseLength}
                custom={settings.claudeCustom}
                setCustom={settings.setClaudeCustom}
                customTrait={settings.claudeCustomTrait}
                setCustomTrait={settings.setClaudeCustomTrait}
                onRandomize={() => randomizeBot('claude')}
              />
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
