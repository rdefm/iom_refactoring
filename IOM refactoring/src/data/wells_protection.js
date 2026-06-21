export const PROTECTION_OPTIONS = {
  cameras: [
    { id:"cam_basic", label:"Basic Camera",       cost:80,  desc:"A single hidden camera. Deters casual snooping." },
    { id:"cam_good",  label:"Networked Cameras",  cost:250, desc:"Multiple cameras feeding a monitoring service." },
  ],
  alarms: [
    { id:"alarm_basic", label:"Silent Alarm",       cost:120, desc:"Trips a silent alert if someone lingers too long." },
    { id:"alarm_good",  label:"Linked Alarm System", cost:350, desc:"Alerts a response team automatically." },
  ],
  guards: [
    { id:"guard_none",   label:"No Guards",              dailyCost:0,   desc:"Rely on cameras and alarms alone." },
    { id:"guard_light",  label:"Hire 1 Watchman",         dailyCost:15,  desc:"A single guard keeps half an eye on the site." },
    { id:"guard_medium", label:"Hire Security Team (3)",  dailyCost:60,  desc:"A small armed team on rotation." },
    { id:"guard_heavy",  label:"Hire Armed Squad",        dailyCost:180, desc:"A proper squad — expensive, but a real deterrent." },
  ],
};

export const HOME_TIERS = {
  flatshare: {
    id:"flatshare", name:"Flat Share",
    desc:"A cramped room in a shared house. Cheap, cheerful, and someone keeps eating your food.",
    movingCost:0, dailyCost:0, raidChance:0.04, maxRooms:0, securityUpgrades:[], rooms:[],
  },
  flat: {
    id:"flat", name:"Flat",
    desc:"Your own front door. Quieter, no nosy housemates.",
    movingCost:200, dailyCost:100, raidChance:0.03, maxRooms:1,
    securityUpgrades:[
      { id:"lock",   label:"Upgraded Lock",    cost:150, desc:"A proper deadbolt. Reduces raid chance by 1%.",                                   raidReduction:0.01 },
      { id:"chain",  label:"Door Chain",        cost:80,  desc:"A simple chain gives you a few extra seconds.",                                   raidReduction:0.005 },
      { id:"camera", label:"Security Camera",   cost:250, desc:"A camera outside deters opportunists and alerts you to raids in progress.",       raidReduction:0.005, alertsRaid:true },
    ],
    rooms:[
      { id:"gym",   label:"🥊 Home Gym",       cost:100, type:"training", skill:"combat",     bonusPct:10, desc:"+10% chance to improve Combat when training." },
      { id:"study", label:"📚 Study",          cost:100, type:"training", skill:"sigil",      bonusPct:10, desc:"+10% chance to improve Sigil-Making when training." },
      { id:"den",   label:"🧘 Meditation Den", cost:100, type:"training", skill:"sensing",    bonusPct:10, desc:"+10% chance to improve Sensing when training." },
      { id:"salon", label:"🗣️ Social Salon",   cost:100, type:"training", skill:"persuasion", bonusPct:10, desc:"+10% chance to improve Persuasion when training." },
    ],
  },
  mansion: {
    id:"mansion", name:"Mansion",
    desc:"A sprawling estate on the edge of the city. Staff, grounds, and an address that makes people take you seriously.",
    movingCost:5000000, dailyCost:400, raidChance:0.05, maxRooms:10,
    securityUpgrades:[
      { id:"lock",    label:"Reinforced Doors",  cost:2000, desc:"Steel-core doors throughout. −1% raid chance.",           raidReduction:0.01 },
      { id:"cameras", label:"CCTV Network",       cost:5000, desc:"Full perimeter coverage. Alerts you to raids.",           raidReduction:0.01, alertsRaid:true },
      { id:"fence",   label:"Perimeter Fence",    cost:8000, desc:"High walls and gates. −2% raid chance.",                 raidReduction:0.02 },
      { id:"alarm",   label:"Alarm System",       cost:3000, desc:"A wired alarm throughout the property. −1.5% raid.",     raidReduction:0.015 },
    ],
    rooms:[
      { id:"gym",         label:"🥊 Home Gym",          cost:5000,  type:"training",   skill:"combat",     bonusPct:15, desc:"+15% Combat training chance." },
      { id:"study",       label:"📚 Study",             cost:5000,  type:"training",   skill:"sigil",      bonusPct:15, desc:"+15% Sigil-Making training chance." },
      { id:"den",         label:"🧘 Meditation Den",    cost:5000,  type:"training",   skill:"sensing",    bonusPct:15, desc:"+15% Sensing training chance." },
      { id:"salon",       label:"🗣️ Social Salon",      cost:5000,  type:"training",   skill:"persuasion", bonusPct:15, desc:"+15% Persuasion training chance." },
      { id:"barracks",    label:"⚔️ Barracks",          cost:10000, type:"barracks",   desc:"House guards who fight alongside you during raids." },
      { id:"kennel",      label:"🐕 Kennel",            cost:6000,  type:"kennel",     desc:"House guard dogs. Reduces raid chance." },
      { id:"garden_shed", label:"🌿 Gardener's Shed",  cost:8000,  type:"wellmanager",desc:"Assign a contact to manage your wells. £150/day." },
      { id:"office",      label:"🗂️ Office",            cost:8000,  type:"locator",    desc:"Assign a contact as a Locator. 4% daily chance to find and claim a new well. £200/day." },
    ],
  },
};
export const HOME_TIER_ORDER = ["flatshare","flat","mansion"];

export const BARRACKS_GUARD_TIERS = [
  { id:"none",   label:"Unoccupied",     dailyCost:0,   raidReduction:0,     desc:"No guards stationed here.",      combatants:[] },
  { id:"light",  label:"Light Guard",    dailyCost:100, raidReduction:0.01,  desc:"A single watchman. Fights alongside you if the mansion is raided.", combatants:[{ name:"Mansion Watchman", hp:75, atk:[5,10], combat:2, agility:2, sigils:[] }] },
  { id:"medium", label:"Security Detail",dailyCost:200, raidReduction:0.02,  desc:"Two armed guards on rotation.", combatants:[{ name:"Armed Guard", hp:90, atk:[7,13], combat:3, agility:2, sigils:[] },{ name:"Guard Sergeant", hp:95, atk:[8,14], combat:3, agility:2, sigils:["slam_sigil"] }] },
  { id:"heavy",  label:"Elite Squad",    dailyCost:300, raidReduction:0.035, desc:"A full squad of elite guards with sigil equipment.", combatants:[{ name:"Elite Guard", hp:100, atk:[10,16], combat:4, agility:3, sigils:["strength_sigil"] },{ name:"Guard Captain", hp:110, atk:[12,18], combat:5, agility:3, sigils:["slam_sigil","light_sigil"] },{ name:"Tactical Operative", hp:95, atk:[9,15], combat:4, agility:4, sigils:["reflex_sigil"] }] },
];
export const KENNEL_DOG_TIERS = [
  { id:"none",        label:"Empty",       dailyCost:0,   raidReduction:0,     desc:"No animals housed here." },
  { id:"guard_dogs",  label:"Guard Dogs",  dailyCost:200, raidReduction:0.005, desc:"Trained guard dogs. Nobody likes barking at 3am." },
  { id:"hellhounds",  label:"Hellhounds",  dailyCost:300, raidReduction:0.01,  desc:"Essentia-infused predators. Raiders who make it past the fence don't make it much further." },
];
