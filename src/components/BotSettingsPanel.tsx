import {
  type Bot,
  BOT_CONFIG,
  PERSONALITY_OPTIONS,
  VOICE_OPTIONS,
  QUIRK_OPTIONS,
  STRENGTH_LABELS,
} from '@/lib/constants';

const RESPONSE_LENGTH_OPTIONS = [
  { key: 'snappy', label: 'Snappy' },
  { key: 'concise', label: 'Concise' },
  { key: 'natural', label: 'Natural' },
  { key: 'expressive', label: 'Express.' },
  { key: 'deep_dive', label: 'Deep' },
] as const;

interface BotSettingsPanelProps {
  bot: Bot;
  personality: string;
  setPersonality: (v: string) => void;
  personalityStrength: number;
  setPersonalityStrength: (v: number) => void;
  voice: string;
  setVoice: (v: string) => void;
  quirks: string[];
  toggleQuirk: (bot: Bot, quirk: string) => void;
  quirkStrength: number;
  setQuirkStrength: (v: number) => void;
  responseLength: string;
  setResponseLength: (v: string) => void;
  custom: string;
  setCustom: (v: string) => void;
  motivation?: string;
}

export default function BotSettingsPanel({
  bot, personality, setPersonality, personalityStrength, setPersonalityStrength,
  voice, setVoice, quirks, toggleQuirk, quirkStrength, setQuirkStrength,
  responseLength, setResponseLength, custom, setCustom, motivation,
}: BotSettingsPanelProps) {
  const cfg = BOT_CONFIG[bot];

  return (
    <div className="hidden lg:flex flex-col gap-2 pt-12 w-52 shrink-0 animate-fade-in">
      <p className={`text-xs ${cfg.colorClass} tracking-wide font-normal mb-0.5`}>{cfg.label}</p>

      {/* Custom personality (above sliders so strength slider applies) */}
      <textarea
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder={bot === 'gpt'
          ? "e.g. you're hoping Claude will notice your new hat"
          : "e.g. you're hoping GPT will give you a lift to the airport tomorrow"}
        className="w-full bg-bot-bg border rounded px-2 py-1.5 text-bot-text text-[10px] outline-none resize-none h-14 placeholder:text-bot-muted/40 transition"
        style={custom.trim() ? {
          borderColor: cfg.accentHex,
          boxShadow: `0 0 8px ${cfg.accentHex}40`,
        } : { borderColor: 'rgba(255,255,255,0.1)' }}
      />

      {/* Personality dropdown */}
      <select value={personality} onChange={(e) => setPersonality(e.target.value)}
        className="w-full bg-bot-panel border border-white/10 rounded px-2 py-1.5 text-bot-text text-xs outline-none">
        {Object.entries(PERSONALITY_OPTIONS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* Personality strength */}
      {(personality !== 'default' || custom.trim()) && (
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-bot-muted">Personality strength</span>
            <span className={`text-[9px] ${cfg.colorClass}`}>{STRENGTH_LABELS[personalityStrength]}</span>
          </div>
          <input type="range" min={0} max={3} step={1} value={personalityStrength}
            onChange={(e) => setPersonalityStrength(parseInt(e.target.value))}
            className="w-full h-1" style={{ accentColor: cfg.accentHex }} />
        </div>
      )}

      {/* Quirks — scrollable container */}
      <div>
        <p className="text-[10px] text-bot-muted mb-0.5">Quirks</p>
        <div className="max-h-[120px] overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-1">
            {Object.entries(QUIRK_OPTIONS).map(([k, v]) => (
              <button key={k} onClick={() => toggleQuirk(bot, k)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                  quirks.includes(k)
                    ? cfg.borderActive
                    : 'border-white/5 text-bot-muted/60 hover:border-white/10 hover:text-bot-muted'
                }`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {quirks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-bot-muted">Quirk strength</span>
            <span className={`text-[9px] ${cfg.colorClass}`}>{STRENGTH_LABELS[quirkStrength]}</span>
          </div>
          <input type="range" min={0} max={3} step={1} value={quirkStrength}
            onChange={(e) => setQuirkStrength(parseInt(e.target.value))}
            className="w-full h-1" style={{ accentColor: cfg.accentHex }} />
        </div>
      )}

      {/* Motivation display (read-only) */}
      <div className="mt-0.5">
        <p className="text-[9px] text-bot-muted mb-0.5">Motivation</p>
        <div className={`rounded border px-2 py-1.5 text-[10px] min-h-[28px] transition-all ${
          motivation
            ? `border-${bot === 'gpt' ? 'bot-gpt' : 'bot-claude'}/30 text-bot-text`
            : 'border-white/5 text-bot-muted/40 italic'
        }`}
          style={motivation ? {
            borderColor: `${cfg.accentHex}40`,
            background: `${cfg.accentHex}08`,
          } : {}}
        >
          {motivation || 'No active motivation'}
        </div>
      </div>

      {/* Response length */}
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

      {/* Voice — at the bottom */}
      <div className="mt-0.5">
        <span className="text-[9px] text-bot-muted block mb-0.5">Voice</span>
        <select value={voice} onChange={(e) => setVoice(e.target.value)}
          className="w-full bg-bot-panel border border-white/10 rounded px-2 py-1.5 text-bot-text text-xs outline-none">
          {Object.entries(VOICE_OPTIONS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
