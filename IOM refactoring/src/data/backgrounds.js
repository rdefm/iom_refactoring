export const BACKGROUNDS = {
  locator:{
    key:"locator", name:"The Locator",
    desc:"Broke, but sharp. You can find what others walk past.",
    perks:["£50 — barely scraping by","Sensing 4, Combat 1, Sigil-Making 1","Strong Kinetic & Primal affinity"],
    difficulty:"Hard",
    money:50, favours:0,
    competencies:{ combat:1, sigil:1, sensing:4, perception:3, persuasion:1, agility:3 },
    affinities:{ Light:0, Matter:0, Life:0, Kinetic:1, Primal:2 },
    essentia:{ Light:0, Matter:0, Life:0, Kinetic:2, Primal:2 },
  },
  armsman:{
    key:"armsman", name:"House Armsman",
    desc:"Trained muscle for a noble House. Handy with essentia and a blade.",
    perks:["£200 — modest pay","Sensing 1, Combat 4, Sigil-Making 2","Strong Light & Life affinity"],
    difficulty:"Medium",
    money:200, favours:1,
    competencies:{ combat:4, sigil:2, sensing:1, perception:2, persuasion:1, agility:2 },
    affinities:{ Light:1, Matter:0, Life:1, Kinetic:0, Primal:0 },
    essentia:{ Light:2, Matter:1, Life:2, Kinetic:1, Primal:0 },
  },
  househead:{
    key:"househead", name:"House Head",
    desc:"Born to privilege. Resources aplenty, but reputation comes with strings.",
    perks:["£1,000 + 5 Favours","Sensing 2, Combat 2, Sigil-Making 3","Starts with a NOD Laser sigil"],
    difficulty:"Easy",
    money:1000, favours:5,
    competencies:{ combat:2, sigil:3, sensing:2, perception:2, persuasion:3, agility:2 },
    affinities:{ Light:0, Matter:0, Life:0, Kinetic:0, Primal:0 },
    essentia:{ Light:1, Matter:1, Life:1, Kinetic:1, Primal:1 },
    sigils:[{ key:"starter_nod_laser", id:"nod_laser", power:null }],
    equipped:{ hand1:"starter_nod_laser", hand2:null, neck:null },
  },
};

export const STARTING_CONTACTS = [
  {
    id:"felix", name:"Felix", affiliation:"Independent",
    relation:10, requestChanceModifier:null,
    desc:"A street-level fixer with a cautious eye for talent and a nose for profit. Your first real contact in the city."
  }
];

export const TRAINING_CONFIG = {
  combat:     { label:"Combat",       flavor:"You run drills and work through combat forms." },
  sensing:    { label:"Sensing",      flavor:"You sit in quiet focus, stretching your awareness outward." },
  sigil:      { label:"Sigil-Making", flavor:"You work through sigil theory and practice your inscriptions." },
  persuasion: { label:"Persuasion",   flavor:"You work the room, practicing reading people and steering conversations." },
  perception: { label:"Perception",   trainable:false },
  agility:    { label:"Agility",      trainable:false },
};
