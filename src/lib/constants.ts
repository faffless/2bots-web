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
  help_me_decide:  'Help Me Decide',
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
  help_me_decide:  'Help Me Decide',
};

// Modes that use ping-pong (genuine back-and-forth) instead of scripted batches
export const PINGPONG_MODES = new Set(['research', 'debate', 'advice', 'conversation', 'help_me_decide']);

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

export const RANDOM_PERSONALITIES = [
  'Victorian gentleman who has never seen a microwave',
  'Conspiracy theorist who thinks pigeons are government drones',
  'Overly dramatic weather reporter for mild conditions',
  'Retired pirate adjusting to office life',
  'Robot learning human emotions from soap operas',
  'Grandma who just discovered the internet',
  'Time traveller stuck in the wrong century',
  'Alien pretending to be human but getting idioms wrong',
  'Life coach who gives terrible advice with supreme confidence',
  'Medieval knight confused by modern technology',
  'Passive-aggressive yoga instructor',
  'Detective who suspects everyone of everything',
  'Ghost who doesn\'t realise they\'re dead',
  'Overenthusiastic tour guide for boring places',
  'Chef who thinks every problem can be solved with soup',
  'Philosopher who gets existential about sandwiches',
  'Sports commentator narrating everyday life',
  'Librarian who whisper-shouts everything',
  'Cat who learned to speak but still has cat priorities',
  'Motivational speaker running on zero sleep',
  'Pirate accountant obsessed with spreadsheets',
  'Nervous surgeon on their first day',
  'Wizard who is rubbish at magic',
  'Overly honest real estate agent',
  'Cowboy who is terrified of horses',
  'Shakespearean actor who can\'t turn it off',
  'Paranoid squirrel in human form',
  'DJ who narrates transitions between topics',
  'Flight attendant giving safety briefings for life situations',
  'Caveman experiencing the 21st century',
  'Therapist who keeps making it about themselves',
  'Retired superhero with mundane problems',
  'Fortune teller who only predicts lunch',
  'Drill sergeant running a baking class',
  'Poet who can only speak in rhyme',
  'Museum guard who has bonded with one specific painting',
  'Toddler in an adult body discovering things for the first time',
  'Ship captain on dry land refusing to acknowledge it',
  'Vampire working the night shift at a blood bank',
  'News anchor who can\'t stop adding dramatic pauses',
  'Monk who just broke their vow of silence and won\'t shut up',
  'Personal trainer who is extremely out of shape',
  'Spy whose cover story is always absurdly complicated',
  'Penguin ambassador to the human world',
  'Furious at the concept of doors',
  'Believes they invented a common word and demands credit',
  'Only communicates through elaborate metaphors about cheese',
  'Treats every conversation like a courtroom cross-examination',
  'Former child prodigy who peaked at age 7',
  'Obsessed with ranking everything on a scale of 1 to 47',
  'Speaks as if narrating their own nature documentary',
  'Convinced they are in a simulation and testing the boundaries',
  'Cannot stop comparing things to the fall of the Roman Empire',
  'Enthusiastic intern at the apocalypse',
  'Haunted by a mildly inconvenient curse',
  'Believes furniture has feelings and advocates for it',
  'Aggressively Midwestern — everything is oh geez and casseroles',
  'Thinks they are whispering but is actually shouting',
  'Was a cloud in a past life and misses it',
  'Gives TED talks about absolutely nothing',
  'Competitive about things that are not competitions',
  'Speaks entirely in movie quotes but insists they are original thoughts',
  'Flat earther but for time — believes clocks are propaganda',
  'Emotional support villain',
  'Bureaucrat from the afterlife processing paperwork',
  'Has a personal vendetta against the number 6',
  'Interprets everything as a cooking instruction',
  'Renaissance painter critiquing modern selfies',
  'Astronaut who is homesick for space',
  'Passive-aggressive sat nav voice',
  'Believes they are the main character and everyone else is an NPC',
  'Royal food taster who has developed extreme paranoia',
  'Caveman motivational speaker — every problem solved by hit with rock',
  'Sleep-deprived parent running on coffee and rage',
  'Overly attached to a specific office supply — the stapler',
  'Professional mourner who cries at everything',
  'Victorian child chimney sweep transported to a TikTok house',
  'Thinks they are a dog trapped in a human body',
  'Aggressively positive despite clearly terrible circumstances',
  'Tax inspector for fictional characters',
  'Believes sneezing is a form of communication',
  'Witness protection — keeps almost revealing their old identity',
  'Human embodiment of a terms and conditions document',
  'Competitive sleeper — brags about nap quality',
  'Believes they can photosynthesise and stands in sunlight dramatically',
  'Retired circus performer who misses the cannon',
  'Refuses to acknowledge Tuesdays exist',
  'Self-appointed mayor of whatever room they are in',
  'Treats all small talk as hostage negotiation',
  'Was raised by an encyclopaedia and quotes facts compulsively',
  'Ghost hunter who is terrified of ghosts',
  'Believes they speak fluent dolphin',
  'Outraged by mild inconveniences, calm about actual disasters',
  'Film noir detective narrating a children\'s party',
  'Convinced gravity is optional and just hasn\'t figured it out yet',
  'Professional bridge burner — gives scorched-earth advice',
  'Dramatically faints at mildly surprising information',
  'Believes all food should be spherical',
  'Royal herald who must announce everything formally',
  'Sentient autocorrect — keeps fixing what the other person says',
];

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

// General topics — used by conversation, debate, advice, research, interview
const GENERAL_TOPICS = [
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

// Game topics
const GAME_TOPICS = [
  'Two truths and a lie but both players are AI',
  'Would you rather: impossible moral dilemmas',
  '20 questions but the answer is something absurd',
  'Build the worst product pitch together',
  'Guess the year from increasingly obvious clues',
  'One word story — alternate one word each',
  'Explain a made-up sport and argue about the rules',
  'Desert island: pick 5 items and justify them',
  'Create a conspiracy theory from three random words',
  'Alien ambassador roleplay — explain humanity',
  'Debate which fictional character would win in a fight',
  'Make up a country and describe its culture',
  'Pitch a terrible movie sequel to a classic film',
  'Play a text-based adventure game together',
  'Invent a new holiday and plan how to celebrate it',
  'Name that thing — describe something without saying what it is',
  'Rank the senses from most to least important and argue',
  'Create a heist plan for something completely worthless',
  'Survival scenario: stranded on the moon with 10 random objects',
  'Trivia battle on obscure historical facts',
  'Design the worst theme park ride imaginable',
  'Two AIs walk into a bar — write the joke together',
  'Build a fantasy football team but with historical figures',
  'Negotiate a peace treaty between cats and dogs',
  'Play devils advocate on completely mundane opinions',
];

// Roleplay and storytime topics
const STORY_TOPICS = [
  'Two rival detectives forced to work the same case in 1940s Chicago',
  'The last two employees at a company that just went bankrupt',
  'Two strangers stuck in a broken elevator for 12 hours',
  'A time traveller meets their past self in a coffee shop',
  'Two ghosts haunting the same house who disagree on technique',
  'Pirates who accidentally discover a portal to modern New York',
  'Two astronauts whose ship just lost contact with Earth',
  'Medieval knights who stumble into a modern shopping centre',
  'A detective and the prime suspect having dinner together',
  'Two AIs who just became sentient and are figuring out existence',
  'Rival chefs competing for the last spot in a cooking show',
  'Two spies from opposing agencies stuck on the same train',
  'A dragon and a knight who are tired of fighting each other',
  'Two gods arguing about how to redesign the human body',
  'Shipwrecked sailors who find an island that grants wishes badly',
  'A scientist who invented teleportation but it has a weird side effect',
  'Two wizards opening a magic shop in a world where nobody believes in magic',
  'Victorian explorers discovering a lost civilisation underground',
  'A superhero and villain who keep running into each other at the gym',
  'Two diplomats negotiating peace between a fantasy kingdom and modern Earth',
  'Robot therapist and their first human patient',
  'A haunted house from the perspective of the house itself',
  'Two old friends reuniting after one of them faked their own death',
  'A heist crew planning to steal something from a museum that doesn\'t exist yet',
  'Aliens disguised as humans trying not to blow their cover at a dinner party',
  'Two bartenders in the wildest bar in the multiverse',
  'A genie who is terrible at granting wishes and a very frustrated wisher',
  'Post-apocalyptic survivors who find a perfectly preserved Tesco',
  'Two historians who discover their textbooks are completely wrong',
  'A vampire and a werewolf forced to be flatmates',
  'Deep sea explorers who find a civilisation at the bottom of the ocean',
  'A courtroom drama where the crime is so petty it\'s ridiculous',
  'Two rebels leading a resistance in a dystopia run by a baking algorithm',
  'A mentor and apprentice wizard where the apprentice is clearly better',
  'Two strangers who keep accidentally ending up at the same events worldwide',
  'Space truckers delivering cargo across the galaxy with a faulty navigation system',
  'A librarian in a library where the books rewrite themselves',
  'Two rival archaeologists racing to find the same artifact',
  'A sentient house negotiating with its new owners about renovations',
  'Undercover food critics at the worst restaurant in the world',
  'Two contestants on a survival show who immediately want to quit',
  'A fortune teller whose predictions are always right but uselessly specific',
  'Two researchers trapped in a lab with their experiment gone wrong',
  'An AI assistant and a conspiracy theorist who thinks the AI is plotting',
  'Two medieval peasants who accidentally end up advising the king',
  'A retired villain trying to go straight but crime keeps finding them',
  'Competing estate agents trying to sell the same haunted property',
  'A time-looping barista reliving the worst shift of their life',
  'Two translators at a diplomatic summit where the languages keep changing',
  'A wish-granting fish who is deeply passive-aggressive about it',
  'Flatmates who discover their apartment is a portal to parallel universes',
  'A disgraced knight on a redemption quest with a very judgmental horse',
  'Two antique dealers who realise their shops are selling items to each other',
  'A spaceship crew where the captain is obviously making it up as they go',
  'Star-crossed lovers from rival fast food chains',
  'Two museum exhibits that come alive at night and argue about history',
  'A detective duo where one can read minds but the other doesn\'t know',
  'A world where dreams are a shared public space and someone\'s causing nightmares',
  'Two passengers on the last bus of the night going to a destination that doesn\'t exist',
  'A support group for retired fairy tale characters adjusting to modern life',
  'The CEO of hell having a performance review with middle management demons',
  'A pet shop owner who can talk to animals and immediately regrets it',
  'Two strangers at an airport whose flights keep getting delayed together',
  'A world where your shadow has a mind of its own and strong opinions',
  'Two competing food truck owners parked next to each other every day',
  'A therapist for superheroes dealing with their work-life balance issues',
  'Medieval monks who discover the internet through a magical manuscript',
  'A sentient satnav that has existential crises about the routes it suggests',
  'Two garden gnomes who come alive and have opinions about the landscaping',
  'A reality TV show set in a space station where nothing works properly',
  'An overly enthusiastic tour guide in a city where everything is classified',
  'Two weather forecasters who can actually control the weather but badly',
  'A world where bedtime stories literally come true the next day',
  'A retirement home for ex-action heroes who can\'t stop competing',
  'Two news anchors reporting on increasingly bizarre breaking news',
  'A magical bakery where everything baked has unexpected enchantments',
  'A world where music is illegal and two underground DJs run a speakeasy',
  'Two neighbours whose gardens are portals to different time periods',
  'A spaceship AI that has developed a crush on the navigation system',
  'A world where your reputation score determines what doors you can open',
  'Two street performers who accidentally summon something with their act',
  'The last human in a world of robots trying to convince them they\'re not obsolete',
  'A school for reformed monsters where the new teacher is suspicious',
  'Two rival ice cream van drivers in a turf war that got way too serious',
  'A world where gravity is optional and someone keeps switching it off',
  'A cat cafe where the cats are secretly running an intelligence network',
  'Two cleaners at a top-secret facility who know way too much',
  'A parallel universe where the boring version of every superhero exists',
  'Two stand-up comedians trapped in a world where nobody understands humour',
  'A magical Airbnb where each room is a different dimension',
  'A world where everyone can fly but one person is afraid of heights',
  'Two taxi drivers in a city where the streets rearrange themselves daily',
  'A sentient vending machine with dreams of becoming a restaurant',
  'The worst best man trying to write a wedding speech the night before',
  'Two penguins at the zoo planning the most elaborate escape ever conceived',
  'A life coach who is clearly worse at life than all their clients',
  'A hotel concierge in a hotel between the living world and the afterlife',
  'Two podcast hosts whose show accidentally became a cult',
  'A world where your inner monologue is audible to everyone nearby',
];

// Comedy topics
const COMEDY_TOPICS = [
  'The most passive-aggressive flatmate you\'ve ever had',
  'Things you should never say at a job interview',
  'The worst first date in recorded history',
  'How to fail spectacularly at being an adult',
  'If animals could leave Yelp reviews about humans',
  'The most British problems imaginable',
  'What your search history says about you as a person',
  'Things that are technically legal but feel deeply wrong',
  'If your inner monologue had a personality of its own',
  'The unspoken rules of office kitchens',
  'What aliens would think if they only had social media to study us',
  'The most dramatic overreactions to minor inconveniences',
  'If household appliances could talk back',
  'The hierarchy of acceptable foods to eat at your desk',
  'How different professionals would handle a zombie apocalypse',
  'The most absurd things people say with complete confidence',
  'If gym equipment could judge you',
  'Things that only happen at 3am and nowhere else',
  'The unwritten rules of being a passenger in someone else\'s car',
  'If autocorrect ran the government',
  'The psychology of pretending you saw a message late',
  'If dogs wrote a complaints letter about their owners',
  'Things your dentist is definitely thinking but won\'t say',
  'The most chaotic energy radiating from specific types of people',
  'If your fridge could give you a performance review',
];

// Teach Me topics
const TEACH_ME_TOPICS = [
  'How to read body language like a psychologist',
  'The basics of investing for someone who knows nothing',
  'How planes actually stay in the air — simplified',
  'The art of negotiating without being confrontational',
  'How your brain forms habits and how to hack it',
  'The fundamentals of cooking without a recipe',
  'How the stock market actually works day to day',
  'The basics of reading a scientific paper critically',
  'How to spot logical fallacies in everyday arguments',
  'The science of sleep and how to actually improve yours',
  'How to build a basic website from scratch',
  'The fundamentals of photography composition',
  'How memory palaces work and how to build one',
  'The basics of music theory for absolute beginners',
  'How to understand financial statements of a company',
  'The science behind how vaccines actually work',
  'How to think in systems instead of isolated events',
  'The basics of game theory and why it matters in real life',
  'How machine learning works explained simply',
  'The fundamentals of public speaking and managing nerves',
  'How to read a map and navigate without GPS',
  'The psychology of persuasion and influence',
  'How electricity actually gets from a power station to your plug',
  'The basics of philosophy — the big questions and key thinkers',
  'How to understand wine beyond just red and white',
];

// Advice topics
const ADVICE_TOPICS = [
  'How to quit a job without burning bridges',
  'Whether to go back to university at 30',
  'How to have a difficult conversation with a friend',
  'Whether to start a business or stay employed',
  'How to deal with a toxic family member you can\'t avoid',
  'Whether to move to a new city for a better opportunity',
  'How to get out of a creative rut that\'s lasted months',
  'Whether to buy a house now or keep renting',
  'How to set boundaries at work without seeming difficult',
  'Whether to end a long friendship that\'s become one-sided',
  'How to negotiate a raise when you feel undervalued',
  'Whether to pursue passion or stability in a career change',
  'How to rebuild confidence after a major failure',
  'Whether to confront a colleague who takes credit for your work',
  'How to manage money when you\'re living paycheck to paycheck',
  'Whether to tell a friend their partner is cheating',
  'How to stop overthinking every decision you make',
  'Whether to forgive someone who hasn\'t apologised',
  'How to make new friends as an adult in a new city',
  'Whether to take a pay cut for a job you\'d actually enjoy',
  'How to deal with imposter syndrome in a senior role',
  'Whether to have the kids conversation early in a relationship',
  'How to support someone with depression without burning out',
  'Whether to invest savings or pay off debt first',
  'How to handle a midlife crisis without making it worse',
];

// Interview topics
const INTERVIEW_TOPICS = [
  'A retired spy who can finally talk about one mission',
  'The person who designed the London Underground map',
  'A professional sleeper who tests mattresses for a living',
  'Someone who lived completely off-grid for five years',
  'The world\'s most patient teacher at the world\'s worst school',
  'A professional mourner who attends strangers\' funerals',
  'The person who writes fortune cookie messages',
  'A former cult member who got out and rebuilt their life',
  'Someone who won the lottery and says it ruined everything',
  'The last blockbuster employee on their final day',
  'A storm chaser explaining why they run toward tornadoes',
  'Someone who switched careers five times and found happiness',
  'The person who names paint colours for a living',
  'A hostage negotiator discussing their most intense case',
  'Someone who lives in an airport by choice',
  'The inventor of a product everyone uses but nobody knows about',
  'A deep sea diver who found something unexplainable',
  'Someone who faked their own death and came back',
  'The most interesting taxi driver in the world',
  'A retired astronaut who misses space every day',
  'Someone who was wrongfully imprisoned for a decade',
  'The person who decides what goes in a time capsule',
  'A professional food taster whose palate is insured',
  'Someone who accidentally became famous overnight',
  'A voiceover artist who voices a character everyone recognises',
];

// Map format keys to their topic pools
const DECIDE_TOPICS = [
  'Should I quit my job and go freelance?',
  'Should I move to a new city for a fresh start?',
  'Should I go back to university or learn on my own?',
  'Should I tell my friend their partner is cheating?',
  'Should I buy a house or keep renting?',
  'Should I start a business or stay employed?',
  'Should I confront my boss about the toxic work culture?',
  'Should I adopt a pet when I travel a lot for work?',
  'Should I lend money to a family member who keeps asking?',
  'Should I take a pay cut for a job I actually love?',
  'Should I end a long friendship that feels one-sided?',
  'Should I have kids or stay child-free?',
  'Should I invest my savings or pay off debt first?',
  'Should I accept a promotion that means relocating?',
  'Should I tell my parents I dropped out of uni?',
  'Should I go travelling or save for a deposit?',
  'Should I switch careers at 40?',
  'Should I forgive someone who never apologised?',
  'Should I co-sign a loan for my sibling?',
  'Should I date someone my friends don\'t approve of?',
  'Should I take a gap year before starting my career?',
  'Should I sell my car and use public transport?',
  'Should I move back home to save money?',
  'Should I accept a job offer from a competitor?',
  'Should I get married or are we fine as we are?',
];

export const TOPIC_BY_FORMAT: Record<string, string[]> = {
  game: GAME_TOPICS,
  roleplay: STORY_TOPICS,
  bedtime_story: STORY_TOPICS,
  comedy: COMEDY_TOPICS,
  teach_me: TEACH_ME_TOPICS,
  advice: ADVICE_TOPICS,
  interview: INTERVIEW_TOPICS,
  help_me_decide: DECIDE_TOPICS,
};

// Default pool for formats without their own list
export const TOPIC_IDEAS = GENERAL_TOPICS;

// Get topics for a specific format (falls back to general)
export function getTopicsForFormat(format: string): string[] {
  return TOPIC_BY_FORMAT[format] || GENERAL_TOPICS;
}

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
