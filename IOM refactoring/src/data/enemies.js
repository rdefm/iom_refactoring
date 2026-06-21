export const FIXED_PASSIVE_BONUS = { mending:30 }; // Mending: +30% heal on Rest

export const DRAIN_ENEMIES = {
  light:  [
    { name:"Watchman",      hp:70,  atk:[3,8],   combat:1, agility:1 },
    { name:"Site Guard",    hp:85,  atk:[5,10],  combat:2, agility:2 },
  ],
  medium: [
    { name:"Security Team Lead",      hp:90,  atk:[8,14],  combat:3, agility:2, sigils:["slam_sigil"] },
    { name:"Armed Security Officer",  hp:95,  atk:[9,15],  combat:3, agility:2, sigils:["light_sigil"] },
  ],
  heavy:  [
    { name:"Professional Soldier",  hp:100, atk:[12,20], combat:5, agility:3, sigils:["iron_fist","slam_sigil"] },
    { name:"Elite Squad Leader",    hp:110, atk:[14,24], combat:6, agility:4, sigils:["haywire_sigil","light_sigil"] },
  ],
};
export const BACKUP_SQUADS = {
  light:  [{ name:"Light Response Team (3)", hp:95,  atk:[10,18], combat:4, agility:2, sigils:["slam_sigil"] }],
  medium: [{ name:"Armed Backup Squad",      hp:105, atk:[14,22], combat:5, agility:2, sigils:["light_sigil","slam_sigil"] }],
  heavy:  [{ name:"Elite Reinforcement Squad", hp:115, atk:[18,28], combat:7, agility:3, sigils:["haywire_sigil","iron_fist"] }],
};
export const RAIDER_SQUADS = { // Proxy drain enemies for well raids
  light:  DRAIN_ENEMIES.light,
  medium: DRAIN_ENEMIES.medium,
  heavy:  DRAIN_ENEMIES.heavy,
};
export const HOME_RAIDERS = [
  { name:"Home Burglar",    hp:60, atk:[4,9],  combat:1, agility:2 },
  { name:"Opportunist",     hp:55, atk:[3,8],  combat:1, agility:3 },
  { name:"Essentia Thief",  hp:70, atk:[5,10], combat:2, agility:2 },
];
export const GANG_FIGHTERS = [
  { name:"Gang Enforcer", hp:85, atk:[6,12], combat:2 },
  { name:"Gang Heavy",    hp:95, atk:[8,15], combat:3 },
];
