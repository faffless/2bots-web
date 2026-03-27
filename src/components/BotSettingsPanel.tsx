import {
  type Bot,
  BOT_CONFIG,
  PERSONALITY_OPTIONS,
  VOICE_OPTIONS,
  QUIRK_OPTIONS,
  STRENGTH_LABELS,
} from '@/lib/constants';

const RESPONSE_LENGTH_OPTIONS = [
  { key: 'avg_10', label: '~10' },
  { key: 'avg_20', label: '~20' },
  { key: 'avg_30', label: '~30' },
  { key: 'avg_40', label: '~40' },
  { key: 'avg_50', label: '~50' },
] as const;

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
  responseLength: string;
  setResponseLength: (v: string) => void;
  custom: string;
  setCustom: (v: string) => void;
  customTrait: string;
  setCustomTrait: (v: string) => void;
  onRandomize?: () => void;
}

export default function BotSettingsPanel({
  bot, personality, setPersonality, personalityStrength, setPersonalityStrength,
  voice, setVoice, ttsSpeed, setTtsSpeed, quirks, toggleQuirk,
  responseLength, setResponseLength, custom, setCustom,
  customTrait, setCustomTrait, onRandomize,
}: BotSettingsPanelProps) {
  const cfg = BOT_CONFIG[bot];

  return (
    <div className="hidden lg:flex flex-col gap-2 pt-12 w-52 shrink-0 animate-fade-in">
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
      <textarea
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder={bot === 'gpt'
          ? "e.g. speaks like a 1920s gangster"
          : "e.g. talks like a nature documentary narrator"}
        className="w-full bg-bot-bg border rounded px-2 py-1.5 text-bot-text text-[10px] outline-none resize-none h-12 placeholder:text-bot-muted/40 transition"
        style={custom.trim() ? {
          borderColor: cfg.accentHex,
          boxShadow: `0 0 8px ${cfg.accentHex}40`,
        } : { borderColor: 'rgba(255,255,255,0.1)' }}
      />

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

      {/* 4. Custom trait box */}
      <textarea
        value={customTrait}
        onChange={(e) => setCustomTrait(e.target.value)}
        placeholder={bot === 'gpt'
          ? "e.g. obsessed with Rachmaninoff"
          : "e.g. afraid of the number 7"}
        className="w-full bg-bot-bg border rounded px-2 py-1.5 text-bot-text text-[10px] outline-none resize-none h-12 placeholder:text-bot-muted/40 transition"
        style={customTrait.trim() ? {
          borderColor: cfg.accentHex,
          boxShadow: `0 0 8px ${cfg.accentHex}40`,
        } : { borderColor: 'rgba(255,255,255,0.1)' }}
      />

      {/* 5. Character strength slider */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[9px] text-bot-muted">Character strength</span>
          <span className={`text-[9px] ${cfg.colorClass}`}>{STRENGTH_LABELS[personalityStrength]}</span>
        </div>
        <input type="range" min={0} max={3} step={1} value={personalityStrength}
          onChange={(e) => setPersonalityStrength(parseInt(e.target.value))}
          className="w-full h-1" style={{ accentColor: cfg.accentHex }} />
      </div>

      {/* 6. Response length */}
      <div className="mt-0.5">
        <span className="text-[9px] text-bot-muted block mb-0.5">Response length</span>
        <div className="grid grid-cols-5 gap-1">
          {RESPONSE_LENGTH_OPTIONS.map(({ key, label }) => (
            <button key={key} onClick={() => setResponseLength(key)}
              className={`text-[8px] py-1 rounded transition-colors ${
                responseLength === key ? cfg.btnActive : 'bg-white/5 text-bot-muted hover:bg-white/10'
              }`}>
              {label}
            </button>
          ))}
        </div>
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
    </div>
  );
}
