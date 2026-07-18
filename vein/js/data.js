// ============================================================
// DATA
// ============================================================

const TIME_BLOCKS = ['Morning', 'Afternoon', 'Evening'];

const ORE_TYPES = {
  time:   { name: 'Time Orichalchum',   symbol: '⧖', colour: '#7b68ee', flavorText: 'Smells faintly of burnt clocks.',        basePrice: 60 },
  energy: { name: 'Energy Orichalchum', symbol: '⚡', colour: '#c8873a', flavorText: 'Makes your fillings ache slightly.',      basePrice: 50 },
  life:   { name: 'Life Orichalchum',   symbol: '✦', colour: '#3a7a52', flavorText: 'Warm to the touch. Not unpleasantly.',   basePrice: 70 },
  void:   { name: 'Void Orichalchum',   symbol: '◉', colour: '#6a3a6a', flavorText: 'Looking at it too long is ill-advised.',  basePrice: 90 },
  motion: { name: 'Motion Orichalchum', symbol: '↯', colour: '#2a8fc4', flavorText: 'Vibrates faintly in your pocket.',        basePrice: 55 },
};
// Base price per consumable (per unit, before Archie's 50/50 split)
const CONSUMABLE_PRICES = {
  timePearl:    120,
  motionPowder: 150,
};
const ORE_TYPE_KEYS = Object.keys(ORE_TYPES);

const VEIN_LEVELS = {
  1: { label:'Trace',    yieldCautious:[1,2],   yieldFull:[3,5],    rechargeBlocks:4, devBarMax:8,   devBarHarvestCost:2 },
  2: { label:'Minor',    yieldCautious:[2,4],   yieldFull:[6,10],   rechargeBlocks:3, devBarMax:16,  devBarHarvestCost:3 },
  3: { label:'Moderate', yieldCautious:[4,7],   yieldFull:[10,16],  rechargeBlocks:3, devBarMax:24,  devBarHarvestCost:4 },
  4: { label:'Rich',     yieldCautious:[7,12],  yieldFull:[16,24],  rechargeBlocks:2, devBarMax:36,  devBarHarvestCost:5 },
  5: { label:'Lode',     yieldCautious:[12,20], yieldFull:[24,40],  rechargeBlocks:2, devBarMax:9999,devBarHarvestCost:6 },
};

const SEED_ORE_COST = 40;
const CULTIVATING_XP_LEVELS = [0, 0, 80, 220, 500, 1000];

const SECURITY_TIERS = [
  { id: 'none',    label: 'Unsecured',   raidResist: 0,  cost: 0   },
  { id: 'basic',   label: 'Basic Lock',  raidResist: 15, cost: 20  },
  { id: 'warded',  label: 'Ward Rune',   raidResist: 35, cost: 60  },
  { id: 'guarded', label: 'Hired Guard', raidResist: 55, cost: 120 },
];

const ENEMY_TEMPLATES = [
  { name: 'Territorial Scrapper', hpBase: 20, attackMin: 3, attackMax: 8  },
  { name: 'Vein Guard',           hpBase: 30, attackMin: 4, attackMax: 10 },
  { name: 'Orichalchum Dealer',   hpBase: 25, attackMin: 5, attackMax: 12 },
];

// Thugs scale to player HP (mugging encounters)
const THUG_NAMES = ['a bloke in a puffer jacket', 'some lad who definitely does this a lot', 'a man with very little to lose'];

// Crafting recipes
// successChance and calcCost are at crafting skill 1; both improve with level
// effect is what the item does — crafting level improves effectPower
const RECIPES = {
  timePearl: {
    name:        'Time Pearl',
    symbol:      '⧖',
    description: 'Throw at your feet. Freezes enemy for N turns. Elegant, if you ignore what it actually is.',
    ingredients: [{ type: 'time', baseQty: 5 }],
    baseSuccess: 0.40,
    baseCalcCost:5,
    effectPower: [0, 1, 1, 2, 2, 3], // frozen turns per skill level
    xpReward:    20,
  },
  motionPowder: {
    name:        'Motion Powder',
    symbol:      '↯',
    description: 'Rub on skin before a fight. Temporarily accelerates your movement — you act faster than anyone can track.',
    ingredients: [{ type: 'motion', baseQty: 6 }],
    baseSuccess: 0.35,
    baseCalcCost:6,
    effectPower: [0, 1, 1, 2, 2, 3], // extra attacks per turn (1=attack twice, 2=attack twice for 2 turns, 3=attack 3x)
    xpReward:    25,
  },
  rewind: {
    name:        'Rewind',
    symbol:      '⟲',
    description: 'Shaped like an hourglass. Briefly unspools time — only you remember what happened. Difficult and expensive to produce.',
    ingredients: [{ type: 'time', baseQty: 6 }],
    baseSuccess: 0.40,
    baseCalcCost:6,
    effectPower: [0, 2, 2, 2, 2, 2], // turns rewound in combat
    xpReward:    35,
    eventUsable: true,
  },
};

// Crafting skill XP thresholds per level (level 1 = starting)
const CRAFTING_XP_LEVELS = [0, 0, 80, 220, 500, 1000]; // index = level

// Device XP thresholds — level up = +1 charge per day
const DEVICE_XP_LEVELS = [0, 0, 50, 150, 400, 1000]; // index = level

// Devices — craftable equipment using orichalchum
const DEVICE_TYPES = {
  timeDevice: {
    id:          'timeDevice',
    name:        'Time Device',
    symbol:      '⧖',
    calcType:    'time',
    recipeKey:   'timePearl',
    description: `A calibrated time-type device. Produces a localised time-freeze field on demand. Recharges daily.`,
    unlockFlag:  'craftingUnlocked',
    effect:      'freeze',
  },
  motionDevice: {
    id:          'motionDevice',
    name:        'Motion Device',
    symbol:      '↯',
    calcType:    'motion',
    recipeKey:   'motionPowder',
    description: `A motion-type device. Accelerates the user briefly on demand. Recharges daily.`,
    unlockFlag:  'motionPowderUnlocked',
    effect:      'motion',
  },
  rewindDevice: {
    id:          'rewindDevice',
    name:        'Rewind Device',
    symbol:      '⟲',
    calcType:    'time',
    recipeKey:   'rewind',
    description: `A precision time-type device. Unspools a short window of time on demand. Only you retain knowledge of the rewind. Recharges daily.`,
    unlockFlag:  'craftingUnlocked',
    effect:      'rewind',
    eventUsable: true,
  },
};

// Equippable items
const ITEMS = {
  crowbar: {
    id:          'crowbar',
    name:        'Crowbar',
    symbol:      '🔧',
    slot:        'weapon',
    description: 'A 60cm steel crowbar. Heavy enough to matter. Also useful for doors, if you have legitimate reasons to open them.',
    attackBonus: { min: 4, max: 8 },
    flavour:     'It is what it is.',
  },
};

// Tutorial gate
const ARCHIE_ORE_GOAL = 10;

// ── HOME TIERS ───────────────────────────────────────────────
const HOME_TIERS = {
  bedsit:    { id:'bedsit',    name:'Bedsit',            tier:1, upgradeCost:0,      dailyCost:50,  raidBaseChance:0.08,  maxSecuritySlots:1, maxRooms:0,  description:`A single room in Whitechapel. The boiler makes a sound like someone clearing their throat. No storage to speak of.` },
  flat:      { id:'flat',      name:'Flat',              tier:2, upgradeCost:1200,   dailyCost:80,  raidBaseChance:0.06,  maxSecuritySlots:2, maxRooms:1,  description:`Two rooms above a nail bar in Hackney. Neighbours ask no questions. One spare room.` },
  townhouse: { id:'townhouse', name:'Townhouse',         tier:3, upgradeCost:4000,   dailyCost:150, raidBaseChance:0.04,  maxSecuritySlots:3, maxRooms:3,  description:`Three floors, Bethnal Green. Previous tenant left in a hurry. Three spare rooms.` },
  safehouse: { id:'safehouse', name:'Safehouse',         tier:4, upgradeCost:12000,  dailyCost:300, raidBaseChance:0.02,  maxSecuritySlots:4, maxRooms:5,  description:`Off-grid property, no registered occupant. Not technically yours, but no one is arguing. Five spare rooms.` },
  compound:  { id:'compound',  name:'Compound',          tier:5, upgradeCost:40000,  dailyCost:600, raidBaseChance:0.01,  maxSecuritySlots:5, maxRooms:8,  description:`Gated property, East London. Eight rooms. People who matter know you live here.` },
  mansion:   { id:'mansion',   name:'Mansion & Grounds', tier:6, upgradeCost:150000, dailyCost:1500,raidBaseChance:0.005, maxSecuritySlots:6, maxRooms:12, description:`Grounds, staff quarters, a gate. Twelve rooms. Plato would have something to say about this.` },
};

const HOME_SECURITY = {
  lock:           { id:'lock',           name:'Reinforced Lock', cost:80,   raidReduction:0.02, description:`Slows down anyone trying the front door. Not much, but something.` },
  cameras:        { id:'cameras',        name:'CCTV',            cost:250,  raidReduction:0.03, description:`Four cameras, monitored by an app that sometimes works.` },
  reinforcedDoor: { id:'reinforcedDoor', name:'Reinforced Door', cost:600,  raidReduction:0.04, description:`Steel-core. Would require a vehicle to breach, which draws attention.` },
  alarm:          { id:'alarm',          name:'Alarm System',    cost:400,  raidReduction:0.03, description:`Monitored alarm. Response time: nine minutes. Make of that what you will.` },
  guard:          { id:'guard',          name:'Hired Guard',     cost:1200, raidReduction:0.05, description:`Someone on site. Expensive. Asks fewer questions than you might expect.` },
  ward:           { id:'ward',           name:'Orichalchum Ward',cost:2000, raidReduction:0.06, description:`James installed it. Doesn't explain what it does. It works.` },
};

const HOME_ROOMS = {
  workshop:    { id:'workshop',    name:'Workshop',        cost:800,   minTier:'flat',      bonus:'crafting', bonusValue:0.08, description:`Bench, tools, decent lighting. Slightly increases crafting success chance.` },
  homeGym:     { id:'homeGym',    name:'Home Gym',        cost:600,   minTier:'flat',      bonus:'body',     bonusValue:10,   description:`Increases max HP and physical attack. It's just a pull-up bar and some kettlebells, but it helps.` },
  library:     { id:'library',    name:'Library',         cost:1200,  minTier:'townhouse', bonus:'crafting', bonusValue:0.08, description:`Reference books, field notes. Stacks with the workshop bonus.` },
  safeRoom:    { id:'safeRoom',   name:'Safe Room',       cost:2000,  minTier:'townhouse', bonus:'storage',  bonusValue:0.5,  description:`Halves the amount stolen in a raid. Panic room logic.` },
  ops:         { id:'ops',        name:'Operations Room', cost:5000,  minTier:'safehouse', bonus:'faction',  bonusValue:1,    description:`Desk, screens, maps. Allows a faction contact to run operations from here.` },
  veinStation: { id:'veinStation',name:'Vein Cultivation Station', cost:8000,  minTier:'safehouse', bonus:'passive',  bonusValue:1,    description:`An assigned contact tends your marked veins daily — cultivating when possible, cautiously harvesting when charged. Yield lands in your inventory automatically.` },
  lab:         { id:'lab',        name:'Lab',             cost:15000, minTier:'compound',  bonus:'crafting', bonusValue:0.12, description:`Professional setup. Set stock thresholds per recipe and an assigned contact will craft to meet them each day, using their skill and improving over time. James approved of it, which is as close to a compliment as he gets.` },
};

// ── FACTIONS ─────────────────────────────────────────────────
const FACTIONS = {
  collective: { id:'collective', name:'The Collective',               shortName:'Collective', tagline:`Community-run. Loosely organised. Surprisingly effective.`,             industries:['sourcing','trading'],              description:`A decentralised network of vein finders and small traders. No hierarchy — or at least, no admitted hierarchy. Strong in East and South London. They find and protect veins collaboratively, share yields, and move ore through trusted contacts. Low entry bar, low ceiling.`,                                                                                                                                      joinRelation:20, colour:'#3a7a52' },
  firm:       { id:'firm',       name:'The Firm',                     shortName:'Firm',       tagline:`Old money, new methods.`,                                               industries:['raiding','trading'],               description:`A well-established crew with roots going back further than anyone admits. Operate across South and West London. Specialise in acquiring high-value veins by force and reselling refined product at premium rates. Professional, ruthless, not interested in small operators — unless you show promise.`,                                                                                                    joinRelation:35, colour:'#9b2335' },
  guild:      { id:'guild',      name:'The Guild of Applied Alchemists',shortName:'The Guild',tagline:`They've been here since before the word 'orichalchum' was anglicised.`, industries:['crafting','trading'],              description:`Formal, ancient, and deeply unimpressed by everyone. The Guild controls the majority of high-end crafting knowledge in London. James is a member, though he'd describe his relationship with them as 'complicated'. Joining requires demonstrated crafting ability and a sponsor.`,                                                                                                                            joinRelation:40, colour:'#7b68ee' },
  network:    { id:'network',    name:'The Network',                  shortName:'Network',    tagline:`Information is the resource.`,                                          industries:['trading','influence'],             description:`No one's quite sure who runs The Network or what they actually want. They surface occasionally to broker information — who has what vein, who is selling, what the barometer is doing. They seem to know things before they happen. They are interested in you, which should be flattering and is mostly unsettling.`,                                                                                  joinRelation:30, colour:'#c8873a' },
  conclave:   { id:'conclave',   name:'The Conclave',                 shortName:'Conclave',   tagline:`Policy, pressure, and things that can't be admitted in public.`,         industries:['influence','sourcing','crafting'], description:`Old enough to have advised governments. New enough to use WhatsApp. The Conclave operates at the intersection of orichalchum and institutional power — they shape economic and political conditions that affect everyone else. Joining requires high standing, rare resources, and the willingness to do things that don't appear on any list.`, joinRelation:60, colour:'#2a8fc4' },
};

// ── GLOBAL BAROMETER ─────────────────────────────────────────
const BAROMETER_STATES = {
  economic: {
    stable:    { id:'stable',    label:'Stable',       description:'Markets function normally. Ore prices steady.', effects:{} },
    boom:      { id:'boom',      label:'Economic Boom', description:'Demand up. Buyers flush with cash.', effects:{ orePrice:+0.25, mugChance:-0.05 } },
    recession: { id:'recession', label:'Recession',     description:'Buyers tighter. Prices softer.', effects:{ orePrice:-0.20, mugChance:+0.05 } },
    crisis:    { id:'crisis',    label:'Financial Crisis', description:'Market collapse. Some ore types in desperate demand.', effects:{ orePrice:-0.35, mugChance:+0.12, voidPremium:+0.5 } },
    inflation: { id:'inflation', label:'High Inflation', description:'Everything costs more. Daily costs up.', effects:{ dailyCost:+0.30, orePrice:+0.10 } },
  },
  social: {
    stable:   { id:'stable',   label:'Stable',        description:'Normal levels of street activity.',  effects:{} },
    unrest:   { id:'unrest',   label:'Social Unrest',  description:'Police busy elsewhere. Raid risks up, but so is opportunity.', effects:{ mugChance:+0.08, raidChance:+0.10 } },
    lockdown: { id:'lockdown', label:'Lockdown',       description:'Movement restricted. Searching harder, yields lower.', effects:{ searchFind:-0.15, dailyCost:+0.10 } },
    festival: { id:'festival', label:'City Festival',  description:'Energy high, people out. Motion ore in demand.', effects:{ motionPremium:+0.40, searchFind:+0.05 } },
    crime:    { id:'crime',    label:'Crime Wave',     description:'Everyone is at it. Mugging risk elevated.', effects:{ mugChance:+0.15, homeRaid:+0.05 } },
  },
  political: {
    stable:     { id:'stable',    label:'Stable',          description:'No significant political pressure.', effects:{} },
    war:        { id:'war',       label:'Conflict Abroad',  description:'Military demand. Time and energy ore prices surge.', effects:{ timePremium:+0.6, energyPremium:+0.4, mugChance:+0.05 } },
    austerity:  { id:'austerity', label:'Austerity',        description:'Public services cut. Daily costs down but so is stability.', effects:{ dailyCost:-0.15, mugChance:+0.06 } },
    regulation: { id:'regulation',label:'Ore Regulation',   description:'Government crackdown. All trading riskier, prices up.', effects:{ mugChance:+0.10, orePrice:+0.15 } },
    election:   { id:'election',  label:'Election Period',   description:'Noise and distraction. Barometer effects muted temporarily.', effects:{ effectMod:-0.3 } },
  },
};

// Barometer action costs (to influence a section)
const BAROMETER_ACTIONS = [
  { id:'lobbyConclave',  label:'Lobby the Conclave',  section:'political', cost:{ cash:5000, void:20 },  requireFaction:'conclave', description:`Lean on Conclave contacts to shift the political climate.` },
  { id:'floodMarket',    label:'Flood the market',    section:'economic',  cost:{ cash:2000, ore:50 },   requireFaction:null,       description:`Dump ore on the market to destabilise prices. Crude but effective.` },
  { id:'spreadRumours',  label:'Spread rumours',      section:'social',    cost:{ cash:500 },            requireFaction:'network',  description:`The Network's speciality. Shape public perception.` },
  { id:'engineerCrisis', label:'Engineer a crisis',   section:'economic',  cost:{ cash:10000, void:40 }, requireFaction:'conclave', description:`Requires serious resources. Serious consequences.` },
];

// Faction barometer preferences — persistent background nudges each day
const FACTION_BAROMETER_PREFS = {
  collective: [
    { section:'economic',  state:'stable',  direction:'push', strength:3 },
    { section:'social',    state:'stable',  direction:'push', strength:3 },
  ],
  firm: [
    { section:'economic',  state:'boom',       direction:'push', strength:4 },
    { section:'social',    state:'crime',      direction:'push', strength:3 },
    { section:'political', state:'regulation', direction:'pull', strength:3 },
  ],
  guild: [
    { section:'economic',  state:'stable',  direction:'push', strength:3 },
    { section:'political', state:'stable',  direction:'push', strength:3 },
    { section:'social',    state:'unrest',  direction:'pull', strength:2 },
  ],
  network: [
    { section:'economic',  state:'inflation', direction:'push', strength:3 },
    { section:'social',    state:'unrest',    direction:'push', strength:3 },
    { section:'political', state:'election',  direction:'push', strength:3 },
  ],
  conclave: [
    { section:'political', state:'regulation', direction:'push', strength:4 },
    { section:'political', state:'war',        direction:'push', strength:3 },
    { section:'economic',  state:'crisis',     direction:'push', strength:3 },
  ],
};
const INTRO_CARDS = [
  { type:'narration', label:'Earlier tonight — Whitechapel', text:'Rent is due Friday. You have forty quid. A friend of a friend said Archie might be able to help. So here you are, behind a chicken shop on Mile End Road at half ten on a Tuesday, holding one end of a suitcase.' },
  { type:'narration', label:null, text:'The buyers arrive in a grey Vauxhall. Three of them. That\'s one more than Archie mentioned. He notices too — you can tell by the way he stops whistling.' },
  { type:'tension',   label:'It goes wrong', text:'The one nearest to you produces a Stanley knife. His mate grabs the suitcase. The third one just stands there, which is somehow worse. Archie says, very quietly: <em>"Yeah, okay."</em>' },
  { type:'speaker',   speaker:'Archie', text:'"Hold on — I dropped something."' },
  { type:'narration', label:null, text:'He crouches, presses a small glass ball against the tarmac, and flicks it. It shatters. The air around the three men goes thick and syrupy. They slow. Not stop — but slow, like a video buffering. Archie picks up the suitcase and walks, briskly, to the end of the alley.' },
  { type:'speaker',   speaker:'Archie', text:'"Coming, or what?"' },
  { type:'resolution',label:'Fifteen minutes later — a Wetherspoons', text:'Archie orders two pints and a portion of chips. You sit down opposite him. Neither of you say anything until the chips arrive.' },
  { type:'speaker',   speaker:'You',    text:'"What the hell was that?"' },
  { type:'speaker',   speaker:'Archie', text:'"Orichalchum. Time-type. Slows things down in a radius — maybe four, five seconds of real time bought, if you compress it right. Was my last one, actually, so cheers for that."' },
  { type:'speaker',   speaker:'You',    text:'"Is that... magic?"' },
  { type:'speaker',   speaker:'Archie', text:'"Yes. It\'s basically magic. Don\'t make a big deal out of it. It\'s just like any resource — some people source it, some people turn it into something useful, some people use it. In between all that, people like us can make a quid or two connecting them. If we\'re lucky."' },
  { type:'speaker',   speaker:'Archie', text:`"Look. You need rent money. I need someone who isn't a liability. Come out with me tomorrow — I've still got the calc from tonight, and I need to move it properly. This time with backup. You free?"` },
  { type:'speaker',   speaker:'You',    text:`"Yeah."` },
  { type:'speaker',   speaker:'Archie', text:`"Good. I'll text you in the morning. Don't do anything that ends you up in hospital before then."` },
  { type:'narration', label:null, text:`He finishes his pint and leaves. You sit with the other one and the chips and the fact that your rent problem has, somehow, become a different problem entirely.` },
];

// ── JAMES MEETING CARDS ──────────────────────────────────────
const JAMES_CARDS = [
  { type:'narration', label:'Two days later — Bermondsey', text:'The address Archie texted is a storage unit behind a halal supermarket. You find him leaning against the corrugated shutter, hands in pockets, looking like he\'s waiting for a bus he knows is going to be late.' },
  { type:'narration', label:null, text:'The man who opens the shutter is in his sixties. Glasses with one slightly bent arm, a cardigan that has seen things. He looks at the two of you over the rim of his lenses with the specific expression of someone whose time is being wasted — and who has decided, provisionally, to allow it.' },
  { type:'speaker',   speaker:'Archie', text:'"James. Cheers for this. This is — well, he\'s helping me out at the moment."' },
  { type:'speaker',   speaker:'James',  text:'"Yes. I can see that. Come in, then. Don\'t touch anything."' },
  { type:'narration', label:null, text:'Inside: shelves of labelled jars, a workbench covered in instruments that look like someone crossed a chemistry set with an antique shop. It smells of copper and something you can\'t name.' },
  { type:'narration', label:null, text:'You lean in toward a row of sealed jars. One of them contains something that shifts — not from the movement of the shelf, not from any air in the room. It moves, very slightly, as if it noticed you.' },
  { type:'narration', label:null, text:'You glance up. James is watching you. His expression doesn\'t change, exactly. But something in it does.' },
  { type:'speaker',   speaker:'Archie', text:'"He\'s the best craftsman I know. Turns raw calc into — well, you\'ve seen what the pearls do."' },
  { type:'speaker',   speaker:'James',  text:'"Don\'t flatter me. I\'m the only craftsman you know. There\'s a difference." He turns to Archie. "I have an order I need moved. I\'ll give you the next batch of pearls at cost — usual rate — if you pick up a supply run for me. Stratford. Tonight."' },
  { type:'speaker',   speaker:'Archie', text:'"Yeah, alright. What am I picking up?"' },
  { type:'speaker',   speaker:'James',  text:'"Motion calc, forty units. The address will be on your phone by the time you\'re outside." He sets down the jar he\'s holding. "Your associate stays here."' },
  { type:'speaker',   speaker:'Archie', text:'"Right." He\'s already moving toward the door. "Cheers, James. Back in a bit."' },
  { type:'narration', label:null, text:'The shutter closes. James stands in the silence for a moment, regarding you with the careful expression of a man who has decided to do something he hasn\'t fully justified to himself yet.' },
  { type:'speaker',   speaker:'James',  text:'"I have a substantial order for time pearls. My usual assistant is indisposed. You\'ll do." A pause. "I realise that isn\'t flattering. It isn\'t meant to be."' },
  { type:'speaker',   speaker:'You',    text:'"I don\'t know how to make them."' },
  { type:'speaker',   speaker:'James',  text:'"Evidently. That is why I am going to explain it to you, slowly, using small words. Even a reasonably attentive puppy could manage this. I\'m trusting you to clear that bar."' },
  { type:'craft',     label:'Crafting: Time Pearl', text:'James walks you through it. Time orichalchum, compressed into a glass sphere under controlled conditions. The calc does most of the work — you\'re just the hands. The sphere seals itself when it\'s ready. Or it doesn\'t, and the calc disperses. That\'s it, really.' },
  { type:'speaker',   speaker:'James',  text:'"The quality of the pearl depends on how cleanly you compress it. Rushed work means the time effect is weak — one turn, maybe less. Patient, careful work produces something that can freeze a situation for several seconds. You will, at first, be rushing it. That\'s fine. You\'ll improve. Probably."' },
  { type:'speaker',   speaker:'James',  text:'"And do try your very best not to fuck it up. The calc isn\'t free."' },
  { type:'speaker',   speaker:'James',  text:'"You know, Plato described orichalchum as the second most precious metal in Atlantis. Wrote about it in the Critias — considered it almost mystical in nature." He pauses. "You have absolutely no idea what the Critias is, do you."' },
  { type:'narration', label:null, text:'It isn\'t really a question. You don\'t answer it.' },
  { type:'speaker',   speaker:'James',  text:'"It doesn\'t matter. The point is that people have understood what this material is for approximately two and a half thousand years, and we still have people like Archie picking up deliveries in Stratford. Make of that what you will."' },
  { type:'resolution', label:null, text:'You spend two hours at the bench. Some of the pearls work. Some don\'t. James says nothing about the ones that don\'t, which is somehow worse than if he had.' },
  { type:'resolution', label:null, text:'You leave with a crafting kit, a basic understanding of time pearl compression, and the distinct impression that James noticed something — and has decided, for now, not to mention it.' },
];

// ── BUYER EVENT CARDS ─────────────────────────────────────────
const BUYER_CARDS = [
  { type:'narration', label:'The next morning', text:`Archie texts an address in Shoreditch and the word "tonight". You arrive to find him outside a craft beer bar, looking mildly disgusted by its existence.` },
  { type:'speaker',   speaker:'Archie', text:`"Right. Same calc from the other night — I held onto it. Buyer's inside. Name's Marcus, finance, collects time-type for what he calls 'recreational use'. Don't ask. Just be normal. Or close to it."` },
  { type:'speaker',   speaker:'You',    text:`"This is the same stuff. From when they tried to rob us."` },
  { type:'speaker',   speaker:'Archie', text:`"Correct. Which is why having two of us is better than one. You're essentially a deterrent. Like a scarecrow. No offence."` },
  { type:'speaker',   speaker:'You',    text:`"Some offence."` },
  { type:'speaker',   speaker:'Archie', text:`"Noted."` },
  { type:'narration', label:null, text:`Marcus is exactly what you expected: fleece, Patagonia, very clean trainers. He examines the calc with the careful enthusiasm of someone who has recently read about it online. He pays promptly, which is nice.` },
  { type:'speaker',   speaker:'Archie', text:`"See? Smooth as you like. Most of them are like Marcus. Professional, prompt, no Stanley knife. That's the market we're targeting."` },
  { type:'resolution',label:'Walking back — Shoreditch High Street', text:`Archie splits the cash on the pavement outside a Pret. The city moves around you, completely indifferent to any of this.` },
  { type:'speaker',   speaker:'Archie', text:`"So. I've got a contact who knows a lot more about this than I do. Bloke called James — craftsman, Bermondsey. Takes raw calc and makes things out of it. Like the pearls. I've been meaning to introduce you."` },
  { type:'speaker',   speaker:'You',    text:`"Sure."` },
  { type:'speaker',   speaker:'Archie', text:`"I'll set it up. Give me a couple of days."` },
];

// ── JAMES CRAFTING EVENT CARDS ───────────────────────────────
const JAMES_CRAFT_CARDS = [
  { type:'narration', label:'A text from James', text:'It simply reads: "I have an order. I require assistance. Do not make this into a thing." Archie, when you show him, just nods as if this is perfectly normal.' },
  { type:'speaker',   speaker:'Archie', text:'"James has his moments. Take it as a compliment — he doesn\'t ask for help. He considers it structurally embarrassing."' },
  { type:'narration', label:'Bermondsey — the storage unit', text:'James opens the door before you knock, which is somehow more unnerving than if he\'d made you wait. He steps aside in silence and gestures to the workbench.' },
  { type:'speaker',   speaker:'James',  text:'"I have a substantial order for time pearls. My usual assistant is indisposed. You are what\'s available. Please try not to touch anything labelled in red."' },
  { type:'speaker',   speaker:'You',    text:'"I don\'t know how to make them."' },
  { type:'speaker',   speaker:'James',  text:'"Evidently. That is why I am going to explain it to you, slowly, using small words. Even a reasonably attentive puppy could manage this. I\'m trusting you to clear that bar."' },
  { type:'craft',     label:'Crafting: Time Pearl', text:'James walks you through it. Time orichalchum, compressed into a glass sphere under controlled conditions. The calc does most of the work — you\'re just the hands. The sphere seals itself when it\'s ready. Or it doesn\'t, and the calc disperses. That\'s it, really.' },
  { type:'speaker',   speaker:'James',  text:'"The quality of the pearl depends on how cleanly you compress it. Rushed work means the time effect is weak — one turn, maybe less. Patient, careful work produces something that can freeze a situation for several seconds. You will, at first, be rushing it. That\'s fine. You\'ll improve. Probably."' },
  { type:'speaker',   speaker:'James',  text:'"And do try your very best not to fuck it up. The calc isn\'t free."' },
  { type:'speaker',   speaker:'James', text:'"You know, Plato described orichalchum as the second most precious metal in Atlantis. Wrote about it in the Critias — considered it almost mystical in nature." He pauses. "You have absolutely no idea what the Critias is, do you."' },
  { type:'narration', label:null, text:'It isn\'t really a question. You don\'t answer it.' },
  { type:'speaker',   speaker:'James', text:'"It doesn\'t matter. The point is that people have understood what this material is for approximately two and a half thousand years, and we still have people like Archie flogging it behind a Costcutter. Make of that what you will."' },
  { type:'resolution',label:null, text:'You spend two hours at the bench. Some of the pearls work. Some don\'t. James says nothing about the ones that don\'t, which is somehow worse than if he had.' },
  { type:'resolution',label:null, text:'You leave with a crafting kit, a basic understanding of time pearl compression, and the distinct impression that James has already forgotten you were there.' },
];

// ── ARCHIE POST-CRAFT MEETUP CARDS ──────────────────────────
const ARCHIE_CRAFT_CHAT_CARDS = [
  { type:'narration', label:'A few days later \u2014 Spitalfields Market', text:`Archie is eating a falafel wrap and looking at his phone. He waves you over without looking up, which is either comfortable familiarity or mild rudeness. Probably both.` },
  { type:'speaker',   speaker:'Archie', text:`"Alright. How'd it go with James, then?"` },
  { type:'speaker',   speaker:'You',    text:`"He taught me how to make the pearls. Basic stuff, but \u2014 it worked."` },
  { type:'narration', label:null, text:`Archie stops chewing. He looks at you with an expression you haven't seen on him before: genuine surprise.` },
  { type:'speaker',   speaker:'Archie', text:`"He actually showed you? How to craft?"` },
  { type:'speaker',   speaker:'You',    text:`"Yeah. Why?"` },
  { type:'speaker',   speaker:'Archie', text:`"Because James doesn't show people things. James does things, judges people for not knowing how to do them, and considers that a complete interaction. Either he was absolutely desperate, or \u2014" He tilts his head. "He saw something worth the bother."` },
  { type:'speaker',   speaker:'Archie', text:`"Don't let it go to your head. You're at the bottom of a very long ladder. James has been at this for thirty years and he still considers himself underappreciated, which should tell you something about the ceiling."` },
  { type:'speaker',   speaker:'Archie', text:`"That said \u2014 keep practising. Seriously. Being able to craft your own means you're not at the mercy of James's prices, which frankly are a war crime. And it's a marketable skill."` },
  { type:'speaker',   speaker:'You',    text:`"Marketable how?"` },
  { type:'speaker',   speaker:'Archie', text:`"Same way the ore is. There's buyers for finished product too \u2014 people who want pearls and don't have a James. I can start lining them up. Anything you make that you don't need, bring it to me. We split it down the middle, same as the calc."` },
  { type:'resolution',label:null, text:`He finishes his wrap and bins the wrapper from four metres away. It goes in first time. He doesn't acknowledge this at all.` },
];

// ── ARCHIE MOTION EVENT CARDS ────────────────────────────────
const ARCHIE_MOTION_CARDS = [
  { type:'narration', label:'A message from Archie', text:`You've been moving product. It's working. Archie's text simply says: "good output. call me."` },
  { type:'speaker',   speaker:'Archie', text:`"So the consumables are going well. Got a buyer asking for more pearls and asking if there's anything else on offer. Which made me think — can you make anything else?"` },
  { type:'speaker',   speaker:'You',    text:`"Not yet. James only taught me the pearls."` },
  { type:'speaker',   speaker:'Archie', text:`"Yeah. Right. See, James knows how to make about forty different things and he's sitting on all of it. Which is his prerogative, obviously. But I'm thinking — have you got any sort of relationship with him yet? Because it might be worth asking."` },
  { type:'speaker',   speaker:'You',    text:`"Asking him to teach me more?"` },
  { type:'speaker',   speaker:'Archie', text:`"Gently. James doesn't respond well to being asked for things directly. Try framing it as being useful to him. Which, actually, you could be — if he's got orders he can't fill, you could take the overflow. Might be the angle."` },
  { type:'speaker',   speaker:'Archie', text:`"Worth a try anyway. He's the only craftsman I know who isn't either retired or in prison, so options are limited."` },
  { type:'resolution',label:null, text:`He hangs up before you can ask anything else. You look up James's address in your phone.` },
];

// ── JAMES MOTION EVENT CARDS ──────────────────────────────────
const JAMES_MOTION_CARDS = [
  { type:'narration', label:'Bermondsey — the storage unit', text:`James opens the door in what you're coming to recognise as his default expression: mild disappointment that the world continues to contain other people.` },
  { type:'speaker',   speaker:'James',  text:`"You again."` },
  { type:'speaker',   speaker:'You',    text:`"I wanted to ask if you'd be willing to teach me any other recipes. I've been practising — the pearls are improving."` },
  { type:'speaker',   speaker:'James',  text:`"I'm sure they are. Mediocrity tends to plateau early. What's in it for me?"` },
  { type:'speaker',   speaker:'You',    text:`"If you've got more orders than you can handle, I could take the overflow. Or just do the grunt work — the basic stuff that takes your time without needing your skill."` },
  { type:'narration', label:null, text:`James looks at you for a long moment. He picks up a glass sphere from his bench, turns it over, sets it down again. This appears to be how he thinks.` },
  { type:'speaker',   speaker:'James',  text:`"You are proposing to be my assistant."` },
  { type:'speaker',   speaker:'You',    text:`"If that's how you want to frame it."` },
  { type:'speaker',   speaker:'James',  text:`"I want to frame it accurately. You would not be a partner, a student, or a colleague. You would handle simple orders. I would retain all complex work. You would not advertise yourself as my associate."` },
  { type:'speaker',   speaker:'You',    text:`"That's fine."` },
  { type:'speaker',   speaker:'James',  text:`"Hm." Another pause. "Motion powder. It's straightforward. Motion orichalchum, compressed differently to the pearls — outward rather than inward. Rub a small amount on the skin before physical exertion. Temporarily accelerates the user's movement."` },
  { type:'craft',     label:'New recipe: Motion Powder', text:`The compression is different from pearls — you're pushing the calc outward through a membrane rather than sealing it. The result is a fine iridescent dust. James demonstrates once. He expects you to manage after that.` },
  { type:'speaker',   speaker:'James',  text:`"Quality scales with skill, as always. Low-grade powder gives you one extra action in a fight. Better work gives you more. I trust you understand the principle."` },
  { type:'speaker',   speaker:'James',  text:`"I'll send you work when I have overflow. Don't expect it to be glamorous. And don't be late."` },
  { type:'resolution',label:null, text:`You leave with the recipe and the firm sense that James considers this arrangement a concession rather than a collaboration. You suspect that won't change.` },
];

// ── HOME RAID EVENT CARDS ────────────────────────────────────
// Intro before combat (shown before fight starts)
const HOME_RAID_INTRO_CARDS = [
  { type:'tension',   label:'3:14 AM', text:`Something woke you up. You lie still for a moment, cataloguing the sounds of the building. The boiler. A fox outside. Then: footsteps, not from the corridor. From inside.` },
  { type:'narration', label:null, text:`Someone's in the flat. Moving carefully, which is almost worse than if they were crashing around — it means they've done this before.` },
  { type:'tension',   label:null, text:`You grab the nearest thing to hand — which, for better or worse, is the crowbar you left by the bed after last week — and go to meet them.` },
];

// Archie debrief — WIN version
const HOME_RAID_WIN_CARDS = [
  { type:'resolution', label:'Forty minutes later', text:`The police were called by a neighbour and left without much interest. You gave a statement that was technically accurate in every detail that didn't matter. The raider is gone. Your ore is still here.` },
  { type:'narration',  label:null, text:`Archie arrives at seven in the morning with two coffees and the air of a man who has absolutely expected this.` },
  { type:'speaker',    speaker:'Archie', text:`"You alright?"` },
  { type:'speaker',    speaker:'You',    text:`"Yeah. They didn't get anything."` },
  { type:'speaker',    speaker:'Archie', text:`"Good. That's good." He looks around the flat. "This place is a liability, you know that? One lock on the door and a window that doesn't close properly. You might as well put a sign up."` },
  { type:'speaker',    speaker:'Archie', text:`"Anyway. You handled yourself, which is — honestly, that's more than I expected. No offence."` },
  { type:'speaker',    speaker:'You',    text:`"Some offence."` },
  { type:'speaker',    speaker:'Archie', text:`"Fair. Look — this has made me think. We've been doing well together. You've been reliable, which in this line of work is genuinely rare. I think we should make it proper."` },
  { type:'speaker',    speaker:'Archie', text:`"Official partners. Means I look out for you, you look out for me. And it means I can call in a favour — got a bloke who does security installs. Good gear, reasonable price, he doesn't ask questions. I'll have him round."` },
  { type:'speaker',    speaker:'Archie', text:`"Also — and this is me being straight with you — you need to move. This place is done. Save up, find somewhere better. Nicer area, proper security, somewhere people can't just walk into at three in the morning."` },
  { type:'speaker',    speaker:'Archie', text:`"And — the vein. I said I'd transfer it. Consider it done. Time vein, Whitechapel, level one. It needs work before it'll produce anything, but it's yours. Cultivate it up, harvest what you can, make pearls. I'll handle the buyers."` },
  { type:'resolution', label:null, text:`He finishes his coffee and leaves before you can thank him, which is probably how he prefers it. You check your phone. There's a pin location. The vein.` },
];

// Archie debrief — LOSS version
const HOME_RAID_LOSS_CARDS = [
  { type:'tension',    label:'Later', text:`You come round on the floor. Your ore is gone. The window is open. There's a coffee cup knocked over that wasn't knocked over before, which somehow makes it worse.` },
  { type:'narration',  label:null, text:`Archie arrives at seven in the morning. He takes one look at you and puts the coffees down without saying anything for a moment.` },
  { type:'speaker',    speaker:'Archie', text:`"Right. How much did they get?"` },
  { type:'speaker',    speaker:'You',    text:`"Most of it."` },
  { type:'speaker',    speaker:'Archie', text:`"Yeah." He sits down. "This place is a problem. I've been meaning to say something for a while. One lock. Window doesn't close. It's practically a service entrance."` },
  { type:'speaker',    speaker:'Archie', text:`"You alright, though? Properly?"` },
  { type:'speaker',    speaker:'You',    text:`"I'm fine."` },
  { type:'speaker',    speaker:'Archie', text:`"Good. Because here's the thing — you're still here, you still fought back, and that counts for something. I've worked with people who'd have just handed it over." He pauses. "Some of them were me, early on."` },
  { type:'speaker',    speaker:'Archie', text:`"I think it's time we made this official. Partners. Properly. Which means I've got a responsibility to make sure you're not operating out of a place someone can stroll into at three in the morning."` },
  { type:'speaker',    speaker:'Archie', text:`"Got a bloke who does security — good stuff, fair price, no paperwork. And you need to start thinking about moving somewhere better. This is the kind of place that keeps happening to you until you leave it."` },
  { type:'speaker',    speaker:'Archie', text:`"And — the vein. Time vein, Whitechapel, level one. I said I'd give it to you and I meant it. It needs cultivating before it'll produce anything, but it's a start. Build it up, harvest it, make pearls. I'll sort the buyers."` },
  { type:'resolution', label:null, text:`He stays until you've eaten something, which you didn't ask for and didn't expect. Then he leaves. You check your phone. There's a pin location. The vein.` },
];

// ── SMS SCRIPTS ───────────────────────────────────────────────
const ARCHIE_SMS_1 = [ // first contact: set up James meeting
  { from:'player', text:'You mentioned a bloke called James. When can we sort that?' },
  { from:'archie', text:'Already arranged. Tomorrow — SE1 4YA, storage unit behind the Costcutter. Midday.' },
  { from:'archie', text:'Fair warning: James is the best craftsman I know and also the worst person I know. Don\'t take it personally. He\'s like that with everyone.' },
];

const ARCHIE_SMS_2 = [ // contact to find a buyer
  { from:'player', text:'Got some calc to move. You got a buyer?' },
  { from:'archie', text:'Yeah give me a day or two. What type and how much?' },
  { from:'player', text:'Mixed. Maybe fifteen units.' },
  { from:'archie', text:'Sorted. I\'ll bell you. Don\'t go anywhere daft in the meantime.' },
  { from:'archie', text:'Actually — you free tonight? Got someone lined up already. Shoreditch. Easy job.' },
];

