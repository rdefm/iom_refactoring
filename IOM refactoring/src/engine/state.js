import { ESSENTIA_TYPES, SHIFTS, RANKS, RANK_ESSENTIA_YIELD, RANK_WEIGHTS, WELL_REGEN_RATE, DAILY_LIVING_COST, FACTIONS, SIGIL_SLOTS } from '@/data/constants';
import { SIGIL_REGISTRY, SECURITY_BY_RANK } from '@/data/sigils';
import { BACKGROUNDS, STARTING_CONTACTS } from '@/data/backgrounds';
import { HOME_TIERS, BARRACKS_GUARD_TIERS, KENNEL_DOG_TIERS } from '@/data/wells_protection';
import { HOME_RAIDERS, RAIDER_SQUADS } from '@/data/enemies';
import { addLogEntry, ledgerAdd } from '@/engine/log';
import { rollAffinities, rollEssentiaLevel, weightedRank, generateSecurity, perceiveWellSecurity, hasSigilAnywhere, scanChance } from '@/engine/helpers';
import { rollContactRequests, rollNightContactRequests } from '@/engine/time';
import { rollRandomEvent } from '@/events/randomEvents';

export function defaultState(bgKey, debugConfig=null) {
  const bg = BACKGROUNDS[bgKey] || BACKGROUNDS.locator;
  const s = {
    background: bgKey, backgroundName: bg.name,
    money: bg.money, favours: bg.favours, livingCostMultiplier: 1.0,
    health:100, maxHealth:100,
    essentiaLevel: rollEssentiaLevel(),
    competencies: { ...bg.competencies },
    affinities: rollAffinities(),
    essentia: { ...bg.essentia },
    day:1, shiftIndex:0,
    wells:[],
    sigils: bg.sigils ? [...bg.sigils] : [],
    equipped: bg.equipped ? { ...bg.equipped } : { hand1:null, hand2:null, neck:null },
    activePassives:{}, knownRecipes:["light_sigil"],
    contacts: STARTING_CONTACTS.map(c=>({...c})),
    pendingContactRequests:[], activeEvent:null, completedOneShotEvents:[],
    factionRelations: FACTIONS.reduce((a,f)=>{ a[f]=0; return a; }, {}),
    ownedWeapons:[], ownedArmour:[], equippedArmour:null,
    homeTier:"flatshare", homeSecurityUpgrades:[], homeRenovations:[], pendingHomeRaid:null,
    randomEventFlags:{}, randomEventFiredToday:false, pendingRandomEvent:null,
    linfordLicence:false, linford_partner:false, linford_contract_pending:false,
    linford_suspended:false, skippedEquipmentFee:false, skippedEquipmentFeeAgain:false,
    pendingRaidAlerts:[],
    ledger:[],
    event_kaelen_exchange_01_done:false,
    barometer:{ political:50, economic:50 },
    log:[{ text:`You begin Day 1 as ${bg.name}. Good luck out there.`, type:"info", day:1, shift:"morning" }],
  };
  if(debugConfig) {
    s.background="debug"; s.backgroundName="Debug";
    s.money=debugConfig.money??s.money;
    s.favours=debugConfig.favours??s.favours;
    s.essentiaLevel=debugConfig.essentiaLevel??s.essentiaLevel;
    Object.assign(s.competencies, debugConfig.competencies||{});
    Object.assign(s.affinities,   debugConfig.affinities||{});
    Object.assign(s.essentia,     debugConfig.essentia||{});
  }
  return s;
}

export function migrateState(s) {
  if(s.essentiaLevel===undefined) s.essentiaLevel=rollEssentiaLevel();
  if(s.competencies.perception===undefined) s.competencies.perception=1;
  if(s.competencies.persuasion===undefined) s.competencies.persuasion=1;
  if(s.competencies.agility===undefined) s.competencies.agility=2;
  if(!s.sigils) s.sigils=[];
  if(!s.equipped) s.equipped={hand1:null,hand2:null,neck:null};
  if(!s.pendingRaidAlerts) s.pendingRaidAlerts=[];
  if(!s.pendingContactRequests) s.pendingContactRequests=[];
  if(s.activeEvent===undefined) s.activeEvent=null;
  if(!s.completedOneShotEvents) s.completedOneShotEvents=[];
  if(!s.contacts) s.contacts=STARTING_CONTACTS.map(c=>({...c}));
  STARTING_CONTACTS.forEach(sc=>{ if(!s.contacts.find(c=>c.id===sc.id)) s.contacts.push({...sc}); });
  s.contacts.forEach(c=>{ if(c.requestChanceModifier===undefined) c.requestChanceModifier=null; });
  // Migrate sigil format
  s.sigils=s.sigils.map((entry,i)=>{
    if(typeof entry==="string"){
      const key="sig_legacy_"+i+"_"+entry;
      SIGIL_SLOTS.forEach(sl=>{ if(s.equipped[sl]===entry) s.equipped[sl]=key; });
      return { key, id:entry, power:null };
    }
    if(entry&&!entry.key){
      const key="sig_legacy_"+i+"_"+entry.id;
      SIGIL_SLOTS.forEach(sl=>{ if(s.equipped[sl]===entry.id) s.equipped[sl]=key; });
      return { key, id:entry.id, power:entry.power??null };
    }
    return entry;
  });
  // Migrate old affinity format
  ESSENTIA_TYPES.forEach(t=>{
    const v=s.affinities[t];
    if(typeof v==="number"&&v>3){
      if(v<=5) s.affinities[t]=-2;
      else if(v<=12) s.affinities[t]=-1;
      else if(v<=19) s.affinities[t]=0;
      else if(v<=24) s.affinities[t]=1;
      else if(v<=29) s.affinities[t]=2;
      else s.affinities[t]=3;
    }
  });
  if(!s.factionRelations) s.factionRelations={};
  FACTIONS.forEach(f=>{ if(s.factionRelations[f]===undefined) s.factionRelations[f]=0; });
  if(s.equippedArmour===undefined) s.equippedArmour=null;
  if(!s.ownedWeapons) s.ownedWeapons=[];
  if(!s.ownedArmour) s.ownedArmour=[];
  if(!s.activePassives) s.activePassives={};
  if(!s.knownRecipes) s.knownRecipes=["light_sigil"];
  if(!s.randomEventFlags) s.randomEventFlags={};
  if(s.livingCostMultiplier===undefined) s.livingCostMultiplier=1.0;
  if(s.randomEventFiredToday===undefined) s.randomEventFiredToday=false;
  if(s.linford_partner===undefined) s.linford_partner=false;
  if(s.linford_contract_pending===undefined) s.linford_contract_pending=false;
  if(s.linford_suspended===undefined) s.linford_suspended=false;
  if(s.skippedEquipmentFee===undefined) s.skippedEquipmentFee=false;
  if(s.skippedEquipmentFeeAgain===undefined) s.skippedEquipmentFeeAgain=false;
  if(!s.homeTier) s.homeTier="flatshare";
  if(!s.homeSecurityUpgrades) s.homeSecurityUpgrades=[];
  if(!s.homeRenovations) s.homeRenovations=[];
  if(s.pendingHomeRaid===undefined) s.pendingHomeRaid=null;
  if(!s.ledger) s.ledger=[];
  if(s.event_kaelen_exchange_01_done===undefined) s.event_kaelen_exchange_01_done=false;
  if(!s.barometer) s.barometer={ political:50, economic:50 };
  if(!s.pendingRandomEvent) s.pendingRandomEvent=null;
  if(typeof s.shiftIndex!=="number"||s.shiftIndex<0||s.shiftIndex>=3) s.shiftIndex=0;
  // Patch wells
  s.wells.forEach(w=>{
    if(!w.security){ w.security=generateSecurity(w.rank); }
    if(w.security.tier!=="none"&&!w.security.playerOwned&&!w.security.ownerFaction){
      w.security.ownerFaction=FACTIONS[Math.floor(Math.random()*FACTIONS.length)];
    }
    if(w.currentEssentia===undefined) w.currentEssentia=RANK_ESSENTIA_YIELD[w.rank]||1;
  });
  return s;
}

export function applyDailyUpkeep(state) {
  let s = { ...state, randomEventFiredToday:false };
  // Well guard costs
  let guardCost=0;
  (s.wells||[]).forEach(w=>{ const prot=w.security.playerProtection; if(prot?.guards && prot.guards!=="guard_none") guardCost+=50; });
  // Living costs
  const staticDiscount = hasSigilAnywhere("static_sigil",s)?0.95:1.0;
  const mult = s.livingCostMultiplier||1.0;
  const livingCost = Math.round(DAILY_LIVING_COST * mult * staticDiscount);
  s = ledgerAdd(s,-livingCost,`Daily living costs`);
  s = addLogEntry(s,`Paid £${livingCost} for food and rent${mult>1?" (bills up "+Math.round((mult-1)*100)+"%)":" "}${staticDiscount<1?" (Static −5%)":""}`, s.money<0?"danger":"info");
  if(guardCost>0){
    s = ledgerAdd(s,-guardCost,"Well guard upkeep");
    s = addLogEntry(s,`Paid £${guardCost} in guard upkeep.`, s.money<0?"danger":"info");
  }
  if(s.money<0) s = addLogEntry(s,`You're in debt by £${Math.abs(s.money).toLocaleString()}. Find money fast.`,"danger");
  // Well regeneration
  const wells = s.wells.map(w=>{
    const cap=RANK_ESSENTIA_YIELD[w.rank]||1;
    const regen=Math.min(cap,+(w.currentEssentia||0)+(cap*WELL_REGEN_RATE));
    return { ...w, currentEssentia:+regen.toFixed(2) };
  });
  s = { ...s, wells };

  // ── Well raid rolls ──
  // Each player-owned well with essentia has a chance of being raided (2% base + 2% per 10 essentia stored)
  const ownedWells = s.wells.filter(w=>w.security.playerOwned && (w.currentEssentia||0)>=1);
  const existingAlertWellIds = new Set((s.pendingRaidAlerts||[]).filter(a=>!a.resolved).map(a=>a.wellId));
  let newRaidAlerts = [...(s.pendingRaidAlerts||[])];
  ownedWells.forEach(w=>{
    if(existingAlertWellIds.has(w.id)) return; // already alerted
    const tier = w.security.tier||"none";
    // Guards reduce raid chance
    const guardReduction = { none:0, light:0.03, medium:0.06, heavy:0.10 }[tier]||0;
    const essLoad = (w.currentEssentia||0);
    const raidChance = Math.max(0, 0.02 + Math.floor(essLoad/10)*0.02 - guardReduction);
    if(Math.random()<raidChance){
      const raiderPool = RAIDER_SQUADS[tier==="none"?"light":tier]||RAIDER_SQUADS.light;
      const raiderTemplate = raiderPool[Math.floor(Math.random()*raiderPool.length)];
      newRaidAlerts.push({ wellId:w.id, tier, raiderTemplate, resolved:false,
        wellDesc:`Your ${w.rank} ${w.type} Well in ${w.sector} is under attack!` });
      s = addLogEntry(s, `🚨 Raiders targeting your ${w.type} Well in ${w.sector}!`, "danger");
    }
  });
  s = { ...s, pendingRaidAlerts:newRaidAlerts };

  // ── Home raid roll ──
  // Only triggers if player has essentia stored and no raid is already pending
  if(!s.pendingHomeRaid) {
    const totalEss = ESSENTIA_TYPES.reduce((acc,t)=>acc+(s.essentia[t]||0),0);
    if(totalEss>0) {
      const tier = HOME_TIERS?.[s.homeTier];
      const upgrades = s.homeSecurityUpgrades||[];
      const hwRed = tier?(tier.securityUpgrades||[]).filter(u=>upgrades.includes(u.id)).reduce((acc,u)=>acc+(u.raidReduction||0),0):0;
      const renos = s.homeRenovations||[];
      const grdRed = renos.filter(r=>r.type==="barracks"&&r.guardTier&&r.guardTier!=="none").reduce((acc,r)=>{ const gt=BARRACKS_GUARD_TIERS?.find(t=>t.id===r.guardTier); return acc+(gt?.raidReduction||0); },0);
      const kenRed = renos.filter(r=>r.type==="kennel"&&r.dogTier&&r.dogTier!=="none").reduce((acc,r)=>{ const dt=KENNEL_DOG_TIERS?.find(t=>t.id===r.dogTier); return acc+(dt?.raidReduction||0); },0);
      const baseRaid = 0.02+Math.floor(totalEss/10)*0.02;
      const effRaid = Math.max(0,baseRaid-hwRed-grdRed-kenRed);
      if(Math.random()<effRaid){
        const raider = HOME_RAIDERS[Math.floor(Math.random()*HOME_RAIDERS.length)];
        s = { ...s, pendingHomeRaid:{ raiderTemplate:raider } };
        s = addLogEntry(s, "🚨 Someone has broken into your home!", "danger");
      }
    }
  }

  return s;
}

export function rollScanResult(state, sector) {
  const chance=scanChance(state.competencies.sensing||0);
  const roll=Math.floor(Math.random()*100)+1;
  if(roll>chance) return { success:false, roll, chance };
  const type=ESSENTIA_TYPES[Math.floor(Math.random()*ESSENTIA_TYPES.length)];
  const rank=weightedRank();
  const security=generateSecurity(rank);
  const perceived=perceiveWellSecurity(security, state.competencies.perception||0);
  const well={
    id:"well_"+Date.now()+"_"+Math.floor(Math.random()*1000),
    sector, type, rank, security,
    perceivedTier:perceived.tier, perceivedGuards:perceived.guards, perceivedDesc:perceived.desc,
    currentEssentia:RANK_ESSENTIA_YIELD[rank]||1,
  };
  return { success:true, well, roll, chance };
}

/* ── applyEventEffects — applies structured side-effects from event state onEnterEffect ── */
export function applyEventEffects(state, effects) {
  if(!effects) return state;
  let s = { ...state };
  if(effects.money !== undefined) s = { ...s, money: effects.money };
  if(effects.health !== undefined) s = { ...s, health: Math.max(0, Math.min(s.maxHealth, effects.health)) };
  if(effects.essentia) s = { ...s, essentia: effects.essentia };
  if(effects.contactUpdate) {
    const { contactId, changes } = effects.contactUpdate;
    s = { ...s, contacts: s.contacts.map(c => c.id===contactId?{...c,...changes}:c) };
  }
  if(effects.logEntry) s = addLogEntry(s, effects.logEntry.text, effects.logEntry.type||"info");
  return s;
}
