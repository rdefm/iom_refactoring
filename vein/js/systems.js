// ============================================================
// SYSTEMS
// ============================================================

// === UTILITY ===
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFrom(arr)  { return arr[Math.floor(Math.random() * arr.length)]; }
function totalOre(inv)  { return Object.values(inv).reduce((s,v) => s + (Number(v)||0), 0); }
let _veinId = 1;
function makeVeinId()   { return 'v' + (_veinId++); }

// === START SYSTEM ===
function startTutorial() {
  gameState.currentScreen = 'intro';
  renderGame();
}
function startDebug() {
  const p = gameState.player;
  p.cash = 1000000; p.hp = 150; p.hpMax = 150; p.attackMin = 10; p.attackMax = 22;
  p.inventory.timePearl = 5; p.inventory.rewind = 3; p.craftingSkill = 3; p.craftingXP = 100;
  p.items = [{ id:'crowbar_1', type:'crowbar' }];
  ORE_TYPE_KEYS.forEach(k => { p.orichalchum[k] = 20; });
  [['time',3],['energy',1],['life',5]].forEach(([type,level]) => {
    p.veins.push({ id:makeVeinId(), oreType:type, level, levelLabel:VEIN_LEVELS[level].label,
      charged:true, chargeBlocks:VEIN_LEVELS[level].rechargeBlocks, claimed:true, npcClaimed:false,
      security:'basic', guards:0, guardTemplate:null, location:generateLocationName() });
  });
  const f = gameState.flags;
  f.tutorialStage='free'; f.metArchie=f.hasDetector=f.hasHarvester=f.metJames=f.hasTimePearls=true;
  f.buyerEventSeen=f.craftingUnlocked=f.jamesCraftEventSeen=f.archieCraftChatSeen=f.canSellConsumables=true;
  f.archieMotionEventSeen=f.jamesMotionEventSeen=f.motionPowderUnlocked=true; f.consSoldCount=5;
  f.archiePartnerSeen=f.homeUnlocked=f.securityContactUnlocked=true;
  // homeRaidEventSeen intentionally NOT set — set pending so event triggers on home screen
  gameState.flags.homeRaidEventPending = true;
  gameState.player.inventory.motionPowder=3;
  gameState.contacts.james.unlocked = true;
  gameState.contacts.archie.relation = 60;
  gameState.contacts.james.relation  = 40;
  gameState.contacts.archie.recruited = true;
  gameState.contacts.james.recruited  = true;
  gameState.contacts.archie.craftingSkill = 1; gameState.contacts.archie.craftingXP = 0;
  gameState.contacts.archie.cultivatingSkill = 2; gameState.contacts.archie.cultivatingXP = 0;
  gameState.contacts.james.craftingSkill  = 3; gameState.contacts.james.craftingXP  = 0;
  gameState.contacts.james.cultivatingSkill  = 1; gameState.contacts.james.cultivatingXP  = 0;
  gameState.contacts.archie.assignedRoom = null;
  gameState.contacts.james.assignedRoom  = null;
  gameState.labThresholds    = {};
  gameState.veinStationVeins = [];
  gameState.craftSection     = null;
  gameState.player.devicesInProgress = [];
  gameState.player.devicesCompleted  = [];
  gameState.player.equipment.device  = null;
  // Debug home setup
  gameState.home.tier = 'compound';
  gameState.home.security = ['lock','cameras'];
  gameState.home.rooms = ['workshop','homeGym','lab','veinStation'];
  gameState.home.storedOre = { time:10, energy:5 };
  // Debug faction relations
  gameState.factions.collective.relation = 25;
  gameState.factions.firm.relation = 15;
  gameState.factions.guild.relation = 42;
  gameState.factions.guild.joined = true;
  // Debug barometer
  gameState.barometer.economic  = 'boom';
  gameState.barometer.social    = 'stable';
  gameState.barometer.political = 'war';
  gameState.barometer.lastShift = { economic:1, social:1, political:1 };
  initBarometerProgress();
  gameState.currentScreen = 'home';
  renderGame();
}

// === TIME SYSTEM ===
function advanceTimeBlock() {
  const b = gameState.world;
  b.timeBlocksDone.push(b.timeBlock);
  b.blocksSinceReset++;
  b.timeBlock++;
  if (b.timeBlock >= TIME_BLOCKS.length) { b.day++; b.timeBlock=0; b.timeBlocksDone=[]; dailyTick(); }
}
function isTimeExhausted() { return gameState.world.timeBlocksDone.length >= TIME_BLOCKS.length; }

// === RECHARGE SYSTEM ===
// === COLLAPSIBLE STATS ===
function toggleStats() {
  gameState.statsOpen = !gameState.statsOpen;
  renderGame();
}

// === TODO LIST SYSTEM ===
function getTodoItems() {
  const f   = gameState.flags;
  const day = gameState.world.day;
  const items = [];

  items.push({
    done: f.metArchie,
    text: `Get back to Archie. He’s sorting the new buyer.`
  });

  if (f.metArchie) items.push({
    done: f.buyerEventSeen,
    text: day < 2
      ? `Wait for Archie’s text — he’s lining up the buyer.`
      : `Back up Archie on the sale tonight. Check Contacts.`
  });

  if (f.buyerEventSeen) items.push({
    done: f.metJames,
    text: `Archie mentioned a contact called James. SMS him to set it up.`
  });

  if (f.metJames) items.push({
    done: f.jamesCraftEventSeen,
    text: `Go back to James when he’s ready. He’ll teach you the basics.`
  });

  if (f.jamesCraftEventSeen) items.push({
    done: f.archieCraftChatSeen,
    text: `Catch up with Archie about what James taught you.`
  });

  if (f.archieCraftChatSeen) items.push({
    done: f.homeRaidEventSeen,
    text: `You have calc now. The flat isn’t as secure as you thought.`
  });

  if (f.archiePartnerSeen) items.push({
    done: false,
    text: `Archie’s time vein is yours. Cultivate it. Harvest. Make pearls. Archie sells them.`
  });

  return items.slice(-4);
}

// === REST SYSTEM ===
function doRest() {
  // Advance through remaining time blocks for the day, then to next morning
  const b = gameState.world;
  const blocksLeft = TIME_BLOCKS.length - b.timeBlocksDone.length;
  if (blocksLeft > 0) {
    // Use all remaining blocks
    for (let i = 0; i < blocksLeft; i++) {
      b.timeBlocksDone.push(b.timeBlock);
      b.blocksSinceReset++;
      b.timeBlock++;
    }
  }
  // Tick over to next day
  b.day++;
  b.timeBlock = 0;
  b.timeBlocksDone = [];
  dailyTick();
  // Heal player — rest recovers 20% of max HP
  const healAmount = Math.round(gameState.player.hpMax * 0.2);
  gameState.player.hp = Math.min(gameState.player.hpMax, gameState.player.hp + healAmount);
  if (healAmount > 0 && gameState.player.hp < gameState.player.hpMax + healAmount) {
    pushNotification(`Rested. Day ${gameState.world.day}. +${healAmount} HP.`);
  }
  renderGame();
}

// === BAROMETER SYSTEM ===
function getBarometerEffects() {
  // Merge all active state effects
  const merged = {};
  ['economic','social','political'].forEach(section => {
    const state = gameState.barometer[section];
    const effects = BAROMETER_STATES[section][state]?.effects || {};
    Object.entries(effects).forEach(([k,v]) => { merged[k] = (merged[k]||0) + v; });
  });
  return merged;
}

function getEffectiveMugChance(base) {
  const fx = getBarometerEffects();
  return Math.max(0, Math.min(0.8, base + (fx.mugChance||0)));
}

function getEffectiveOrePrice(type, base) {
  const fx = getBarometerEffects();
  let mult = 1 + (fx.orePrice||0);
  if (type==='void'   && fx.voidPremium)    mult += fx.voidPremium;
  if (type==='time'   && fx.timePremium)    mult += fx.timePremium;
  if (type==='energy' && fx.energyPremium)  mult += fx.energyPremium;
  if (type==='motion' && fx.motionPremium)  mult += fx.motionPremium;
  return Math.round(base * Math.max(0.1, mult));
}



// === BAROMETER SYSTEM ===
function initBarometerProgress() {
  const bp = {}; const bc = {};
  ['economic','social','political'].forEach(sec => {
    bp[sec] = {}; bc[sec] = {};
    Object.keys(BAROMETER_STATES[sec]).forEach(sid => {
      bp[sec][sid] = sid === gameState.barometer[sec] ? 100 : 0;
      bc[sec][sid] = { push:0, pull:0 };
    });
  });
  gameState.barometerProgress  = bp;
  gameState.barometerCooldowns = bc;
}
function ensureBarometerInit() {
  if (!gameState.barometerProgress) initBarometerProgress();
}
function resolveBarometerSection(sec) {
  const bp = gameState.barometerProgress[sec];
  const active = gameState.barometer[sec];
  // Clamp all first
  Object.keys(bp).forEach(id => { bp[id] = Math.max(0, Math.min(100, bp[id])); });
  // Any non-active state hitting 100 triggers transition
  const winner = Object.keys(bp).find(id => id !== active && bp[id] >= 100);
  if (winner) {
    bp[active] = 0;
    gameState.barometer[sec] = winner;
    bp[winner] = 100;
    const newState = BAROMETER_STATES[sec][winner];
    pushNotification(`${sec.charAt(0).toUpperCase()+sec.slice(1)} shift: ${newState.label}. ${newState.description}`);
  }
}
function tickFactionBarometerNudges() {
  ensureBarometerInit();
  Object.entries(FACTION_BAROMETER_PREFS).forEach(([,prefs]) => {
    prefs.forEach(p => {
      const bp = gameState.barometerProgress[p.section];
      if (!bp) return;
      if (p.direction === 'push') bp[p.state] = Math.min(100, (bp[p.state]||0) + p.strength);
      else                        bp[p.state] = Math.max(0,   (bp[p.state]||0) - p.strength);
    });
  });
  ['economic','social','political'].forEach(resolveBarometerSection);
}
function tickBarometer(day) {
  ensureBarometerInit();
  tickFactionBarometerNudges();
  // Slow organic drift: 20% chance per non-active state of +1 per day
  ['economic','social','political'].forEach(sec => {
    const active = gameState.barometer[sec];
    Object.keys(BAROMETER_STATES[sec]).forEach(sid => {
      if (sid === active) return;
      if (Math.random() < 0.20) gameState.barometerProgress[sec][sid] = Math.min(99, (gameState.barometerProgress[sec][sid]||0)+1);
    });
    resolveBarometerSection(sec);
  });
  gameState.barometer.lastShift = gameState.barometer.lastShift || { economic:0, social:0, political:0 };
}
function pushBarometerState(section, stateId) {
  ensureBarometerInit();
  const day = gameState.world.day;
  const cd  = gameState.barometerCooldowns[section][stateId];
  if (gameState.player.cash < 2000 || day <= cd.push) return;
  gameState.player.cash -= 2000;
  cd.push = day;
  gameState.barometerProgress[section][stateId] = Math.min(100,(gameState.barometerProgress[section][stateId]||0)+20);
  resolveBarometerSection(section);
  renderGame();
}
function pullBarometerState(section, stateId) {
  ensureBarometerInit();
  const day = gameState.world.day;
  const cd  = gameState.barometerCooldowns[section][stateId];
  if (gameState.player.cash < 2000 || day <= cd.pull) return;
  gameState.player.cash -= 2000;
  cd.pull = day;
  gameState.barometerProgress[section][stateId] = Math.max(0,(gameState.barometerProgress[section][stateId]||0)-20);
  renderGame();
}

// === HOME SYSTEM ===
function getHomeTier()   { return HOME_TIERS[gameState.home.tier]; }
function getNextTier()   { const tiers=Object.keys(HOME_TIERS); const i=tiers.indexOf(gameState.home.tier); return tiers[i+1]?HOME_TIERS[tiers[i+1]]:null; }
function getHomeRaidChance() {
  const tier = getHomeTier();
  const fx   = getBarometerEffects();
  let chance = tier.raidBaseChance + (fx.homeRaid||0);
  // Security reduces chance
  gameState.home.security.forEach(sid => { chance -= HOME_SECURITY[sid]?.raidReduction||0; });
  // More ore = more attractive
  const stored = Object.values(gameState.home.storedOre||{}).reduce((s,v)=>s+v,0);
  chance += stored * 0.001;
  return Math.max(0.002, chance);
}
function upgradeHome() {
  const next = getNextTier();
  if (!next || gameState.player.cash < next.upgradeCost) return;
  gameState.player.cash -= next.upgradeCost;
  gameState.home.tier = next.id;
  closeModal(); renderGame();
}
function addHomeSecurity(sid) {
  if (gameState.home.security.includes(sid)) return;
  const sec = HOME_SECURITY[sid];
  if (!sec || gameState.player.cash < sec.cost) return;
  const tier = getHomeTier();
  if (gameState.home.security.length >= tier.maxSecuritySlots) return;
  gameState.player.cash -= sec.cost;
  gameState.home.security.push(sid);
  closeModal(); renderGame();
}
function addHomeRoom(rid) {
  if (gameState.home.rooms.includes(rid)) return;
  const room = HOME_ROOMS[rid];
  if (!room) return;
  const tier = getHomeTier();
  const tierOrder = Object.keys(HOME_TIERS);
  if (tierOrder.indexOf(tier.id) < tierOrder.indexOf(room.minTier)) return;
  if (gameState.home.rooms.length >= tier.maxRooms) return;
  if (gameState.player.cash < room.cost) return;
  gameState.player.cash -= room.cost;
  gameState.home.rooms.push(rid);
  // Apply stat bonuses immediately
  if (room.bonus === 'body') {
    gameState.player.hpMax += room.bonusValue;
    gameState.player.hp    = Math.min(gameState.player.hp + room.bonusValue, gameState.player.hpMax);
  }
  closeModal(); renderGame();
}
function rollHomeRaid(day) {
  if (day - (gameState.home.lastRaidDay||0) < 3) return; // minimum 3 days between raids
  const chance = getHomeRaidChance();
  if (Math.random() > chance) return;
  gameState.home.lastRaidDay = day;
  const stored = gameState.home.storedOre||{};
  const total  = Object.values(stored).reduce((s,v)=>s+v,0);
  if (total === 0) return;
  // Safe room halves loss
  const hasSafeRoom = gameState.home.rooms.includes('safeRoom');
  const lossRatio   = hasSafeRoom ? 0.25 : 0.50;
  let lost = 0;
  Object.keys(stored).forEach(k => {
    const take = Math.floor((stored[k]||0) * lossRatio);
    stored[k] -= take; lost += take;
  });
  if (lost > 0) pushNotification(`Your home was raided overnight. ${lost} units of stored ore taken.`);
}

// === FACTION SYSTEM ===
function getFactionRelation(fid) { return gameState.factions[fid]?.relation||0; }
function canJoinFaction(fid)     { return getFactionRelation(fid) >= FACTIONS[fid].joinRelation && !gameState.factions[fid]?.joined; }
function joinFaction(fid) {
  if (!canJoinFaction(fid)) return;
  gameState.factions[fid].joined = true;
  pushNotification(`You've joined ${FACTIONS[fid].name}.`);
  closeModal(); renderGame();
}
function getWorkshopBonus() {
  // Sum crafting bonuses from rooms
  let bonus = 0;
  gameState.home.rooms.forEach(rid => {
    const r = HOME_ROOMS[rid];
    if (r && r.bonus === 'crafting') bonus += r.bonusValue;
  });
  return bonus;
}

// === DAILY TICK (recharge + lifespan + living costs) ===
function dailyTick() {
  const day = gameState.world.day;
  tickBarometer(day);
  rollHomeRaid(day);
  const fx = getBarometerEffects();
  const DAILY_COST = Math.round(50 * (1 + (fx.dailyCost||0)));
  gameState.player.cash = Math.max(0, gameState.player.cash - DAILY_COST);
  pushNotification('Day ' + day + ': -£' + DAILY_COST + ' living costs.' + (gameState.player.cash === 0 ? ' You are flat broke.' : ''));
  const expired = [];
  gameState.player.veins = gameState.player.veins.filter(v => {
    const ld = VEIN_LEVELS[v.level];
    if (v.chargeBlocks < ld.rechargeBlocks) v.chargeBlocks++;
    if (v.chargeBlocks >= ld.rechargeBlocks) v.charged = true;
    const age = day - (v.claimedOnDay || day);
    if (age >= ld.lifespanDays) { expired.push(v); return false; }
    return true;
  });
  // Day 2: trigger buyer event (Archie texts in the morning)
  if (gameState.flags.tutorialStage === 'buyer_event' && !gameState.flags.buyerEventSeen && day >= 2) {
    pushNotification('Archie texted. He\'s lined up the new buyer. Check Contacts.');
  }
  // Unlock archie craft chat one day after craft event
  if (gameState.flags.tutorialStage === 'archie_craft_chat' &&
      gameState.world._archieChatUnlockDay &&
      day >= gameState.world._archieChatUnlockDay) {
    pushNotification('Archie wants to meet up. Check Contacts.');
  }
  expired.forEach(v => {
    const ore = ORE_TYPES[v.oreType];
    pushNotification('Your ' + ore.name + ' vein on ' + v.location.split(',')[0] + ' has dried up and disappeared.');
  });
  // Process rooms
  if (gameState.home.rooms.includes('lab'))        processLab();
  if (gameState.home.rooms.includes('veinStation')) processVeinStation();
  // Reset device charges
  resetDeviceCharges();
}
function pushNotification(text) {
  gameState.notifications.push({ id: Date.now() + Math.random(), text });
}
function dismissNotification(id) {
  gameState.notifications = gameState.notifications.filter(n => n.id !== id);
  renderGame();
}

// === LOCATION GENERATOR (used by seeding) ===
function generateLocationName() {
  const s = ['Brick Lane','Bethnal Green Rd','Commercial St','Whitechapel High St','Mile End Rd','Roman Rd','Hackney Rd','Cambridge Heath Rd','Vallance Rd'];
  const x = ['near the off-licence','behind the Tesco Metro','under the railway arch','in the car park','by the bus stop','beside the bookies'];
  return `${randFrom(s)}, ${randFrom(x)}`;
}

// === CLAIM SYSTEM ===
function claimVein(vein) {
  vein.claimed = true;
  vein.npcClaimed = false;
  vein.claimedOnDay = gameState.world.day;
  if (vein.devBar === undefined) vein.devBar = 0;
  gameState.player.veins.push(vein);
  renderGame();
}

// === SECURITY SYSTEM ===
function upgradeVeinSecurity(veinId, tierId) {
  const vein = gameState.player.veins.find(v => v.id === veinId);
  const tier = SECURITY_TIERS.find(t => t.id === tierId);
  if (!vein || !tier || gameState.player.cash < tier.cost) return;
  gameState.player.cash -= tier.cost;
  vein.security = tierId;
  closeModal();
  renderGame();
}

// === CULTIVATING SYSTEM ===

function getCultivatingSuccessChance() {
  const sk = gameState.player.cultivatingSkill;
  return Math.min(0.90, 0.30 + (sk - 1) * 0.12);
}

function getCultivatingBarGain() {
  const sk = gameState.player.cultivatingSkill;
  return 1 + sk;
}

function awardCultivatingXP(amount) {
  const p = gameState.player;
  p.cultivatingXP = (p.cultivatingXP || 0) + amount;
  const maxLevel = CULTIVATING_XP_LEVELS.length - 1;
  while (p.cultivatingSkill < maxLevel && p.cultivatingXP >= CULTIVATING_XP_LEVELS[p.cultivatingSkill + 1]) {
    p.cultivatingSkill++;
    pushNotification(`Cultivating skill up — now level ${p.cultivatingSkill}.`);
  }
}

function attemptSeed(oreType) {
  const have = gameState.player.orichalchum[oreType] || 0;
  if (have < SEED_ORE_COST || isTimeExhausted()) return;
  advanceTimeBlock();
  gameState.player.orichalchum[oreType] = have - SEED_ORE_COST;
  const success = Math.random() < getCultivatingSuccessChance();
  if (success) {
    const ld = VEIN_LEVELS[1];
    const newVein = {
      id: makeVeinId(), oreType, level: 1, levelLabel: ld.label,
      devBar: getCultivatingBarGain(),
      charged: false, chargeBlocks: 0,
      claimed: true, npcClaimed: false,
      security: 'none', guards: 0, guardTemplate: null,
      location: generateLocationName(), claimedOnDay: gameState.world.day,
    };
    gameState.player.veins.push(newVein);
    awardCultivatingXP(30);
    openModal('seed_result', { success: true, oreType, veinId: newVein.id });
  } else {
    awardCultivatingXP(5);
    openModal('seed_result', { success: false, oreType });
  }
  renderGame();
}

function attemptCultivate(veinId) {
  if (isTimeExhausted()) return;
  const vein = gameState.player.veins.find(v => v.id === veinId);
  if (!vein) return;
  advanceTimeBlock();
  const success = Math.random() < getCultivatingSuccessChance();
  if (success) {
    const gain    = getCultivatingBarGain();
    const ld      = VEIN_LEVELS[vein.level];
    const prevBar = vein.devBar || 0;
    vein.devBar   = prevBar + gain;
    awardCultivatingXP(20);
    const levelledUp = vein.level < 5 && vein.devBar >= ld.devBarMax;
    if (levelledUp) levelUpVein(vein);
    openModal('cultivate_result', {
      success: true, gain, veinId, levelledUp,
      newLevel: vein.level, newLabel: vein.levelLabel,
    });
  } else {
    awardCultivatingXP(8);  // partial XP for failed attempt
    openModal('cultivate_result', { success: false, veinId });
  }
  renderGame();
}

function levelUpVein(vein) {
  if (vein.level >= 5) return;
  vein.level++;
  vein.levelLabel = VEIN_LEVELS[vein.level].label;
  vein.devBar = 0;
}

function levelDownVein(vein) {
  if (vein.level <= 1) {
    const ore = ORE_TYPES[vein.oreType];
    gameState.player.veins = gameState.player.veins.filter(v => v.id !== vein.id);
    pushNotification(`Your ${ore.name} vein on ${vein.location.split(',')[0]} collapsed and disappeared.`);
  } else {
    vein.level--;
    vein.levelLabel = VEIN_LEVELS[vein.level].label;
    vein.devBar = Math.floor(VEIN_LEVELS[vein.level].devBarMax * 0.8);
    pushNotification(`A vein on ${vein.location.split(',')[0]} dropped to level ${vein.level}.`);
  }
}

// === HARVEST SYSTEM ===

function harvestVeinCautious(veinId) {
  if (isTimeExhausted()) return;
  const vein = gameState.player.veins.find(v => v.id === veinId);
  if (!vein || !vein.charged) return;
  advanceTimeBlock();
  const ld = VEIN_LEVELS[vein.level];
  const amount = rand(ld.yieldCautious[0], ld.yieldCautious[1]);
  gameState.player.orichalchum[vein.oreType] = (gameState.player.orichalchum[vein.oreType] || 0) + amount;
  vein.charged = false;
  vein.chargeBlocks = 0;
  checkOreGoal();
  closeModal();
  renderGame();
}

function harvestVeinFull(veinId) {
  if (isTimeExhausted()) return;
  const vein = gameState.player.veins.find(v => v.id === veinId);
  if (!vein || !vein.charged) return;
  advanceTimeBlock();
  const ld = VEIN_LEVELS[vein.level];
  const amount = rand(ld.yieldFull[0], ld.yieldFull[1]);
  gameState.player.orichalchum[vein.oreType] = (gameState.player.orichalchum[vein.oreType] || 0) + amount;
  vein.charged = false;
  vein.chargeBlocks = 0;
  vein.devBar = (vein.devBar || 0) - ld.devBarHarvestCost;
  if (vein.devBar <= 0) levelDownVein(vein);
  checkOreGoal();
  closeModal();
  renderGame();
}

// === TUTORIAL GATE ===
function checkOreGoal() {
  // Home raid trigger: fires after archieCraftChatSeen (Archie gave the player calc)
  const f = gameState.flags;
  if (f.archieCraftChatSeen && !f.homeRaidEventPending && !f.homeRaidEventSeen) {
    f.homeRaidEventPending = true;
  }
}

// === CRAFTING SYSTEM ===
function getCraftingSuccessChance(recipeKey) {
  const r = RECIPES[recipeKey]; const sk = gameState.player.craftingSkill;
  return Math.min(0.95, r.baseSuccess + (sk - 1) * 0.13 + getWorkshopBonus());
}
function getCraftingCalcCost(recipeKey) {
  const r = RECIPES[recipeKey]; const sk = gameState.player.craftingSkill;
  return Math.max(1, Math.round(r.baseCalcCost - (sk - 1) * 0.8));
}
function getCraftingEffectPower(recipeKey) {
  const r = RECIPES[recipeKey]; const sk = gameState.player.craftingSkill;
  return r.effectPower[sk] || 1;
}
function canCraft(recipeKey) {
  const r = RECIPES[recipeKey]; const cost = getCraftingCalcCost(recipeKey);
  return r.ingredients.every(ing => (gameState.player.orichalchum[ing.type]||0) >= cost);
}
function attemptCraft(recipeKey) {
  if (!canCraft(recipeKey)) return;
  const r = RECIPES[recipeKey]; const cost = getCraftingCalcCost(recipeKey);
  // Deduct calc regardless of outcome
  r.ingredients.forEach(ing => { gameState.player.orichalchum[ing.type] = Math.max(0,(gameState.player.orichalchum[ing.type]||0)-cost); });
  const success = Math.random() < getCraftingSuccessChance(recipeKey);
  if (success) {
    const power = getCraftingEffectPower(recipeKey);
    if (recipeKey === 'timePearl')    gameState.player.inventory.timePearl++;
    if (recipeKey === 'motionPowder') gameState.player.inventory.motionPowder = (gameState.player.inventory.motionPowder||0) + 1;
    if (recipeKey === 'rewind')       gameState.player.inventory.rewind       = (gameState.player.inventory.rewind||0) + 1;
    awardCraftingXP(r.xpReward);
    openModal('craft_result', { recipeKey, success:true, power });
  } else {
    awardCraftingXP(Math.floor(r.xpReward / 3)); // partial XP for failed attempt
    openModal('craft_result', { recipeKey, success:false, power:0 });
  }
  renderGame();
}
function awardCraftingXP(amount) {
  const p = gameState.player;
  p.craftingXP += amount;
  const maxLevel = CRAFTING_XP_LEVELS.length - 1;
  while (p.craftingSkill < maxLevel && p.craftingXP >= CRAFTING_XP_LEVELS[p.craftingSkill + 1]) {
    p.craftingSkill++;
  }
}

// === DEVICE SYSTEM ===
function getDeviceCalcCost(deviceType) {
  const dt = DEVICE_TYPES[deviceType];
  return getCraftingCalcCost(dt.recipeKey) * 2;
}
function canBuildDevice(deviceType) {
  const dt = DEVICE_TYPES[deviceType];
  const cost = getDeviceCalcCost(deviceType);
  return (gameState.player.orichalchum[dt.calcType]||0) >= cost;
}
function startDevice(deviceType) {
  if (!DEVICE_TYPES[deviceType]) return;
  gameState.player.devicesInProgress.push({ id:'dev_'+Date.now(), type:deviceType, progress:10 });
  renderGame();
}
function attemptDeviceBuild(deviceId) {
  const p      = gameState.player;
  const device = p.devicesInProgress.find(d => d.id === deviceId);
  if (!device) return;
  const dt   = DEVICE_TYPES[device.type];
  const cost = getDeviceCalcCost(device.type);
  if ((p.orichalchum[dt.calcType]||0) < cost) return;
  p.orichalchum[dt.calcType] -= cost;
  awardCraftingXP(Math.floor(RECIPES[dt.recipeKey].xpReward / 2));
  const success = Math.random() < getCraftingSuccessChance(dt.recipeKey);
  if (success) {
    device.progress = Math.min(100, device.progress + 5);
    if (device.progress >= 100) { completeDevice(device); return; }
  } else {
    device.progress = Math.max(0, device.progress - 2.5);
    if (device.progress <= 0) { breakDevice(deviceId); return; }
  }
  renderGame();
}
function completeDevice(device) {
  const p = gameState.player;
  p.devicesInProgress = p.devicesInProgress.filter(d => d.id !== device.id);
  p.devicesCompleted.push({ id:device.id, type:device.type, level:1, xp:0, chargesPerDay:1, chargesUsedToday:0, lastResetDay:gameState.world.day });
  const dt = DEVICE_TYPES[device.type];
  pushNotification(`${dt.name} complete. Check your equipment.`);
  renderGame();
}
function breakDevice(deviceId) {
  gameState.player.devicesInProgress = gameState.player.devicesInProgress.filter(d => d.id !== deviceId);
  pushNotification(`Device collapsed. The calc dispersed. You'll need to start again.`);
  renderGame();
}
function abandonDevice(deviceId) {
  gameState.player.devicesInProgress = gameState.player.devicesInProgress.filter(d => d.id !== deviceId);
  renderGame();
}
function equipDevice(deviceId) {
  gameState.player.equipment.device = deviceId;
  renderGame();
}
function unequipDevice() {
  gameState.player.equipment.device = null;
  renderGame();
}
function getDeviceChargesLeft(device) {
  return Math.max(0, device.chargesPerDay - (device.chargesUsedToday||0));
}
function resetDeviceCharges() {
  const day = gameState.world.day;
  (gameState.player.devicesCompleted||[]).forEach(d => {
    if ((d.lastResetDay||0) < day) { d.chargesUsedToday = 0; d.lastResetDay = day; }
  });
}
function awardDeviceXP(device, amount) {
  device.xp = (device.xp||0) + amount;
  const max = DEVICE_XP_LEVELS.length - 1;
  const dt  = DEVICE_TYPES[device.type];
  while (device.level < max && device.xp >= DEVICE_XP_LEVELS[device.level + 1]) {
    device.level++;
    device.chargesPerDay++;
    pushNotification(`${dt.name} levelled up — now ${device.chargesPerDay} charges per day.`);
  }
}
function combatUseDevice() {
  const p        = gameState.player;
  const deviceId = p.equipment.device;
  if (!deviceId) return;
  const device = p.devicesCompleted.find(d => d.id === deviceId);
  if (!device || getDeviceChargesLeft(device) <= 0) return;
  device.chargesUsedToday = (device.chargesUsedToday||0) + 1;
  awardDeviceXP(device, 10);
  const dt = DEVICE_TYPES[device.type];
  if (dt.effect === 'freeze') {
    const power = RECIPES['timePearl'].effectPower[p.craftingSkill] || 1;
    gameState.combat.frozenTurns += power;
    gameState.combat.log.push(`You activate the ${dt.name}. Enemy frozen for ${power} turn${power>1?'s':''}.`);
  } else if (dt.effect === 'motion') {
    const power = RECIPES['motionPowder'].effectPower[p.craftingSkill] || 1;
    gameState.combat.motionTurns += 2;
    gameState.combat.motionPower  = power;
    gameState.combat.log.push(`You activate the ${dt.name}. Movement accelerated.`);
  }
  closeModal();
  renderGame();
}

// === SMS SYSTEM ===
function sendSms1() {
  if (gameState.smsSentFirst) return;
  gameState.smsSentFirst = true; gameState.smsStep = 1;
  setTimeout(() => { gameState.smsStep = 2; setTimeout(() => { gameState.smsStep = 3; renderGame(); }, 900); renderGame(); }, 600);
  renderGame();
}
function completeSms1() {
  gameState.flags.tutorialStage = 'meet_james';
  gameState.currentScreen = 'event_james'; gameState.jamesStep = 0; renderGame();
}
function sendSms2() {
  if (gameState.smsSent2First) return;
  gameState.smsSent2First = true; gameState.smsStep2 = 1;
  const delays = [600, 1200, 1800, 2400];
  delays.forEach((d,i) => setTimeout(() => { gameState.smsStep2 = i+2; renderGame(); }, d));
  renderGame();
}
function completeSms2() {
  gameState.currentScreen = 'event_buyer'; gameState.buyerStep = 0; renderGame();
}

// === JAMES EVENT ===
function advanceJames() {
  if (gameState.jamesStep < JAMES_CARDS.length) {
    gameState.jamesStep++;
    renderGame();

  }
}
function completeJames() {
  gameState.player.inventory.timePearl += 2; // kept from helping with the order
  gameState.flags.metJames            = true;
  gameState.flags.hasTimePearls       = true;
  gameState.flags.craftingUnlocked    = true;
  gameState.flags.jamesCraftEventSeen = true;
  gameState.contacts.james.unlocked   = true;
  awardRelation('james', 10);
  gameState.flags.tutorialStage        = 'archie_craft_chat';
  gameState.world._archieChatUnlockDay = gameState.world.day + 1;
  pushNotification('Crafting unlocked. Try the Craft tab.');
  gameState.currentScreen = 'crafting'; renderGame();
}

// === BUYER EVENT ===
function advanceBuyer() {
  if (gameState.buyerStep < BUYER_CARDS.length) {
    gameState.buyerStep++;
    renderGame();

  }
}
function completeBuyer() {
  gameState.player.cash += 40;
  gameState.flags.buyerEventSeen = true;
  gameState.flags.tutorialStage  = 'sms_archie'; // Next: SMS Archie to meet James
  gameState.currentScreen = 'home'; renderGame();
}

// === JAMES CRAFT EVENT ===
function advanceJamesCraft() {
  if (gameState.jamesCraftStep < JAMES_CRAFT_CARDS.length) {
    gameState.jamesCraftStep++;
    renderGame();

  }
}
function completeJamesCraft() {
  gameState.flags.craftingUnlocked    = true;
  gameState.flags.jamesCraftEventSeen = true;
  gameState.flags.tutorialStage       = 'archie_craft_chat';
  gameState.world._archieChatUnlockDay = gameState.world.day + 1;
  gameState.currentScreen = 'crafting'; renderGame();
}

// === HOME RAID EVENT SYSTEM ===
let homeRaidIntroStep = 0;
let homeRaidDebriefStep = 0;

function startHomeRaidEvent() {
  gameState.flags.homeRaidEventPending = false;
  homeRaidIntroStep = 0;
  gameState.currentScreen = 'event_home_raid_intro';
  renderGame();
}

function advanceHomeRaidIntro() {
  if (homeRaidIntroStep < HOME_RAID_INTRO_CARDS.length) {
    homeRaidIntroStep++;
    renderGame();
    setTimeout(() => { const a = document.querySelector('.event-card-area'); if(a) a.scrollTop = a.scrollHeight; }, 80);
  }
}

function beginHomeRaidCombat() {
  // 1 raider — fixed stats, challenging but beatable
  const enemy = {
    name:      'A raider',
    hp:        35,
    hpMax:     35,
    attackMin: 6,
    attackMax: 14,
    veinRef:   null,
    isMugging: false,
  };
  gameState.combat = {
    active: true, context: 'home_raid', veinId: null, enemy,
    log: [`They're in the flat. You've got the crowbar. This is happening.`],
    outcome: null, frozenTurns: 0, motionTurns: 0, motionPower: 0,
    onWin: 'homeRaidWon',
  };
  gameState.currentScreen = 'combat';
  renderGame();
}

function homeRaidWon() {
  gameState.flags.homeRaidWon = true;
  gameState.flags.homeRaidEventSeen = true;
}

// Called from exitCombat when context is home_raid
function afterHomeRaidCombat(outcome) {
  if (outcome !== 'win') {
    // Steal some carried ore on loss
    gameState.flags.homeRaidWon = false;
    gameState.flags.homeRaidEventSeen = true;
    let stolen = 0;
    ORE_TYPE_KEYS.forEach(k => {
      const take = Math.floor((gameState.player.orichalchum[k]||0) * 0.5);
      gameState.player.orichalchum[k] = Math.max(0, (gameState.player.orichalchum[k]||0) - take);
      stolen += take;
    });
    if (stolen > 0) pushNotification(`The raider took ${stolen} units of ore before fleeing.`);
  }
  homeRaidDebriefStep = 0;
  gameState.currentScreen = 'event_home_raid_debrief';
  renderGame();
}

function advanceHomeRaidDebrief() {
  const cards = gameState.flags.homeRaidWon ? HOME_RAID_WIN_CARDS : HOME_RAID_LOSS_CARDS;
  if (homeRaidDebriefStep < cards.length) {
    homeRaidDebriefStep++;
    renderGame();
    setTimeout(() => { const a = document.querySelector('.event-card-area'); if(a) a.scrollTop = a.scrollHeight; }, 80);
  }
}

function completeHomeRaidDebrief() {
  gameState.flags.archiePartnerSeen       = true;
  gameState.flags.homeUnlocked            = true;
  gameState.flags.securityContactUnlocked = true;
  awardRelation('archie', 15);
  // Give player Archie's time vein — level 1, uncharged, needs cultivating
  const ld = VEIN_LEVELS[1];
  const archieVein = {
    id:           makeVeinId(),
    oreType:      'time',
    level:        1,
    levelLabel:   ld.label,
    devBar:       0,
    charged:      false,
    chargeBlocks: 0,
    claimed:      true,
    npcClaimed:   false,
    security:     'none',
    guards:       0,
    guardTemplate:null,
    location:     'Whitechapel High St, under the railway arch',
    claimedOnDay: gameState.world.day,
  };
  gameState.player.veins.push(archieVein);
  pushNotification(`Archie's time vein added to your operations. Needs cultivating before first harvest.`);
  pushNotification(`Archie's security contact is available. Check your Property page.`);
  gameState.currentScreen = 'home';
  renderGame();
}

// === CONTACT RELATION SYSTEM ===
function awardRelation(contactId, amount) {
  const c = gameState.contacts[contactId];
  if (!c) return;
  c.relation = (c.relation || 0) + amount;
}
function canRecruit(contactId) {
  const c = gameState.contacts[contactId];
  return c && c.unlocked && !c.recruited && c.relation >= c.recruitThreshold;
}
function recruitContact(contactId) {
  if (!canRecruit(contactId)) return;
  const c = gameState.contacts[contactId];
  c.recruited = true;
  // Initialise skill fields if missing (e.g. old save)
  if (!c.craftingSkill)   c.craftingSkill   = 1;
  if (!c.craftingXP)      c.craftingXP      = 0;
  if (!c.cultivatingSkill)c.cultivatingSkill = 1;
  if (!c.cultivatingXP)   c.cultivatingXP   = 0;
  if (c.assignedRoom === undefined) c.assignedRoom = null;
  const names = { archie:'Archie', james:'James' };
  pushNotification(`${names[contactId] || contactId} is now working with you. Assign them to a room via Your Property.`);
  closeModal(); renderGame();
}

// === CONTACT ROOM SYSTEM ===
function getContactInRoom(roomId) {
  // Returns contactId string or null
  const found = Object.entries(gameState.contacts).find(([,c]) => c.recruited && c.assignedRoom === roomId);
  return found ? found[0] : null;
}
function assignContactToRoom(contactId, roomId) {
  // Vacate the target room first
  Object.keys(gameState.contacts).forEach(cid => {
    if (gameState.contacts[cid].assignedRoom === roomId) gameState.contacts[cid].assignedRoom = null;
  });
  if (contactId !== 'none') gameState.contacts[contactId].assignedRoom = roomId;
  renderGame(); // modal is still open — re-render in place
}
function awardContactXP(contactId, skill, amount) {
  const c = gameState.contacts[contactId];
  if (!c) return;
  const xpKey    = skill + 'XP';
  const skillKey = skill + 'Skill';
  const levels   = skill === 'crafting' ? CRAFTING_XP_LEVELS : CULTIVATING_XP_LEVELS;
  c[xpKey]   = (c[xpKey]   || 0) + amount;
  const max  = levels.length - 1;
  const name = contactId === 'archie' ? 'Archie' : 'James';
  while (c[skillKey] < max && c[xpKey] >= levels[c[skillKey] + 1]) {
    c[skillKey]++;
    pushNotification(`${name}'s ${skill} skill reached level ${c[skillKey]}.`);
  }
}

// === LAB SYSTEM ===
function adjustLabThreshold(recipeKey, delta) {
  if (!gameState.labThresholds) gameState.labThresholds = {};
  gameState.labThresholds[recipeKey] = Math.max(0, (gameState.labThresholds[recipeKey] || 0) + delta);
  renderGame();
}
function processLab() {
  const contactId = getContactInRoom('lab');
  if (!contactId) return;
  const c = gameState.contacts[contactId];
  const thresholds = gameState.labThresholds || {};
  let totalAttempts = 0; let totalSuccesses = 0;
  Object.keys(RECIPES).forEach(key => {
    if (key === 'timePearl'    && !gameState.flags.craftingUnlocked)    return;
    if (key === 'motionPowder' && !gameState.flags.motionPowderUnlocked) return;
    if (key === 'rewind'       && !gameState.flags.craftingUnlocked)    return;
    const target = thresholds[key] || 0;
    if (target === 0) return;
    const r = RECIPES[key];
    const sk = c.craftingSkill || 1;
    const cost = Math.max(1, Math.round(r.baseCalcCost - (sk - 1) * 0.8));
    const getInv = () => key === 'timePearl' ? (gameState.player.inventory.timePearl||0) : key === 'motionPowder' ? (gameState.player.inventory.motionPowder||0) : (gameState.player.inventory.rewind||0);
    const addInv = () => { if (key === 'timePearl') gameState.player.inventory.timePearl++; else if (key === 'motionPowder') gameState.player.inventory.motionPowder = (gameState.player.inventory.motionPowder||0)+1; else gameState.player.inventory.rewind = (gameState.player.inventory.rewind||0)+1; };
    while (getInv() < target) {
      const hasCalc = r.ingredients.every(ing => (gameState.player.orichalchum[ing.type]||0) >= cost);
      if (!hasCalc) break;
      r.ingredients.forEach(ing => { gameState.player.orichalchum[ing.type] = Math.max(0,(gameState.player.orichalchum[ing.type]||0)-cost); });
      const chance = Math.min(0.95, r.baseSuccess + (sk-1)*0.13 + getWorkshopBonus());
      const success = Math.random() < chance;
      if (success) { addInv(); awardContactXP(contactId,'crafting',r.xpReward); totalSuccesses++; }
      else           { awardContactXP(contactId,'crafting',Math.floor(r.xpReward/3)); }
      totalAttempts++;
    }
  });
  if (totalAttempts > 0) {
    const name = contactId === 'archie' ? 'Archie' : 'James';
    pushNotification(`Lab (${name}): ${totalSuccesses} crafted from ${totalAttempts} attempt${totalAttempts!==1?'s':''}.`);
  }
}

// === VEIN STATION SYSTEM ===
function toggleVeinStationVein(veinId) {
  if (!gameState.veinStationVeins) gameState.veinStationVeins = [];
  const idx = gameState.veinStationVeins.indexOf(veinId);
  if (idx >= 0) gameState.veinStationVeins.splice(idx, 1);
  else gameState.veinStationVeins.push(veinId);
  renderGame();
}
function processVeinStation() {
  const contactId = getContactInRoom('veinStation');
  if (!contactId) return;
  const c = gameState.contacts[contactId];
  const veinIds = gameState.veinStationVeins || [];
  let totalHarvested = 0; let totalCultivated = 0;
  const harvestBreakdown = {};
  veinIds.forEach(vid => {
    const vein = gameState.player.veins.find(v => v.id === vid);
    if (!vein) return;
    const ld = VEIN_LEVELS[vein.level];
    if (vein.charged) {
      const [mn,mx] = ld.yieldCautious;
      const yld = rand(mn, mx);
      gameState.player.orichalchum[vein.oreType] = (gameState.player.orichalchum[vein.oreType]||0) + yld;
      vein.charged = false; vein.chargeBlocks = 0;
      totalHarvested += yld;
      harvestBreakdown[vein.oreType] = (harvestBreakdown[vein.oreType]||0) + yld;
      awardContactXP(contactId,'cultivating',15);
    } else {
      const sk = c.cultivatingSkill || 1;
      const success = Math.random() < Math.min(0.90, 0.30 + (sk-1)*0.12);
      if (success) {
        vein.devBar = (vein.devBar||0) + (1+sk);
        if (vein.devBar >= ld.devBarMax && vein.level < 5) levelUpVein(vein);
        awardContactXP(contactId,'cultivating',20);
        totalCultivated++;
      } else {
        awardContactXP(contactId,'cultivating',8);
      }
    }
  });
  if (totalHarvested > 0 || totalCultivated > 0) {
    const name = contactId === 'archie' ? 'Archie' : 'James';
    const msgs = [];
    if (totalHarvested > 0) {
      const bd = Object.entries(harvestBreakdown).map(([t,v])=>`${v} ${ORE_TYPES[t].name}`).join(', ');
      msgs.push(`harvested ${bd}`);
    }
    if (totalCultivated > 0) msgs.push(`cultivated ${totalCultivated} vein${totalCultivated!==1?'s':''}`);
    pushNotification(`Vein Station (${name}): ${msgs.join('; ')}.`);
  }
}

// === ARCHIE CRAFT CHAT EVENT ===
function advanceArchieCraftChat() {
  if (gameState.archieChatStep < ARCHIE_CRAFT_CHAT_CARDS.length) {
    gameState.archieChatStep++;
    renderGame();
    
  }
}
function completeArchieCraftChat() {
  gameState.flags.archieCraftChatSeen = true;
  gameState.flags.canSellConsumables  = true;
  gameState.flags.tutorialStage       = 'free';
  awardRelation('archie', 5);
  // Give player 20 time calc (Archie's gift)
  gameState.player.orichalchum.time = (gameState.player.orichalchum.time||0) + 20;
  // Immediately queue home raid — player now has something worth stealing
  gameState.flags.homeRaidEventPending = true;
  gameState.currentScreen = 'home'; renderGame();
}

// === SELL MENU HELPERS ===
function sellAdjust(key, delta, max) {
  if (!gameState.sellState) gameState.sellState = {};
  const cur = gameState.sellState[key] || 0;
  gameState.sellState[key] = Math.max(0, Math.min(max, cur + delta));
  // Re-render modal in place
  gameState.modal = { type:'sell_menu', data:{} };
  renderGame();
}

function doSell() {
  const ss = gameState.sellState || {};
  const items = [];
  ORE_TYPE_KEYS.forEach(k => { const q=ss['ore_'+k]||0; if(q>0) items.push({kind:'ore',type:k,qty:q}); });
  const pq = ss['con_timePearl']||0;    if(pq>0) items.push({kind:'consumable',type:'timePearl',   qty:pq});
  const mq = ss['con_motionPowder']||0; if(mq>0) items.push({kind:'consumable',type:'motionPowder',qty:mq});
  gameState.sellState = {};
  closeModal();
  executeSale(items);
}

// === ARCHIE MOTION / JAMES MOTION EVENTS ===
let archieMotionStep = 0;
let jamesMotionStep  = 0;

function advanceArchieMotion() {
  if (archieMotionStep < ARCHIE_MOTION_CARDS.length) { archieMotionStep++; renderGame();  }
}
function completeArchieMotion() {
  gameState.flags.archieMotionEventSeen = true;
  gameState.flags._archieMotionPending  = false;
  gameState.currentScreen = 'home'; renderGame();
}
function advanceJamesMotion() {
  if (jamesMotionStep < JAMES_MOTION_CARDS.length) { jamesMotionStep++; renderGame();  }
}
function completeJamesMotion() {
  gameState.flags.jamesMotionEventSeen  = true;
  gameState.flags.motionPowderUnlocked  = true;
  gameState.contacts.james.relation = (gameState.contacts.james.relation||0) + 1;
  checkOreGoal(); // may immediately queue home raid if player already has 5+ ore
  gameState.currentScreen = 'home'; renderGame();
}

// === JAMES CRAFTING JOB SYSTEM ===
function generateJamesJob() {
  const trust = gameState.contacts.james.relation || 0;
  const recipes = ['timePearl'];
  if (gameState.flags.motionPowderUnlocked) recipes.push('motionPowder');
  const recipeKey = randFrom(recipes);
  const recipe    = RECIPES[recipeKey];
  // Size scales with trust: trust 0-1=1-3, trust 2-3=3-6, trust 4+=5-10
  const minQty = trust <= 1 ? 1 : trust <= 3 ? 3 : 5;
  const maxQty = trust <= 1 ? 3 : trust <= 3 ? 6 : 10;
  const qty    = rand(minQty, maxQty);
  const payPerItem = CONSUMABLE_PRICES[recipeKey];
  return { recipeKey, recipeName: recipe.name, symbol: recipe.symbol, qty, payPerItem, totalPay: payPerItem * qty };
}

function offerJamesJob() {
  if (gameState.flags.jamesJobActive) return;
  const job = generateJamesJob();
  gameState.jamesJob = job;
  gameState.flags.jamesJobActive = true;
  openModal('james_job_offer', { job });
}

function acceptJamesJob() {
  closeModal();
  pushNotification(`James wants ${gameState.jamesJob.qty}× ${gameState.jamesJob.recipeName}. Pay: £${gameState.jamesJob.totalPay}.`);
  renderGame();
}

function fulfillJamesJob() {
  const job = gameState.jamesJob;
  if (!job) return;
  const inv  = gameState.player.inventory;
  const have = job.recipeKey === 'timePearl' ? inv.timePearl : inv.motionPowder;
  if (have < job.qty) { openModal('james_job_short', { job, have }); return; }
  // Deduct items and pay
  if (job.recipeKey === 'timePearl')    inv.timePearl    -= job.qty;
  if (job.recipeKey === 'motionPowder') inv.motionPowder -= job.qty;
  gameState.player.cash += job.totalPay;
  awardRelation('james', 5);
  gameState.flags.jamesJobActive = false;
  gameState.jamesJob = null;
  openModal('james_job_complete', { earned: job.totalPay });
}

// === EQUIP SYSTEM ===
function getAttackRange() {
  const p = gameState.player;
  let min = p.attackMin, max = p.attackMax;
  if (p.equipment.weapon) {
    const itemObj = p.items.find(i => i.id === p.equipment.weapon);
    if (itemObj) {
      const def = ITEMS[itemObj.type];
      if (def) { min += def.attackBonus.min; max += def.attackBonus.max; }
    }
  }
  return { min, max };
}
function equipItem(itemId) {
  const itemObj = gameState.player.items.find(i => i.id === itemId);
  if (!itemObj) return;
  const def = ITEMS[itemObj.type];
  if (!def) return;
  gameState.player.equipment[def.slot] = itemId;
  closeModal(); renderGame();
}
function unequipSlot(slot) {
  gameState.player.equipment[slot] = null;
  closeModal(); renderGame();
}

// === SELL / BUYER SYSTEM ===
function openSellMenu() {
  openModal('sell_menu', {});
}

function executeSale(items) {
  // items = [{ kind:'ore', type:'time', qty:3 }, { kind:'consumable', type:'timePearl', qty:1 }]
  if (!items || items.length === 0) { closeModal(); return; }
  let gross = 0;
  let consSold = 0;
  items.forEach(item => {
    if (item.kind === 'ore') {
      const pricePerUnit = getEffectiveOrePrice(item.type, ORE_TYPES[item.type]?.basePrice||8);
      gross += pricePerUnit * item.qty;
      gameState.player.orichalchum[item.type] = Math.max(0, (gameState.player.orichalchum[item.type]||0) - item.qty);
    } else if (item.kind === 'consumable') {
      const pricePerUnit = CONSUMABLE_PRICES[item.type] || 30;
      gross += pricePerUnit * item.qty;
      consSold += item.qty;
      if (item.type === 'timePearl')    gameState.player.inventory.timePearl    = Math.max(0, gameState.player.inventory.timePearl    - item.qty);
      if (item.type === 'motionPowder') gameState.player.inventory.motionPowder = Math.max(0, gameState.player.inventory.motionPowder - item.qty);
    }
  });
  if (consSold > 0) {
    gameState.flags.consSoldCount = (gameState.flags.consSoldCount||0) + consSold;
    if (!gameState.flags.archieMotionEventSeen && gameState.flags.consSoldCount >= 1) {
      // Queue Archie motion event notification
      setTimeout(() => {
        pushNotification('Archie texted. Check Contacts.');
        gameState.flags._archieMotionPending = true;
        renderGame();
      }, 400);
    }
  }
  const playerCut = Math.floor(gross * 0.5); // 50/50 split with Archie
  const mugged = Math.random() < getEffectiveMugChance(0.20);
  if (mugged) {
    // Store pending sale, start combat; on win pay out
    gameState._pendingSaleCut = playerCut;
    startMugging();
  } else {
    gameState.player.cash += playerCut;
    closeModal();
    openModal('sale_result', { earned: playerCut, gross, mugged: false });
  }
}
function startMugging() {
  const count = rand(1,3);
  // Fixed stats — independent of player, but scales with group size
  const enemy = {
    name:      count === 1 ? 'A mugger' : `${count} muggers`,
    hp:        28 * count,
    hpMax:     28 * count,
    attackMin: 4 + (count - 1) * 2,
    attackMax: 10 + (count - 1) * 3,
    veinRef:   null,
    isMugging: true,
  };
  gameState.combat = { active:true, context:'mugging', veinId:null, enemy, log:[`${enemy.name} step out of nowhere. They want what you're carrying.`], outcome:null, frozenTurns:0, motionTurns:0, motionPower:0, onWin:'muggingWon' };
  closeModal(); gameState.currentScreen='combat'; renderGame();
}
function muggingWon() {
  const earned = gameState._pendingSaleCut || 0;
  gameState._pendingSaleCut = 0;
  if (earned > 0) gameState.player.cash += earned;
  openModal('sale_result', { earned, gross: earned * 2, mugged: true });
}

// === COMBAT SYSTEM ===
function startRaid(vein) {
  const template = vein.guardTemplate || randFrom(ENEMY_TEMPLATES);
  const hpScale  = 1 + (vein.level-1)*0.3; const guards = Math.max(1,vein.guards);
  const enemy = { name:guards>1?`${guards}× ${template.name}`:template.name,
    hp:Math.round(template.hpBase*hpScale*guards), hpMax:Math.round(template.hpBase*hpScale*guards),
    attackMin:template.attackMin, attackMax:template.attackMax+(vein.level-1), veinRef:vein, isMugging:false };
  gameState.combat = { active:true, context:'raid', veinId:vein.id, enemy, log:[`You move in on the vein at ${vein.location}. ${enemy.name} steps out to meet you.`], outcome:null, frozenTurns:0, motionTurns:0, motionPower:0, onWin:'raidWon' };
  closeModal(); gameState.currentScreen='combat'; renderGame();
}
function raidWon() {
  const vein = gameState.combat.enemy.veinRef;
  if (vein) { vein.npcClaimed=false; vein.claimed=true; vein.guards=0; vein.guardTemplate=null; gameState.player.veins.push(vein); }
}
function pushCombatSnapshot() {
  const c = gameState.combat, p = gameState.player;
  if (!c.enemy) return;
  c.snapshots = (c.snapshots || []).slice(-1); // keep max 2 (push makes it 2)
  c.snapshots.push({
    playerHp:   p.hp,
    enemyHp:    c.enemy.hp,
    log:        [...c.log],
    frozenTurns:c.frozenTurns,
    motionTurns:c.motionTurns,
    motionPower:c.motionPower,
    evadeTurns: c.evadeTurns||0,
    evadeChance:c.evadeChance||0,
  });
}
function combatRewind() {
  const c = gameState.combat, p = gameState.player;
  if (!c.active || !(c.snapshots||[]).length) return;
  // Check for rewind item (consumable or device)
  const hasConsumable = (p.inventory.rewind||0) > 0;
  const devId = p.equipment.device;
  const rewindDev = devId ? (p.devicesCompleted||[]).find(d => d.id === devId && DEVICE_TYPES[d.type]?.effect === 'rewind') : null;
  const hasDevice = rewindDev && getDeviceChargesLeft(rewindDev) > 0;
  if (!hasConsumable && !hasDevice) return;
  // Consume
  if (hasConsumable) { p.inventory.rewind--; }
  else { rewindDev.chargesUsedToday++; awardDeviceXP(rewindDev, 10); }
  // Restore the oldest available snapshot (up to 2 turns back)
  const snap = c.snapshots[0];
  c.snapshots = [];
  p.hp            = snap.playerHp;
  c.enemy.hp      = snap.enemyHp;
  c.log           = [...snap.log, '⟲ Time unspools. The moment resets. Only you remember.'];
  c.frozenTurns   = snap.frozenTurns;
  c.motionTurns   = snap.motionTurns;
  c.motionPower   = snap.motionPower;
  c.outcome       = null;
  c.evadeTurns    = 2;
  c.evadeChance   = 0.50;
  closeModal();
  renderGame();
}
function combatPlayerAttack() {
  const c = gameState.combat;
  if (!c.active || c.outcome) return;
  pushCombatSnapshot(); // snapshot state at start of player turn

  // Determine how many attacks this turn
  let attackCount = 1;
  if (c.motionTurns > 0) {
    attackCount = c.motionPower >= 3 ? 3 : 2;
    const motionLabel = attackCount === 3 ? 'three times' : 'twice';
    c.log.push(`Motion powder — you move ${motionLabel} as fast.`);
  }

  for (let i = 0; i < attackCount; i++) {
    if (c.enemy.hp <= 0) break;
    const atk = getAttackRange();
    const dmg = rand(atk.min, atk.max);
    c.enemy.hp = Math.max(0, c.enemy.hp - dmg);
    const frozenNote = c.frozenTurns > 0 ? ' (enemy frozen)' : '';
    const hitLabel = attackCount > 1 ? ` (hit ${i+1})` : '';
    c.log.push(`You attack${hitLabel} — ${dmg} damage${frozenNote}. Enemy: ${c.enemy.hp}/${c.enemy.hpMax} HP.`);
    if (c.enemy.hp <= 0) {
      c.outcome = 'win';
      c.log.push(c.context === 'mugging' ? `They leg it. Good call on their part.` : `They go down. Vein is yours.`);
      if (c.onWin) window[c.onWin]();
      renderGame(); return;
    }
  }

  // Tick motion powder
  if (c.motionTurns > 0) {
    c.motionTurns--;
    if (c.motionTurns === 0) c.log.push(`The powder wears off. Back to normal speed.`);
  }

  // Tick freeze and possibly enemy attacks
  if (c.frozenTurns > 0) {
    c.frozenTurns--;
    if (c.frozenTurns === 0) c.log.push(`The time effect wears off. They're coming back round.`);
  } else {
    enemyAttack();
  }
  renderGame();
}
function combatFlee() {
  const c = gameState.combat;
  if (!c.active||c.outcome) return;
  if (Math.random()>0.35) { c.outcome='fled'; c.log.push('You back off sharpish. Probably the right call.'); }
  else { c.log.push('You try to leg it — they get a parting shot in.'); enemyAttack(); }
  renderGame();
}
function combatUseTimePearl() {
  const c = gameState.combat;
  if (!c.active || c.outcome || gameState.player.inventory.timePearl <= 0) return;
  if (c.frozenTurns > 0) { c.log.push('Already frozen. Save the pearl.'); renderGame(); return; }
  gameState.player.inventory.timePearl--;
  const power = getCraftingEffectPower('timePearl');
  c.frozenTurns = power;
  c.log.push(`You throw a time pearl. The air goes thick. Everything slows. (${power} turn${power>1?'s':''})`);
  renderGame();
}
function combatUseMotionPowder() {
  const c = gameState.combat;
  if (!c.active || c.outcome || gameState.player.inventory.motionPowder <= 0) return;
  if (c.motionTurns > 0) { c.log.push('Already moving fast. Wait for it to wear off.'); renderGame(); return; }
  gameState.player.inventory.motionPowder--;
  const power = getCraftingEffectPower('motionPowder');
  // power 1-2 = attack twice for 1-2 turns; power 3 = attack 3x for 2 turns
  c.motionPower  = power;
  c.motionTurns  = power >= 3 ? 2 : 1;
  c.log.push(`You rub the powder in. The world slows slightly around you. You feel very fast.`);
  renderGame();
}
function combatUseItem() {
  const c = gameState.combat;
  if (!c.active || c.outcome) return;
  const p = gameState.player;
  const hasPearl   = (p.inventory.timePearl||0)   > 0;
  const hasMotion  = (p.inventory.motionPowder||0) > 0;
  const hasRewind  = (p.inventory.rewind||0)       > 0;
  const devId      = p.equipment.device;
  const dev        = devId ? (p.devicesCompleted||[]).find(d => d.id === devId) : null;
  const hasDevice  = dev && getDeviceChargesLeft(dev) > 0;
  const hasRewindDev = dev && DEVICE_TYPES[dev.type]?.effect === 'rewind' && hasDevice;
  const totalItems = [hasPearl,hasMotion,hasRewind,hasDevice].filter(Boolean).length;
  if (totalItems === 0) { c.log.push('You rummage in your pockets. Nothing useful. Classic.'); renderGame(); return; }
  if (totalItems === 1) {
    if (hasPearl)      { combatUseTimePearl();   return; }
    if (hasMotion)     { combatUseMotionPowder(); return; }
    if (hasRewind)     { openModal('combat_items',{}); return; } // open modal for confirm
    if (hasDevice)     { combatUseDevice();       return; }
  }
  openModal('combat_items', {});
}
function enemyAttack() {
  const c = gameState.combat;
  if (c.outcome||c.frozenTurns>0) return;
  // Evade check
  if ((c.evadeTurns||0) > 0) {
    c.evadeTurns--;
    if (Math.random() < (c.evadeChance||0)) {
      c.log.push(`${c.enemy.name} swings — you're not there. ${c.evadeTurns > 0 ? c.evadeTurns + ' evade turn' + (c.evadeTurns!==1?'s':'') + ' left.' : 'Evade fades.'}`);
      return;
    }
  }
  const dmg = rand(c.enemy.attackMin, c.enemy.attackMax);
  gameState.player.hp = Math.max(0, gameState.player.hp-dmg);
  c.log.push(`${c.enemy.name} hits you for ${dmg}. You: ${gameState.player.hp}/${gameState.player.hpMax} HP.`);
  if (gameState.player.hp<=0) { c.outcome='loss'; c.log.push('You\'re done. You come round somewhere unpleasant.'); gameState.player.hp=Math.round(gameState.player.hpMax*0.3); }
}
function exitCombat() {
  const c = gameState.combat;
  const outcome = c.outcome; const ctx = c.context;
  gameState.combat = { active:false, context:'raid', veinId:null, enemy:null, log:[], outcome:null, frozenTurns:0, motionTurns:0, motionPower:0, onWin:null, snapshots:[], evadeTurns:0, evadeChance:0 };
  if (ctx==='mugging' && outcome==='win') { /* sale_result modal already opened by muggingWon */ return; }
  if (ctx==='home_raid') { afterHomeRaidCombat(outcome); return; }
  gameState.currentScreen = outcome==='win'&&ctx==='raid' ? 'inventory' : 'home';
  renderGame();
}

// === EVENT ITEM SYSTEM ===
function hasEventUsableItems() {
  const p = gameState.player;
  if ((p.inventory.rewind||0) > 0) return true;
  const d = p.equipment.device;
  if (!d) return false;
  const dev = (p.devicesCompleted||[]).find(x => x.id === d && DEVICE_TYPES[x.type]?.eventUsable);
  return !!(dev && getDeviceChargesLeft(dev) > 0);
}
function openEventItemModal(rewindFnName) {
  openModal('event_items', { rewindFnName });
}
function useEventRewindItem(itemType) {
  const rewindFnName = gameState.modal?.data?.rewindFnName;
  if (!rewindFnName) return;
  const p = gameState.player;
  if (itemType === 'consumable') {
    if ((p.inventory.rewind||0) <= 0) return;
    p.inventory.rewind--;
  } else {
    const devId = p.equipment.device;
    const dev = (p.devicesCompleted||[]).find(d => d.id === devId && DEVICE_TYPES[d.type]?.eventUsable);
    if (!dev || getDeviceChargesLeft(dev) <= 0) return;
    dev.chargesUsedToday++;
    awardDeviceXP(dev, 10);
  }
  closeModal();
  window[rewindFnName]();
}
// Rewind functions — one per event
function rewindBuyerEvent()      { gameState.buyerStep      = 0; renderGame(); }
function rewindJamesEvent()      { gameState.jamesStep      = 0; renderGame(); }
function rewindArchieChatEvent() { gameState.archieChatStep = 0; renderGame(); }
function rewindArchieMotion()    { archieMotionStep = 0; renderGame(); }
function rewindJamesMotion()     { jamesMotionStep  = 0; renderGame(); }
function rewindHomeRaidIntro()   { homeRaidIntroStep = 0; renderGame(); }
function rewindHomeRaidDebrief() { homeRaidDebriefStep = 0; renderGame(); }
function advanceIntro() {
  if (gameState.introStep < INTRO_CARDS.length) { gameState.introStep++; renderGame();  }
}
function completeIntro() {
  gameState.flags.metArchie = true;
  // Buyer event triggers on day 2 via dailyTick
  gameState.flags.tutorialStage = 'buyer_event';
  gameState.currentScreen = 'home'; renderGame();
}

// === MODAL / NAV ===
function openModal(type,data) { gameState.modal={type,data}; renderGame(); }
function closeModal()          { gameState.modal=null; renderGame(); }
function openRoomModal(roomId) { openModal('room_detail',{ roomId }); }
function navigate(screen)      { gameState.modal=null; gameState.currentScreen=screen; renderGame(); }

