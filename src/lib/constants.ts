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
export const PINGPONG_MODES = new Set(['research', 'debate', 'advice', 'conversation']);

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

export const TOPIC_IDEAS = [
  // ~75 serious but weirdly specific
  'Why most productivity advice makes people less productive',
  'The psychology of why people stay in jobs they hate',
  'Whether we should colonise Mars or fix Earth first',
  'How algorithms decide what music you discover',
  'Why some languages have no word for certain emotions',
  'The ethics of paying people to donate organs',
  'Whether talent is real or just early practice',
  'How your name statistically affects your career',
  'Why hospitals are designed so badly',
  'The economics of why movie popcorn costs so much',
  'Whether schools should teach financial literacy instead of algebra',
  'How the placebo effect actually works at a neurological level',
  'Why some countries drive on the left',
  'The real reason breakfast became the most important meal',
  'Whether democracy works better with fewer choices',
  'How fonts subconsciously influence what you believe',
  'Why nostalgia physically hurts',
  'The psychology behind why people hoard',
  'Whether zoos are ethical in the modern world',
  'How architecture affects mental health',
  'Why the human body is badly designed',
  'The history of why we work 5 days a week',
  'Whether social media has made art better or worse',
  'How supermarkets manipulate you into buying more',
  'Why some people have no inner monologue',
  'The science of why certain songs get stuck in your head',
  'Whether free will exists or every choice is predetermined',
  'How colour affects appetite and restaurant revenue',
  'Why the middle seat on a plane has no armrest rights',
  'The ethics of gene editing babies for intelligence',
  'Whether tipping culture should be abolished globally',
  'How sleep deprivation is used as a torture method',
  'Why humans are the only animals that cry emotionally',
  'The real cost of fast fashion per garment',
  'Whether true altruism exists or everything is selfish',
  'How elevator music was engineered to reduce anxiety',
  'Why identical twins raised apart develop eerily similar habits',
  'The psychology of why people enjoy watching true crime',
  'Whether homework actually improves learning outcomes',
  'How your birth order statistically shapes your personality',
  'Why some accents are perceived as more trustworthy',
  'The economics of why healthcare costs vary by 10x between countries',
  'Whether universal basic income would make people lazy',
  'How decision fatigue affects judges sentencing patterns',
  'Why we find baby animals cute but not baby insects',
  'The science behind why cold showers supposedly help',
  'Whether the Olympics still serve their original purpose',
  'How gambling addiction exploits the same pathways as drugs',
  'Why some cultures have completely different beauty standards',
  'The logistics of how a single banana reaches your kitchen',
  'Whether meritocracy is a myth in modern economies',
  'How background noise levels affect creativity',
  'Why humans domesticated cats even though cats are useless',
  'The psychology of why people believe conspiracy theories',
  'Whether space debris will eventually trap us on Earth',
  'How your gut bacteria influence your mood and decisions',
  'Why billionaires keep working after their first billion',
  'The ethics of AI replacing creative professionals',
  'Whether monogamy is natural or culturally imposed',
  'How city design determines whether neighbours become friends',
  'Why we procrastinate on things we actually want to do',
  'The science of why time feels faster as you age',
  'Whether prison should focus on punishment or rehabilitation',
  'How smell is the most powerful memory trigger and why',
  'Why some people are consistently late despite trying',
  'The hidden environmental cost of streaming a single movie',
  'Whether competitive eating should be classified as a sport',
  'How traffic would flow better if everyone drove slower',
  'Why mirrors flip left and right but not up and down',
  'The ethics of keeping extremely elderly people alive artificially',
  'How your handwriting reveals personality traits',
  'Whether the internet has made people smarter or dumber',
  'Why certain numbers feel luckier than others across cultures',
  'The real reason diamonds became engagement ring tradition',
  'Whether remote work is killing innovation or enabling it',

  // ~25 slightly sillier but still weirdly specific
  'Whether a hot dog is a sandwich and why it matters legally',
  'The optimal strategy for surviving a zombie apocalypse in IKEA',
  'Why pigeons walk like they own the place',
  'Whether cereal is technically a soup',
  'The geopolitics of who would win in a fight: every toddler vs one gorilla',
  'Why we say bless you after sneezing but not after coughing',
  'The economics of selling bathwater as a business model',
  'Whether fish know they are wet',
  'Why the word queue is just Q followed by four silent letters',
  'The logistics of Santa delivering to every house in one night',
  'Whether a straw has one hole or two',
  'Why toast always lands butter side down and the physics behind it',
  'The ethical implications of time travelling to steal jokes',
  'Whether you could eat a door if you had a year to do it',
  'Why coconuts have faces',
  'The surprisingly complex politics of office thermostat control',
  'Whether aliens would find humans attractive',
  'Why we park in driveways and drive on parkways',
  'The survival odds of various animals in a shopping mall overnight',
  'Whether a goldfish has a better attention span than a modern human',
  'Why escalator etiquette varies so much between cities',
  'The physics of how many balloons it would take to lift a house',
  'Whether mayonnaise is an instrument',
  'Why we wash bath towels when we are clean when we use them',
  'The surprisingly dark history of nursery rhymes',
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
