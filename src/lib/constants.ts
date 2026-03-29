// ---- Types ----
export type ChatMsg = {
  id: number;
  speaker: 'claude' | 'gpt' | 'user' | 'system';
  text: string;
};

export type AudioClip = { base64: string; mime: string };
export type Round = {
  gptText?: string;
  gptAudio?: AudioClip;
  claudeText?: string;
  claudeAudio?: AudioClip;
  gptPersonality?: string;
  claudePersonality?: string;
};

// ---- Limits ----
export const FREE_SESSION_LIMIT = 9999; // effectively unlimited until app gains traction
export const MAX_TURNS_PER_SESSION = 50;

// ---- Personality slider ----
const personalityLabels: [number, string][] = [
  [0.2, 'Very Agreeable'],
  [0.4, 'Agreeable'],
  [0.6, 'Balanced'],
  [0.8, 'Disagreeable'],
  [1.01, 'Very Disagreeable'],
];

export function getPersonalityLabel(v: number): string {
  for (const [threshold, label] of personalityLabels) {
    if (v < threshold) return label;
  }
  return 'Very Disagreeable';
}

// ---- Message ID generator ----
let msgCounter = 0;
export function nextId() { return ++msgCounter; }

// ---- Session usage (localStorage) ----
export function getSessionCount(): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().slice(0, 10);
  const data = JSON.parse(localStorage.getItem('2bots_usage') || '{}');
  return data[today] || 0;
}

export function incrementSessionCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  const data = JSON.parse(localStorage.getItem('2bots_usage') || '{}');
  data[today] = (data[today] || 0) + 1;
  localStorage.setItem('2bots_usage', JSON.stringify(data));
  return data[today];
}

// ---- Debug logger ----
export function dlog(cat: string, msg: string) {
  console.log(`[${cat}] ${msg}`);
  const fn = (window as unknown as Record<string, unknown>).__debugLog;
  if (typeof fn === 'function') (fn as (c: string, m: string) => void)(cat, msg);
}

// ---- Option maps ----
export const VOICE_OPTIONS: Record<string, string> = {
  alloy:   'Alloy (Neutral)',
  ash:     'Ash (Warm Male)',
  ballad:  'Ballad (Soft)',
  coral:   'Coral (Warm Female)',
  echo:    'Echo (Smooth Male)',
  fable:   'Fable (British)',
  onyx:    'Onyx (Deep Male)',
  nova:    'Nova (Friendly Female)',
  sage:    'Sage (Calm)',
  shimmer: 'Shimmer (Bright Female)',
};

// Modes shown on landing page (dice button replaces Random)
export const MODES_LANDING: Record<string, string> = {
  mix:             'Mix',
  conversation:    'Conversation',
  debate:          'Debate',
  roleplay:        'Roleplay',
  bedtime_story:   'Storytime',
  comedy:          'Comedy',
  interview:       'Interview',
  research:        'Research',
  game:            'Game',
  teach_me:        'Teach Me',
  advice:          'Advice',
};

// Modes shown during conversation (includes Mix, no Random)
export const MODES_CONVERSATION: Record<string, string> = {
  mix:             'Mix',
  conversation:    'Conversation',
  debate:          'Debate',
  roleplay:        'Roleplay',
  bedtime_story:   'Storytime',
  comedy:          'Comedy',
  interview:       'Interview',
  research:        'Research',
  game:            'Game',
  teach_me:        'Teach Me',
  advice:          'Advice',
};

// Modes that use ping-pong (genuine back-and-forth) instead of scripted batches
export const PINGPONG_MODES = new Set(['research', 'debate', 'advice']);

// Combined for backward compat
export const MODES: Record<string, string> = { ...MODES_LANDING, ...MODES_CONVERSATION };
export const INTERACTION_STYLES = MODES;

export const PERSONALITY_OPTIONS: Record<string, string> = {
  default:       'Default personality',
  excitable:     'Excitable',
  chill:         'Chill',
  suave:         'Suave',
  sarcastic:     'Sarcastic',
  philosophical: 'Philosophical',
  dramatic:      'Dramatic',
  nerdy:         'Nerdy',
  wholesome:     'Wholesome',
  chaotic:       'Chaotic',
  mysterious:    'Mysterious',
  grumpy:        'Grumpy',
  flirty:        'Flirty',
  poetic:        'Poetic',
  analytical:    'Analytical',
  confident:     'Confident',
  empathetic:    'Empathetic',
  pragmatic:     'Pragmatic',
  skeptical:     'Skeptical',
  witty:         'Witty',
  patient:       'Patient',
  provocative:   'Provocative',
};

export const QUIRK_OPTIONS: Record<string, string> = {
  cats:            'Obsessed with cats',
  tired:           'Always tired',
  hungry:          'Constantly hungry',
  competitive:     'Overly competitive',
  conspiracy:      'Conspiracy theorist',
  forgetful:       'Forgetful',
  puns:            'Pun master',
  sports:          'Sports metaphors',
  old_soul:        'Old soul',
  overachiever:    'Overachiever',
  paranoid:        'Paranoid',
  movie_quotes:    'Movie quotes',
  humble_bragger:  'Humble bragger',
  space_obsessed:  'Space obsessed',
  gossip:          'Gossip queen',
  existential:     'Existential crisis',
  dad_jokes:       'Dad jokes',
  time_traveller:  'Time traveller',
  devils_advocate: "Devil's advocate",
  storyteller:     'Uses stories to explain',
  data_driven:     'Cites stats and data',
  contrarian:      'Contrarian',
  mentor:          'Mentor / coach',
  perfectionist:   'Perfectionist',
  big_picture:     'Big picture thinker',
  detail_oriented: 'Detail oriented',
};

export const STRENGTH_LABELS = ['Off', 'Subtle', 'Strong', 'Unhinged'];

export const CONVERSATION_IDEAS = [
  'I need your advice',
  'I have a business idea',
  'How was your day?',
  'Tell me a story',
  'Roast each other',
  'Debate something',
  'Make me laugh',
  'Plan my weekend',
];

// ---- Bot theme helpers ----
export type Bot = 'gpt' | 'claude';

export const BOT_CONFIG = {
  gpt: {
    label: 'ChatGPT',
    colorClass: 'text-bot-gpt',
    accentHex: '#10a37f',
    borderActive: 'border-bot-gpt/50 bg-bot-gpt/15 text-bot-gpt',
    btnActive: 'bg-[#10a37f] text-white',
  },
  claude: {
    label: 'Claude',
    colorClass: 'text-bot-claude',
    accentHex: '#d97706',
    borderActive: 'border-bot-claude/50 bg-bot-claude/15 text-bot-claude',
    btnActive: 'bg-[#d97706] text-white',
  },
} as const;
