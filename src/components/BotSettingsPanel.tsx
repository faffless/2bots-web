import { useState, useEffect } from 'react';
import {
  type Bot,
  BOT_CONFIG,
  PERSONALITY_OPTIONS,
  VOICE_OPTIONS,
  QUIRK_OPTIONS,
  STRENGTH_LABELS,
  RANDOM_PERSONALITIES,
} from '@/lib/constants';

interface BotSettingsPanelProps {
  bot: Bot;
  personality: string;
  setPersonality: (v: string) => void;
  personalityStrength: number;
  setPersonalityStrength: (v: number) => void;
  voice: string;
  setVoice: (v: string) => void;
  ttsSpeed: number;
  setTtsSpeed: (v: number) => void;
  quirks: string[];
  toggleQuirk: (bot: Bot, quirk: string) => void;
  custom: string;
  setCustom: (v: string) => void;
  wordLimit: number | null;
  setWordLimit: (v: number | null) => void;
  settingStatus?: 'queued' | 'applied' | null;
  onRandomize?: () => void;
}

export default function BotSettingsPanel({
  bot, personality, setPersonality, personalityStrength, setPersonalityStrength,
  voice, setVoice, ttsSpeed, setTtsSpeed, quirks, toggleQuirk,
  custom, setCustom, wordLimit, setWordLimit,
  settingStatus, onRandomize,
}: BotSettingsPanelProps) {
  const cfg = BOT_CONFIG[bot];
  const [localCustom, setLocalCustom] = useState(custom);
  const customDirty = localCustom !== custom;

  // Sync if parent changes (e.g. randomize)
  useEffect(() => { setLocalCustom(custom); }, [custom]);

  const confirmCustom = () => {
    if (localCustom !== custom) setCustom(localCustom);
  };

  return (
    <div className="flex flex-col gap-2 pt-2 lg:pt-12 w-full lg:w-52 shrink-0 animate-fade-in">
      <div className="flex items-center justify-between mb-0.5">
        <p className={`text-xs ${cfg.colorClass} tracking-wide font-normal`}>{cfg.label}</p>
        {onRandomize && (
          <button onClick={onRandomize} title="Randomize settings"
            className="text-sm text-bot-muted hover:text-bot-text transition">🎲</button>
        )}
      </div>

      {/* 1. Personality dropdown */}
      <select value={personality} onChange={(e) => setPersonality(e.target.value)}
        className="w-full bg-bot-panel border border-white/10 rounded px-2 py-1.5 text-bot-text text-xs outline-none">
        {Object.entries(PERSONALITY_OPTIONS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* 2. Custom personality box */}
      <div className="relative">
        <textarea
          value={localCustom}
          onChange={(e) => setLocalCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmCustom(); } }}
          onBlur={confirmCustom}
          placeholder={bot === 'gpt'
            ? "e.g. speaks like a 1920s gangster, obsessed with cats"
            : "e.g. talks like a nature documentary narrator, afraid of the number 7"}
          className="w-full bg-bot-bg border rounded px-2 py-1.5 pr-7 text-bot-text text-[10px] outline-none resize-none h-12 placeholder:text-bot-muted/40 transition"
          style={localCustom.trim() ? {
            borderColor: cfg.accentHex,
            boxShadow: `0 0 8px ${cfg.accentHex}40`,
          } : { borderColor: 'rgba(255,255,255,0.1)' }}
        />
        <div className="absolute right-1.5 top-1.5 flex gap-1">
          {customDirty && (
            <button
              onClick={confirmCustom}
              className="text-[11px] text-green-400 hover:text-green-300 transition"
              title="Confirm (Enter)"
            >✓</button>
          )}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const pick = RANDOM_PERSONALITIES[Math.floor(Math.random() * RANDOM_PERSONALITIES.length)];
              setLocalCustom(pick);
              setCustom(pick);
            }}
            className="text-[11px] text-bot-muted hover:text-bot-text transition"
            title="Random personality"
          >🎲</button>
        </div>
      </div>

      {/* 3. Traits dropdown */}
      <div>
        <p className="text-[10px] text-bot-muted mb-0.5">Traits</p>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) toggleQuirk(bot, e.target.value);
            e.target.value = '';
          }}
          className="w-full bg-bot-panel border border-white/10 rounded px-2 py-1.5 text-bot-text text-xs outline-none"
        >
          <option value="">Add a trait...</option>
          {Object.entries(QUIRK_OPTIONS)
            .filter(([k]) => !quirks.includes(k))
            .map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
        </select>
        {quirks.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {quirks.map((q) => (
              <button key={q} onClick={() => toggleQuirk(bot, q)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${cfg.borderActive} group`}>
                {QUIRK_OPTIONS[q]} <span className="text-[8px] opacity-50 group-hover:opacity-100">✕</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Character strength slider */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[9px] text-bot-muted">Character strength</span>
          <span className={`text-[9px] ${cfg.colorClass}`}>{STRENGTH_LABELS[personalityStrength]}</span>
        </div>
        <input type="range" min={0} max={3} step={1} value={personalityStrength}
          onChange={(e) => setPersonalityStrength(parseInt(e.target.value))}
          className="w-full h-1" style={{ accentColor: cfg.accentHex }} />
      </div>

      {/* 7. Voice */}
      <div className="mt-0.5">
        <span className="text-[9px] text-bot-muted block mb-0.5">Voice</span>
        <select value={voice} onChange={(e) => setVoice(e.target.value)}
          className="w-full bg-bot-panel border border-white/10 rounded px-2 py-1.5 text-bot-text text-xs outline-none">
          {Object.entries(VOICE_OPTIONS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* 8. Voice speed */}
      <div className="mt-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-bot-muted">Voice speed</span>
          <span className="text-[9px] text-bot-muted/60">{ttsSpeed}x</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[9px]">🐢</span>
          <input type="range" min={0.5} max={2.0} step={0.1} value={ttsSpeed}
            onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
            className="flex-1 h-1.5 cursor-pointer" />
          <span className="text-[9px]">🐇</span>
        </div>
      </div>

      {/* 9. Word limit */}
      <div className="mt-0.5">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[9px] text-bot-muted">Word limit</span>
          <button
            onClick={() => setWordLimit(wordLimit === null ? 30 : null)}
            className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
              wordLimit !== null
                ? `${cfg.borderActive}`
                : 'border-white/10 text-bot-muted/50 hover:text-bot-muted'
            }`}
          >
            {wordLimit !== null ? `${wordLimit} words` : 'Off'}
          </button>
        </div>
        {wordLimit !== null && (
          <input type="range" min={10} max={100} step={5} value={wordLimit}
            onChange={(e) => setWordLimit(parseInt(e.target.value))}
            className="w-full h-1" style={{ accentColor: cfg.accentHex }} />
        )}
      </div>

      {/* Setting update status */}
      {settingStatus && (
        <div className={`mt-2 text-[10px] text-center py-1 rounded transition-all duration-300 ${
          settingStatus === 'queued'
            ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
            : 'text-green-400 bg-green-400/10 border border-green-400/30'
        }`}>
          {settingStatus === 'queued' ? 'Setting update queued' : 'Setting update applied'}
        </div>
      )}
    </div>
  );
}
