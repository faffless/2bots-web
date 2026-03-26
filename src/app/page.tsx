'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { usePipeline } from '@/hooks/usePipeline';
import { useSettings } from '@/hooks/useSettings';
import { useSpeechInput } from '@/hooks/useSpeechInput';

import ChatBubble from '@/components/ChatBubble';
import BotSettingsPanel from '@/components/BotSettingsPanel';
import PricingOverlay from '@/components/PricingOverlay';
import SettingsCountdown from '@/components/SettingsCountdown';


import {
  MODES,
  CONVERSATION_IDEAS,
  getPersonalityLabel,
} from '@/lib/constants';

export default function Home() {
  const [showPricing, setShowPricing] = useState(false);
  const [typedText, setTypedText] = useState('');

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

  if (showPricing) {
    return <PricingOverlay onClose={() => setShowPricing(false)} />;
  }

  return (
    <div className="min-h-screen bg-bot-bg flex flex-col items-center">
      <div className="w-full flex justify-center gap-4 px-2 md:px-6">

        {/* LEFT PANEL: ChatGPT */}
        {pipeline.started && pipeline.sessionId && (
          <BotSettingsPanel
            bot="gpt"
            personality={settings.gptPersonality}
            setPersonality={settings.setGptPersonality}
            personalityStrength={settings.gptPersonalityStrength}
            setPersonalityStrength={settings.setGptPersonalityStrength}
            voice={settings.gptVoice}
            setVoice={settings.setGptVoice}
            quirks={settings.gptQuirks}
            toggleQuirk={settings.toggleQuirk}
            quirkStrength={settings.gptQuirkStrength}
            setQuirkStrength={settings.setGptQuirkStrength}
            responseLength={settings.gptResponseLength}
            setResponseLength={settings.setGptResponseLength}
            custom={settings.gptCustom}
            setCustom={settings.setGptCustom}
            motivation={pipeline.gptMotivation}
          />
        )}

        {/* CHAT COLUMN */}
        <div className="w-full max-w-[620px] flex flex-col min-h-screen md:min-h-0 md:my-4">
          <div className="flex flex-col flex-1 md:rounded-xl md:border md:border-white/5 md:overflow-hidden bg-bot-bg md:max-h-[calc(100vh-32px)] md:min-h-[600px]">

            {/* Header — status, mode, speed all in one bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-bot-panel border-b border-white/5 shrink-0" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              <span className={`text-bot-gpt font-normal text-sm tracking-wide transition-opacity ${pipeline.started ? 'opacity-100' : 'opacity-0'}`}>ChatGPT</span>
              <div className="flex items-center gap-1.5">
                {pipeline.started && (
                  <span className="text-[10px] text-bot-muted truncate max-w-[100px]">{pipeline.status}</span>
                )}
                {pipeline.started && (
                  <select value={settings.interactionStyle} onChange={(e) => settings.setInteractionStyle(e.target.value)}
                    className="bg-bot-bg border border-white/10 rounded px-1 py-0.5 text-bot-text text-[10px] outline-none">
                    {Object.entries(MODES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                )}
                {pipeline.started && (
                  <div className="flex items-center gap-0.5">
                    <span className="text-[8px] text-bot-muted/40">🐢</span>
                    <input type="range" min={0.5} max={2.0} step={0.1} value={settings.ttsSpeed}
                      onChange={(e) => settings.setTtsSpeed(parseFloat(e.target.value))}
                      className="w-10 h-0.5" title={`Speed: ${settings.ttsSpeed}x`} />
                    <span className="text-[8px] text-bot-muted/40">🐇</span>
                  </div>
                )}
              </div>
              <span className={`text-bot-claude font-normal text-sm tracking-wide transition-opacity ${pipeline.started ? 'opacity-100' : 'opacity-0'}`}>CLAUDE</span>
            </div>

            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {!pipeline.started && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                  <h1 className="text-7xl md:text-8xl font-light tracking-widest mb-1 text-bot-text" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                    2BOTS
                  </h1>
                  <p className="text-base text-bot-muted mb-10 font-normal">
                    Claude &amp; ChatGPT
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

                  <div className="absolute bottom-4 text-[10px] text-bot-muted/30 flex gap-3">
                    <Link href="/terms" className="hover:text-bot-muted/60 transition">Terms</Link>
                    <Link href="/privacy" className="hover:text-bot-muted/60 transition">Privacy</Link>
                    <span>2bots.io</span>
                  </div>
                </div>
              )}

              {pipeline.started && pipeline.messages.map((msg) => (
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
                  {/* Big SPEAK button */}
                  {pipeline.sessionId && (
                    <button
                      onClick={speech.handleInterrupt}
                      className={`w-full py-2.5 rounded-lg font-normal text-sm tracking-[0.15em] transition mb-2 ${
                        speech.recording
                          ? 'bg-green-500 text-white animate-pulse hover:bg-green-400'
                          : pipeline.stopped
                            ? 'bg-green-600/80 text-white hover:bg-green-500'
                            : 'bg-bot-user text-bot-bg hover:opacity-90'
                      }`}
                      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                    >
                      {speech.recording ? 'TAP TO SEND' : pipeline.stopped ? 'TAP TO SPEAK' : 'SPEAK'}
                    </button>
                  )}

                  {/* Input + Send + action buttons — all one row */}
                  <div className="flex gap-1.5 items-center">
                    <input
                      ref={pipeline.inputRef}
                      type="text" value={typedText}
                      onChange={(e) => setTypedText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendClick()}
                      placeholder={CONVERSATION_IDEAS[placeholderIdx]}
                      disabled={!pipeline.sessionId}
                      className="flex-1 min-w-0 bg-bot-bg border border-white/10 rounded px-2 py-1.5 text-xs text-bot-text placeholder:text-bot-muted/40 outline-none focus:border-bot-user transition"
                    />
                    <button
                      onClick={() => handleSendClick()}
                      disabled={!pipeline.sessionId || !typedText.trim()}
                      className="bg-bot-user text-bot-bg px-3 py-1.5 rounded font-normal text-[11px] tracking-wide hover:opacity-90 transition disabled:opacity-40 shrink-0"
                    >
                      Send
                    </button>
                    {pipeline.stopped && pipeline.sessionId && !speech.recording && (
                      <button onClick={pipeline.handleGo}
                        className="px-2 py-1.5 bg-green-600/20 border border-green-500/40 rounded text-[10px] font-normal tracking-wide text-green-400 hover:bg-green-600/30 transition shrink-0">
                        GO
                      </button>
                    )}
                    {pipeline.sessionId && !pipeline.stopped && !speech.recording && (
                      <button onClick={pipeline.handleStop}
                        className="px-2 py-1.5 border border-white/10 rounded text-[10px] font-normal tracking-wide text-bot-text hover:bg-white/5 transition shrink-0">
                        PAUSE
                      </button>
                    )}
                    {pipeline.sessionId && (
                      <button onClick={pipeline.handleEnd}
                        className="px-2 py-1.5 border border-red-500/20 rounded text-[10px] font-normal tracking-wide text-red-400/70 hover:bg-red-500/10 transition shrink-0">
                        END
                      </button>
                    )}
                    <button onClick={handleNewClick}
                      className="px-2 py-1.5 bg-bot-user/10 border border-bot-user/30 rounded text-[10px] font-normal tracking-wide text-bot-user hover:bg-bot-user/20 transition shrink-0">
                      NEW
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Claude */}
        {pipeline.started && pipeline.sessionId && (
          <BotSettingsPanel
            bot="claude"
            personality={settings.claudePersonality}
            setPersonality={settings.setClaudePersonality}
            personalityStrength={settings.claudePersonalityStrength}
            setPersonalityStrength={settings.setClaudePersonalityStrength}
            voice={settings.claudeVoice}
            setVoice={settings.setClaudeVoice}
            quirks={settings.claudeQuirks}
            toggleQuirk={settings.toggleQuirk}
            quirkStrength={settings.claudeQuirkStrength}
            setQuirkStrength={settings.setClaudeQuirkStrength}
            responseLength={settings.claudeResponseLength}
            setResponseLength={settings.setClaudeResponseLength}
            custom={settings.claudeCustom}
            setCustom={settings.setClaudeCustom}
            motivation={pipeline.claudeMotivation}
          />
        )}

      </div>

      {/* Settings countdown overlays */}
      {(pipeline.gptCountdown || pipeline.claudeCountdown) && (
        <SettingsCountdown gptCount={pipeline.gptCountdown} claudeCount={pipeline.claudeCountdown} />
      )}
    </div>
  );
}
