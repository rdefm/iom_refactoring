export const WEAPONS = {
  baton:       { id:"baton",       name:"Baton",                emoji:"🏏", tag:"blunt", desc:"A standard police baton. Sturdy, reliable, leaves them winded.", dmgMultiplier:1.4, cost:40,  nonlethal:true,  ranged:false, tier:1 },
  crowbar:     { id:"crowbar",     name:"Crowbar",              emoji:"🔧", tag:"blunt", desc:"Heavy iron. Slower than a baton but hits like a freight train.",  dmgMultiplier:1.8, cost:25,  nonlethal:true,  ranged:false, tier:1 },
  knife:       { id:"knife",       name:"Knife",                emoji:"🔪", tag:"blade", desc:"A compact blade. Easy to conceal, quick to draw.",               dmgMin:4,  dmgMax:10, accuracy:95, cost:60,   armorPiercing:true, ranged:false, tier:2 },
  machete:     { id:"machete",     name:"Machete",              emoji:"⚔️",  tag:"blade", desc:"A heavy-bladed chopper. Slow but brutal.",                       dmgMin:8,  dmgMax:18, accuracy:90, cost:110,  armorPiercing:true, ranged:false, tier:2 },
  sword:       { id:"sword",       name:"Short Sword",          emoji:"🗡️",  tag:"blade", desc:"A balanced short sword. Reliable damage and reach.",             dmgMin:10, dmgMax:22, accuracy:92, cost:250,  armorPiercing:true, ranged:false, tier:3 },
  revolver:    { id:"revolver",    name:"Revolver (.38)",       emoji:"🔫", tag:"gun",   desc:"A reliable six-shooter. Low ammo, steady damage.",               dmgMin:12, dmgMax:24, accuracy:72, cost:350,  ranged:true, tier:2 },
  pistol:      { id:"pistol",      name:"Semi-Auto Pistol (9mm)",emoji:"🔫",tag:"gun",   desc:"Standard semi-automatic. Good accuracy for a handgun.",          dmgMin:14, dmgMax:26, accuracy:78, cost:480,  ranged:true, tier:2 },
  heavy_pistol:{ id:"heavy_pistol",name:"Heavy Pistol (.45)",   emoji:"🔫", tag:"gun",   desc:"Hard-hitting and slow. Each shot counts.",                       dmgMin:18, dmgMax:32, accuracy:65, cost:700,  ranged:true, tier:2 },
  smg_compact: { id:"smg_compact", name:"Compact SMG (9mm)",    emoji:"🔫", tag:"gun",   desc:"Fires in short bursts. Trades accuracy for volume.",             dmgMin:16, dmgMax:36, accuracy:55, cost:900,  ranged:true, burst:true, tier:3 },
  smg_full:    { id:"smg_full",    name:"Full-Size SMG (.45)",  emoji:"🔫", tag:"gun",   desc:"A heavy sub-machine gun. Devastating up close.",                 dmgMin:22, dmgMax:45, accuracy:48, cost:1400, ranged:true, burst:true, tier:3 },
};
export const BODY_ARMOUR = {
  vest_soft:     { id:"vest_soft",     name:"Soft Ballistic Vest",    emoji:"🛡️", desc:"A concealable soft vest. Reduces gunshot and stab damage significantly.", damageReduction:0.35, cost:400  },
  vest_hard:     { id:"vest_hard",     name:"Hard Plate Carrier",      emoji:"🛡️", desc:"Military-grade hard plates. Heavy, but stops most bullets cold.",          damageReduction:0.55, cost:950  },
  vest_tactical: { id:"vest_tactical", name:"Tactical Assault Vest",   emoji:"🛡️", desc:"Top-tier protection with ceramic inserts. The best money can buy.",        damageReduction:0.70, cost:2200 },
};
export const WEAPON_TIER = { baton:1, crowbar:1, knife:2, machete:2, revolver:2, pistol:2, heavy_pistol:2, sword:3, smg_compact:3, smg_full:3 };
export const ARMOUR_TIER  = { vest_soft:1, vest_hard:2, vest_tactical:2 };
