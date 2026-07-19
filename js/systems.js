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
  [['time',3,'greenwich'],['physics',1,'camden'],['life',5,'hampstead']].forEach(([type,level,district]) => {
    p.veins.push({ id:makeVeinId(), oreType:type, level, levelLabel:VEIN_LEVELS[level].label,
      charged:true, chargeBlocks:VEIN_LEVELS[level].rechargeBlocks, claimed:true, npcClaimed:false,
      security:'basic', guards:0, guardTemplate:null, location:generateLocationName(district),
      district, hospitability:{tier:'fair',bonuses:[]}, maxLevel:VEIN_MAX_LEVEL_DEFAULT });
  });
  p.currentDistrict = HOME_DISTRICT;
  gameState.world.sites = [];
  gameState.world._siteId = 1;
  makeSite('whitechapel'); makeSite('city'); makeSite('kingsx');
  gameState.flags.cultivateTutorialSeen = true;
  const f = gameState.flags;
  f.tutorialStage='free'; f.metArchie=f.hasDetector=f.hasHarvester=f.metJames=f.hasTimePearls=true;
  f.buyerEventSeen=f.craftingUnlocked=f.jamesCraftEventSeen=f.archieCraftChatSeen=f.canSellConsumables=true;
  f.archieMotionEventSeen=f.jamesMotionEventSeen=f.enhancementPowderUnlocked=true; f.consSoldCount=5;
  f.archiePartnerSeen=f.homeUnlocked=f.securityContactUnlocked=true;
  // homeRaidEventSeen intentionally NOT set — set pending so event triggers on home screen
  gameState.flags.homeRaidEventPending = true;
  gameState.player.inventory.enhancementPowder=3;
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
  gameState.home.storedOre = { time:10, physics:5 };
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
  let mult = 1 + (fx.orePrice||0) + (fx[type + 'Premium']||0);
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
    const rechargeNeed = getVeinRechargeBlocks(v);
    const districtBonus = DISTRICTS[veinDistrict(v)]?.rechargeBonus || 0;
    if (v.chargeBlocks < rechargeNeed) v.chargeBlocks += 1 + districtBonus;
    if (v.chargeBlocks >= rechargeNeed) { v.chargeBlocks = rechargeNeed; v.charged = true; }
    const age = day - (v.claimedOnDay || day);
    if (age >= ld.lifespanDays) { expired.push(v); return false; }
    return true;
  });
  // You always wake at home
  gameState.player.currentDistrict = HOME_DISTRICT;
  // NPC site-claiming: unclaimed sites can be snapped up — quality and age make them hotter
  const claimed = [];
  gameState.world.sites = (gameState.world.sites || []).filter(s => {
    const age = day - (s.discoveredDay || day);
    const tierHeat = { barren:0, poor:0.01, fair:0.03, rich:0.06, saturated:0.10 }[s.tier] || 0;
    if (Math.random() < tierHeat + age * 0.01) { claimed.push(s); return false; }
    return true;
  });
  claimed.forEach(s => {
    pushNotification(`Someone got to the ${SITE_TIERS[s.tier].label.toLowerCase()} site in ${DISTRICTS[s.district].name} before you. It happens. It keeps happening.`);
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
  // NPC raids on your veins (M2): daily roll per vein vs its security tier.
  // Success steals charged ore — the demand side of vein-security spending.
  rollVeinRaids(day);
  // Reputation decays slowly toward zero — fame is perishable
  if (day % 3 === 0 && (gameState.player.reputation || 0) > 0) gameState.player.reputation -= 1;
  // Process rooms
  if (gameState.home.rooms.includes('lab'))        processLab();
  if (gameState.home.rooms.includes('veinStation')) processVeinStation();
  // Reset device charges
  resetDeviceCharges();
}

// === NPC VEIN RAIDS (M2) ===
function rollVeinRaids(day) {
  const fx = getBarometerEffects();
  gameState.player.veins.forEach(v => {
    if (!v.charged) return; // nothing worth taking from an empty vein
    const sec = SECURITY_TIERS.find(s => s.id === v.security) || SECURITY_TIERS[0];
    const dMod = DISTRICTS[veinDistrict(v)]?.dangerMod || 0;
    // base risk scales with district danger + vein level (visible value), minus security
    let chance = 0.05 + dMod * 0.6 + (v.level - 1) * 0.02 + (fx.raidChance || 0) - sec.raidResist / 100;
    chance = Math.max(0, Math.min(0.6, chance));
    if (Math.random() >= chance) return;
    // Success steals charged ore proportional to how little security resists
    const ld = VEIN_LEVELS[v.level];
    const resistFactor = 1 - sec.raidResist / 100;
    const stolen = Math.max(1, Math.round(rand(ld.yieldCautious[0], ld.yieldCautious[1]) * resistFactor * getVeinYieldMult(v)));
    v.charged = false; v.chargeBlocks = 0;
    pushNotification(`⚠ Your ${ORE_TYPES[v.oreType].name} vein in ${DISTRICTS[veinDistrict(v)].name} was raided overnight — ${stolen} charged ore lost. ${sec.id === 'none' ? 'It has no security at all.' : `${sec.label} slowed them, not much.`}`);
  });
}
function pushNotification(text) {
  gameState.notifications.push({ id: Date.now() + Math.random(), text });
}
function dismissNotification(id) {
  gameState.notifications = gameState.notifications.filter(n => n.id !== id);
  renderGame();
}

// === LOCATION GENERATOR (used by seeding) ===
function generateLocationName(districtId) {
  const d = DISTRICTS[districtId];
  const s = d ? d.streets : ['Brick Lane','Bethnal Green Rd','Commercial St','Whitechapel High St','Mile End Rd','Roman Rd','Hackney Rd','Cambridge Heath Rd','Vallance Rd'];
  const x = ['near the off-licence','behind the Tesco Metro','under the railway arch','in the car park','by the bus stop','beside the bookies'];
  return `${randFrom(s)}, ${randFrom(x)}`;
}

// === M1: TRAVEL SYSTEM ===
// One rule: acting in a district you're not in costs +1 time block (the travel),
// then the action costs its normal block. You wake at home each day.
function blocksRemaining() { return TIME_BLOCKS.length - gameState.world.timeBlocksDone.length; }
function isPlayerIn(districtId) { return (gameState.player.currentDistrict || HOME_DISTRICT) === districtId; }
function travelBlocksTo(districtId) { return isPlayerIn(districtId) ? 0 : 1; }

// Consume the travel block if needed before an action elsewhere.
// Returns false (with a notification) when there isn't time for travel + action.
function ensurePresence(districtId) {
  if (isPlayerIn(districtId)) return true;
  if (blocksRemaining() < 2) {
    pushNotification(`Not enough time today to get to ${DISTRICTS[districtId].name} and still do anything there.`);
    renderGame();
    return false;
  }
  advanceTimeBlock();
  gameState.player.currentDistrict = districtId;
  return true;
}

// Explicit travel from the map — costs 1 block, can trigger a district event.
function travelTo(districtId) {
  if (isPlayerIn(districtId) || isTimeExhausted()) return;
  advanceTimeBlock();
  gameState.player.currentDistrict = districtId;
  closeModal();
  if (!maybeDistrictEvent(districtId)) renderGame();
}

// === M1: PROSPECTING & SITES ===
function makeSiteId() {
  gameState.world._siteId = (gameState.world._siteId || 1);
  return 's' + (gameState.world._siteId++);
}
function districtSites(districtId) {
  return (gameState.world.sites || []).filter(s => s.district === districtId);
}
function rollSiteTier(districtId) {
  const d = DISTRICTS[districtId];
  const skill = gameState.player.cultivatingSkill || 1;
  const q = (d.siteQualityMod || 0) + (skill - 1) * 0.03; // cultivating's second job
  const weights = {};
  Object.values(SITE_TIERS).forEach(t => { weights[t.id] = t.weight; });
  // Quality shifts weight out of barren/poor into rich/saturated
  const shift = Math.round(q * 100);
  weights.barren    = Math.max(2, weights.barren - shift);
  weights.poor      = Math.max(5, weights.poor   - shift);
  weights.rich      = Math.max(0, weights.rich      + Math.round(shift * 0.7));
  weights.saturated = Math.max(0, weights.saturated + Math.round(shift * 0.3));
  const total = Object.values(weights).reduce((s,v)=>s+v,0);
  let roll = Math.random() * total;
  for (const [id,w] of Object.entries(weights)) { roll -= w; if (roll <= 0) return id; }
  return 'fair';
}
function rollSiteOreType(districtId) {
  const bias = DISTRICTS[districtId].oreBias;
  if (!bias) return randFrom(ORE_TYPE_KEYS);
  const biased = Array.isArray(bias) ? bias : [bias];
  // 60% chance the district's character wins; otherwise anything
  return Math.random() < 0.6 ? randFrom(biased) : randFrom(ORE_TYPE_KEYS);
}
function tierRank(tierId) { return ['barren','poor','fair','rich','saturated'].indexOf(tierId); }
function makeSite(districtId) {
  const tier = rollSiteTier(districtId);
  const t = SITE_TIERS[tier];
  const bonusPool = Object.keys(SITE_BONUSES);
  const bonuses = tier === 'saturated' ? [...bonusPool]
    : t.bonusCount > 0 ? [randFrom(bonusPool)] : [];
  const site = {
    id: makeSiteId(), district: districtId, tier, bonuses,
    oreBias: rollSiteOreType(districtId),
    location: generateLocationName(districtId),
    discoveredDay: gameState.world.day,
    natural: tier === 'saturated' && Math.random() < 0.05,
  };
  gameState.world.sites.push(site);
  return site;
}
function prospectDistrict(districtId) {
  const d = DISTRICTS[districtId];
  if (!d || !d.canProspect) return;
  const need = 1 + travelBlocksTo(districtId);
  if (blocksRemaining() < need) {
    pushNotification(`Not enough time today. Prospecting ${d.name} needs ${need} block${need>1?'s':''}.`);
    renderGame();
    return;
  }
  if (!ensurePresence(districtId)) return;
  advanceTimeBlock();
  // District at cap: re-roll its worst unclaimed site instead
  const existing = districtSites(districtId);
  if (existing.length >= d.siteCap) {
    const worst = existing.slice().sort((a,b)=>tierRank(a.tier)-tierRank(b.tier))[0];
    gameState.world.sites = gameState.world.sites.filter(s => s.id !== worst.id);
    const site = makeSite(districtId);
    openModal('prospect_result', { siteId: site.id, rerolledTier: SITE_TIERS[worst.tier].label });
  } else {
    const site = makeSite(districtId);
    openModal('prospect_result', { siteId: site.id });
  }
  awardCultivatingXP(10);
  renderGame();
}

// === M1: SITE HOSPITABILITY → VEIN TERROIR ===
function getVeinMaxLevel(vein) { return vein.maxLevel || VEIN_MAX_LEVEL_DEFAULT; }
function veinHasBonus(vein, bonusId) { return !!(vein.hospitability && (vein.hospitability.bonuses||[]).includes(bonusId)); }
function getVeinRechargeBlocks(vein) {
  const base = VEIN_LEVELS[vein.level].rechargeBlocks;
  return Math.max(1, base - (veinHasBonus(vein,'recharge') ? 1 : 0));
}
function getVeinYieldMult(vein) { return veinHasBonus(vein,'yield') ? 1.15 : 1; }
function veinDistrict(vein) { return vein.district || 'whitechapel'; }

function makeVeinFromSite(site, oreType, level) {
  const ld = VEIN_LEVELS[level];
  return {
    id: makeVeinId(), oreType, level, levelLabel: ld.label,
    devBar: 0, charged: false, chargeBlocks: 0,
    claimed: true, npcClaimed: false,
    security: 'none', guards: 0, guardTemplate: null,
    location: site.location, district: site.district,
    claimedOnDay: gameState.world.day,
    hospitability: { tier: site.tier, bonuses: [...site.bonuses] },
    maxLevel: VEIN_MAX_LEVEL_DEFAULT + ((site.bonuses||[]).includes('level') ? 1 : 0),
  };
}
function attemptSeedAtSite(siteId, oreType) {
  const site = (gameState.world.sites || []).find(s => s.id === siteId);
  if (!site || site.tier === 'barren') return;
  const have = gameState.player.orichalchum[oreType] || 0;
  if (have < SEED_ORE_COST) return;
  const need = 1 + travelBlocksTo(site.district);
  if (blocksRemaining() < need) {
    pushNotification(`Not enough time today. Seeding at ${DISTRICTS[site.district].name} needs ${need} block${need>1?'s':''}.`);
    renderGame();
    return;
  }
  if (!ensurePresence(site.district)) return;
  advanceTimeBlock();
  gameState.player.orichalchum[oreType] = have - SEED_ORE_COST;
  const chance = Math.min(0.95, getCultivatingSuccessChance() + SITE_TIERS[site.tier].seedMod);
  const success = Math.random() < chance;
  if (success) {
    const newVein = makeVeinFromSite(site, oreType, 1);
    newVein.devBar = getCultivatingBarGain();
    gameState.player.veins.push(newVein);
    gameState.world.sites = gameState.world.sites.filter(s => s.id !== siteId);
    awardCultivatingXP(30);
    openModal('seed_result', { success: true, oreType, veinId: newVein.id });
  } else {
    awardCultivatingXP(5);
    openModal('seed_result', { success: false, oreType, siteId });
  }
  renderGame();
}
function claimNaturalVein(siteId) {
  // ~5% of Saturated sites hold a natural Lv1 vein — free, already alive
  const site = (gameState.world.sites || []).find(s => s.id === siteId);
  if (!site || !site.natural) return;
  if (!ensurePresence(site.district)) return;
  const vein = makeVeinFromSite(site, site.oreBias, 1);
  vein.devBar = 2;
  gameState.player.veins.push(vein);
  gameState.world.sites = gameState.world.sites.filter(s => s.id !== siteId);
  pushNotification(`The ${DISTRICTS[site.district].name} site held a live vein. It's yours now. No paperwork changed hands.`);
  closeModal();
  renderGame();
}

// === M1: DISTRICT EVENTS ===
function maybeDistrictEvent(districtId, chance = 0.30) {
  if (Math.random() > chance) return false;
  const d = DISTRICTS[districtId];
  const pool = DISTRICT_EVENTS.filter(ev => {
    if (ev.districts && !ev.districts.includes(districtId)) return false;
    if (ev.danger && (d.dangerMod || 0) < 0.05) return false;
    return true;
  });
  if (!pool.length) return false;
  const total = pool.reduce((s,ev)=>s+ev.weight,0);
  let roll = Math.random() * total;
  let event = pool[0];
  for (const ev of pool) { roll -= ev.weight; if (roll <= 0) { event = ev; break; } }
  if (event.effect.kind === 'mugging') {
    gameState._pendingSaleCut = 0;
    const enemy = { name:'A mugger', hp:28, hpMax:28, attackMin:4, attackMax:10, veinRef:null, isMugging:true };
    gameState.combat = { active:true, context:'mugging', veinId:null, enemy,
      log:[event.text.replace(/<[^>]*>/g,'')], outcome:null, frozenTurns:0, motionTurns:0, motionPower:0, onWin:null };
    gameState.currentScreen = 'combat';
    renderGame();
    return true;
  }
  applyDistrictEventEffect(event);
  openModal('district_event', { eventId: event.id });
  return true;
}
function applyDistrictEventEffect(event) {
  const e = event.effect;
  if (e.kind === 'cash')     gameState.player.cash = Math.max(0, gameState.player.cash + e.amount);
  if (e.kind === 'ore')      gameState.player.orichalchum[e.type] = (gameState.player.orichalchum[e.type]||0) + e.amount;
  if (e.kind === 'relation') awardRelation(e.contact, e.amount);
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

function attemptCultivate(veinId) {
  const vein = gameState.player.veins.find(v => v.id === veinId);
  if (!vein) return;
  const need = 1 + travelBlocksTo(veinDistrict(vein));
  if (blocksRemaining() < need) {
    pushNotification(`Not enough time today. That vein is in ${DISTRICTS[veinDistrict(vein)].name} — you'd need ${need} blocks.`);
    renderGame();
    return;
  }
  if (!ensurePresence(veinDistrict(vein))) return;
  advanceTimeBlock();
  const success = Math.random() < getCultivatingSuccessChance();
  if (success) {
    const gain    = getCultivatingBarGain();
    const ld      = VEIN_LEVELS[vein.level];
    const prevBar = vein.devBar || 0;
    vein.devBar   = prevBar + gain;
    awardCultivatingXP(20);
    const levelledUp = vein.level < getVeinMaxLevel(vein) && vein.devBar >= ld.devBarMax;
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
  if (vein.level >= getVeinMaxLevel(vein)) return;
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

function canWorkVein(vein) {
  const need = 1 + travelBlocksTo(veinDistrict(vein));
  if (blocksRemaining() < need) {
    pushNotification(`Not enough time today. That vein is in ${DISTRICTS[veinDistrict(vein)].name} — you'd need ${need} blocks.`);
    renderGame();
    return false;
  }
  return ensurePresence(veinDistrict(vein));
}

function harvestVeinCautious(veinId) {
  const vein = gameState.player.veins.find(v => v.id === veinId);
  if (!vein || !vein.charged) return;
  if (!canWorkVein(vein)) return;
  advanceTimeBlock();
  const ld = VEIN_LEVELS[vein.level];
  const amount = Math.round(rand(ld.yieldCautious[0], ld.yieldCautious[1]) * getVeinYieldMult(vein));
  gameState.player.orichalchum[vein.oreType] = (gameState.player.orichalchum[vein.oreType] || 0) + amount;
  vein.charged = false;
  vein.chargeBlocks = 0;
  checkOreGoal();
  closeModal();
  renderGame();
}

function harvestVeinFull(veinId) {
  const vein = gameState.player.veins.find(v => v.id === veinId);
  if (!vein || !vein.charged) return;
  if (!canWorkVein(vein)) return;
  advanceTimeBlock();
  const ld = VEIN_LEVELS[vein.level];
  const amount = Math.round(rand(ld.yieldFull[0], ld.yieldFull[1]) * getVeinYieldMult(vein));
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
    // recipeKey is also the inventory key for every consumable
    gameState.player.inventory[recipeKey] = (gameState.player.inventory[recipeKey] || 0) + 1;
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
// combatUseDevice is defined in the Combat 2.0 block below.

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
  // A break-in at 3am — no standoff, you've already grabbed the crowbar.
  const enemy = makeCombatant('mugger', { name: 'A raider', hpBonus: 6, atkBonus: 2 });
  beginEncounter({
    context: 'home_raid', enemies: [enemy], onWin: 'homeRaidWon', skipOpener: true,
    intro: `They're in the flat. You've got the crowbar. This is happening.`,
  });
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
    district:     'whitechapel',
    hospitability:{ tier:'fair', bonuses:[] },
    maxLevel:     VEIN_MAX_LEVEL_DEFAULT,
    claimedOnDay: gameState.world.day,
  };
  gameState.player.veins.push(archieVein);
  pushNotification(`Archie's time vein added to your operations. Needs cultivating before first harvest.`);
  pushNotification(`Archie's security contact is available. Check your Property page.`);
  // Straight into the cultivating walkthrough — Archie shows you the vein
  startCultivateTutorial();
}

// === M1: CULTIVATING TUTORIAL EVENT ===
let cultivateTutorialStep = 0;
function startCultivateTutorial() {
  cultivateTutorialStep = 0;
  gameState.currentScreen = 'event_cultivate_tutorial';
  renderGame();
}
function advanceCultivateTutorial() {
  if (cultivateTutorialStep < CULTIVATE_TUTORIAL_CARDS.length) {
    cultivateTutorialStep++;
    renderGame();
    setTimeout(() => { const a = document.querySelector('.event-card-area'); if(a) a.scrollTop = a.scrollHeight; }, 80);
  }
}
function completeCultivateTutorial() {
  gameState.flags.cultivateTutorialSeen = true;
  pushNotification(`The vein's in Whitechapel. Working it from home costs a travel block — plan the day.`);
  gameState.currentScreen = 'veins';
  renderGame();
}
function rewindCultivateTutorial() { cultivateTutorialStep = 0; renderGame(); }

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
    if (key === 'enhancementPowder' && !gameState.flags.enhancementPowderUnlocked) return;
    else if (key !== 'enhancementPowder' && !gameState.flags.craftingUnlocked)    return;
    const target = thresholds[key] || 0;
    if (target === 0) return;
    const r = RECIPES[key];
    const sk = c.craftingSkill || 1;
    const cost = Math.max(1, Math.round(r.baseCalcCost - (sk - 1) * 0.8));
    const getInv = () => gameState.player.inventory[key] || 0;
    const addInv = () => { gameState.player.inventory[key] = (gameState.player.inventory[key] || 0) + 1; };
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
      const yld = Math.round(rand(mn, mx) * getVeinYieldMult(vein));
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
        if (vein.devBar >= ld.devBarMax && vein.level < getVeinMaxLevel(vein)) levelUpVein(vein);
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
  const mq = ss['con_enhancementPowder']||0; if(mq>0) items.push({kind:'consumable',type:'enhancementPowder',qty:mq});
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
  gameState.flags.enhancementPowderUnlocked  = true;
  gameState.contacts.james.relation = (gameState.contacts.james.relation||0) + 1;
  checkOreGoal(); // may immediately queue home raid if player already has 5+ ore
  gameState.currentScreen = 'home'; renderGame();
}

// === JAMES CRAFTING JOB SYSTEM ===
function generateJamesJob() {
  const trust = gameState.contacts.james.relation || 0;
  const recipes = ['timePearl'];
  if (gameState.flags.enhancementPowderUnlocked) recipes.push('enhancementPowder');
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
  const have = job.recipeKey === 'timePearl' ? inv.timePearl : inv.enhancementPowder;
  if (have < job.qty) { openModal('james_job_short', { job, have }); return; }
  // Deduct items and pay
  if (job.recipeKey === 'timePearl')    inv.timePearl    -= job.qty;
  if (job.recipeKey === 'enhancementPowder') inv.enhancementPowder -= job.qty;
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
      gameState.player.inventory[item.type] = Math.max(0, (gameState.player.inventory[item.type] || 0) - item.qty);
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
// ============================================================
// COMBAT 2.0 — negotiation openers + intent-telegraph combat.
// Enemy-count-agnostic: combat.enemies is an array (content 1v1).
// ============================================================

let _combatantId = 0;
function makeCombatant(templateId, opts = {}) {
  const t = ENEMY_TEMPLATES[templateId];
  const hp = rand(t.hpRange[0], t.hpRange[1]) + (opts.hpBonus || 0);
  return {
    id: 'c' + (++_combatantId), templateId, name: opts.name || t.name, tier: t.tier,
    hp, hpMax: hp,
    attackMin: t.attackRange[0] + (opts.atkBonus || 0),
    attackMax: t.attackRange[1] + (opts.atkBonus || 0),
    greed: t.greed, nerve: t.nerve, affinities: { ...t.affinities },
    intents: t.intents, loot: t.loot, flavor: t.flavor,
    intent: null, frozen: 0, enraged: 0, grabbedLoot: null,
    intelKnown: false,
  };
}

// Value an onlooker can see you carrying — sets bribe thresholds and threat tier.
function visibleCarryValue() {
  const p = gameState.player;
  let v = p.cash || 0;
  ORE_TYPE_KEYS.forEach(k => v += (p.orichalchum[k] || 0) * (ORE_TYPES[k].basePrice || 40));
  CONSUMABLE_KEYS.forEach(k => v += (p.inventory[k] || 0) * (CONSUMABLE_PRICES[k] || 40));
  return Math.round(v);
}
function pickThreatTier(dangerMod, carry) {
  let tier = 1;
  if (carry > 350 || dangerMod >= 0.10) tier = 2;
  if ((carry > 1200 && dangerMod >= 0.05) || dangerMod >= 0.18) tier = 3;
  return tier;
}
function pickEnemyOfTier(tier) { return randFrom(TIER_POOLS[tier] || TIER_POOLS[1]); }

function beginEncounter({ context, enemies, veinId = null, veinRef = null, onWin = null, intro, skipOpener = false }) {
  gameState.combat = {
    active: true, context, phase: skipOpener ? 'fight' : 'opener', veinId,
    enemies, log: [intro], outcome: null, onWin, turn: 0,
    player: { shield: 0, evadeTurns: 0, evadeChance: 0, motionTurns: 0, motionPower: 0, strengthNext: 0 },
    snapshots: [], pendingReinforce: null,
  };
  gameState.combat._veinRef = veinRef; // transient (not snapshotted)
  if (skipOpener) telegraphAll();
  closeModal();
  gameState.currentScreen = 'combat';
  renderGame();
}

function startMugging() {
  const dMod = DISTRICTS[gameState.player.currentDistrict || HOME_DISTRICT]?.dangerMod || 0;
  const tier = pickThreatTier(dMod, visibleCarryValue());
  const enemy = makeCombatant(pickEnemyOfTier(tier));
  beginEncounter({
    context: 'mugging', enemies: [enemy], onWin: 'muggingWon',
    intro: `${enemy.name} steps out of nowhere. They want what you're carrying.`,
  });
}
function startRaid(vein) {
  const dMod = DISTRICTS[veinDistrict(vein)]?.dangerMod || 0;
  const tier = Math.min(3, Math.max(1, pickThreatTier(dMod + 0.10, 500) ));
  const enemy = makeCombatant(pickEnemyOfTier(tier), { hpBonus: (vein.level - 1) * 4, atkBonus: vein.level - 1 });
  beginEncounter({
    context: 'raid', enemies: [enemy], veinId: vein.id, veinRef: vein, onWin: 'raidWon',
    intro: `You move in on the vein at ${vein.location}. ${enemy.name} steps out to meet you.`,
  });
}
function muggingWon() {
  const earned = gameState._pendingSaleCut || 0;
  gameState._pendingSaleCut = 0;
  if (earned > 0) gameState.player.cash += earned;
  gameState.combat._saleEarned = earned;
}
function raidWon() {
  const vein = gameState.combat._veinRef;
  if (vein) { vein.npcClaimed = false; vein.claimed = true; vein.guards = 0; vein.guardTemplate = null; gameState.player.veins.push(vein); }
}

// ── NEGOTIATION OPENER (Layer 1) ─────────────────────────────
function primaryEnemy() { return gameState.combat.enemies.find(e => e.hp > 0) || gameState.combat.enemies[0]; }
function factionRelationBackup() {
  // best relation among factions present where you are — a friendly line at your back
  const d = DISTRICTS[gameState.player.currentDistrict || HOME_DISTRICT];
  let best = 0;
  (d?.factionPresence || []).forEach(fid => { if (gameState.factions[fid]?.joined) best = Math.max(best, 40); else best = Math.max(best, getFactionRelation(fid) * 0.3); });
  return best;
}
function talkChance(e) {
  const rep = gameState.player.reputation || 0;
  const base = 0.15 + rep / 200 + factionRelationBackup() / 200 - e.nerve / 300;
  return Math.max(0.05, Math.min(0.9, base));
}
function bribeCost(e) {
  const carry = visibleCarryValue();
  return Math.max(20, Math.round((e.greed / 100) * (40 + carry * 0.04)));
}
function intimidateChance(e) {
  const atk = getAttackRange();
  const rep = gameState.player.reputation || 0;
  const presence = (atk.min + atk.max) / 2 + rep * 0.4 + fieldcraftBonus() * 100;
  const base = 0.15 + (presence - e.nerve) / 80;
  return Math.max(0.05, Math.min(0.92, base));
}
function openerTalk() {
  const c = gameState.combat; if (c.phase !== 'opener') return;
  const e = primaryEnemy();
  awardFieldcraftXP(6);
  if (Math.random() < talkChance(e)) {
    c.outcome = 'talked'; c.phase = 'over';
    c.log.push(`You keep it calm and reasonable. ${e.name} weighs it up — and decides you're more trouble than you're worth.`);
    awardReputation(1);
    e.intelKnown = true;
  } else {
    c.log.push(`${e.name} isn't in a talking mood. "Bit late for chat, mate."`);
    beginFight({ firstStrike: true });
  }
  renderGame();
}
function openerBribe() {
  const c = gameState.combat; if (c.phase !== 'opener') return;
  const e = primaryEnemy();
  const cost = bribeCost(e);
  if ((gameState.player.cash || 0) < cost) { c.log.push(`You can't cover what they'd want (£${cost}).`); renderGame(); return; }
  gameState.player.cash -= cost;
  awardFieldcraftXP(5);
  // Rare low-nerve types take it and swing anyway
  if (e.nerve < 20 && Math.random() < 0.3) {
    c.log.push(`${e.name} pockets the £${cost} — and comes at you anyway. Should've known.`);
    beginFight({ firstStrike: true });
  } else {
    c.outcome = 'bribed'; c.phase = 'over';
    c.log.push(`£${cost} changes hands. ${e.name} melts back into the evening. Transaction complete.`);
  }
  renderGame();
}
function openerIntimidate() {
  const c = gameState.combat; if (c.phase !== 'opener') return;
  const e = primaryEnemy();
  awardFieldcraftXP(7);
  if (Math.random() < intimidateChance(e)) {
    c.outcome = 'intimidated'; c.phase = 'over';
    c.log.push(`You square up and hold their eye. ${e.name} does the maths, comes up short, and leaves.`);
    awardReputation(3);
  } else {
    c.log.push(`${e.name} isn't buying it. If anything, you've annoyed them.`);
    e.enraged = 1;
    beginFight({ firstStrike: true });
  }
  renderGame();
}
function openerFight() { const c = gameState.combat; if (c.phase !== 'opener') return; beginFight({ firstStrike: false }); renderGame(); }

function beginFight({ firstStrike }) {
  const c = gameState.combat;
  c.phase = 'fight';
  telegraphAll();
  if (firstStrike) {
    c.log.push(`They move first.`);
    c.enemies.forEach(e => { if (e.hp > 0) enemyAttackOne(e, 1, false, true); });
    // re-telegraph after the free hit
    c.enemies.forEach(e => { if (e.hp > 0 && e.frozen <= 0) telegraph(e); });
    checkCombatEnd();
  }
}

// ── INTENT TELEGRAPH ─────────────────────────────────────────
function rollIntent(e) {
  const pool = e.intents;
  const total = pool.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const i of pool) { r -= i.w; if (r <= 0) return { ...INTENTS[i.type], ...(i.mult ? { mult: i.mult } : {}) }; }
  return { ...INTENTS.swing };
}
function telegraph(e) { e.intent = rollIntent(e); }
function telegraphAll() { gameState.combat.enemies.forEach(e => { if (e.hp > 0 && e.frozen <= 0) telegraph(e); }); }

// ── PLAYER ACTIONS ───────────────────────────────────────────
function hasManeuver(id) {
  const m = FIELDCRAFT_MANEUVERS[id];
  return m && (gameState.player.fieldcraftSkill || 1) >= m.level;
}
function fieldcraftBonus() { return Math.min(0.12, ((gameState.player.fieldcraftSkill || 1) - 1) * 0.03); }

function combatPlayerAttack() {
  const c = gameState.combat, p = gameState.player;
  if (!c.active || c.outcome || c.phase !== 'fight') return;
  pushCombatSnapshot();
  let attacks = 1;
  if (p.motionTurns > 0) {
    attacks = p.motionPower >= 3 ? 3 : 2;
    c.log.push(`Enhancement powder — you move ${attacks === 3 ? 'three times' : 'twice'} as fast.`);
  }
  for (let i = 0; i < attacks; i++) {
    const tgt = c.enemies.find(e => e.hp > 0);
    if (!tgt) break;
    const atk = getAttackRange();
    let dmg = Math.round(rand(atk.min, atk.max) * (1 + fieldcraftBonus())) + (p.strengthNext || 0);
    const braced = tgt.intent?.id === 'brace';
    if (braced) dmg = hasManeuver('press') ? Math.round(dmg * 1.2) : Math.round(dmg * 0.5);
    tgt.hp = Math.max(0, tgt.hp - dmg);
    c.log.push(`You attack${attacks > 1 ? ` (hit ${i + 1})` : ''} — ${dmg} damage${braced ? (hasManeuver('press') ? ' (Press — through the brace)' : ' (they braced — halved)') : ''}. ${tgt.name}: ${tgt.hp}/${tgt.hpMax}.`);
    if (tgt.hp <= 0) { returnGrabbedLoot(tgt); c.log.push(`${tgt.name} goes down.`); }
  }
  p.strengthNext = 0;
  if (p.motionTurns > 0) { p.motionTurns--; if (p.motionTurns === 0) c.log.push(`The powder wears off. Back to normal speed.`); }
  if (!c.enemies.some(e => e.hp > 0)) { winCombat(); return; }
  enemiesResolve();
  renderGame();
}
function combatFlee() {
  const c = gameState.combat;
  if (!c.active || c.outcome || c.phase !== 'fight') return;
  pushCombatSnapshot();
  const evadeHelp = (gameState.player.motionTurns > 0) ? 0.2 : 0;
  if (Math.random() > 0.35 - evadeHelp) {
    c.outcome = 'fled'; c.phase = 'over';
    c.log.push('You back off sharpish. Probably the right call.');
    awardFieldcraftXP(8);
  } else {
    c.log.push('You try to leg it — they get a parting shot in.');
    c.enemies.forEach(e => { if (e.hp > 0) enemyAttackOne(e, 1, false, true); });
    checkCombatEnd();
  }
  renderGame();
}

// Consumables are free "answers" — they set up your turn; Attack/Blast/Flee end it.
function combatUseTimePearl() {
  const c = gameState.combat, p = gameState.player;
  if (!c.active || c.outcome || c.phase !== 'fight' || (p.inventory.timePearl || 0) <= 0) return;
  const tgt = primaryEnemy();
  if (tgt.frozen > 0) { c.log.push('Already frozen. Save the pearl.'); renderGame(); return; }
  p.inventory.timePearl--;
  const power = getCraftingEffectPower('timePearl');
  tgt.frozen = power; tgt.intent = null;
  c.log.push(`You throw a time pearl at ${tgt.name}. The air goes thick. (${power} turn${power > 1 ? 's' : ''} frozen)`);
  renderGame();
}
function combatUseEnhancement(mode) {
  const c = gameState.combat, p = gameState.player;
  if (!c.active || c.outcome || c.phase !== 'fight' || (p.inventory.enhancementPowder || 0) <= 0) return;
  p.inventory.enhancementPowder--;
  const power = getCraftingEffectPower('enhancementPowder');
  if (mode === 'strength') {
    p.strengthNext = 4 + power * 3;
    c.log.push(`Strength variant — your next hit lands like a bus. (+${p.strengthNext} damage)`);
  } else {
    p.motionPower = power; p.motionTurns = power >= 3 ? 2 : 1;
    c.log.push(`Speed variant — the world slows slightly around you. You feel very fast.`);
  }
  renderGame();
}
function combatUseShield() {
  const c = gameState.combat, p = gameState.player;
  if (!c.active || c.outcome || c.phase !== 'fight' || (p.inventory.shield || 0) <= 0) return;
  p.inventory.shield--;
  const power = getCraftingEffectPower('shield');
  p.shield = Math.max(p.shield, power);
  c.log.push(`You brace a physics shield. Absorbs the next ${power} hit${power > 1 ? 's' : ''}; momentum declines to arrive.`);
  renderGame();
}
function combatUseHeal() {
  const c = gameState.combat, p = gameState.player;
  if (!c.active || c.outcome || c.phase !== 'fight' || (p.inventory.healingBurst || 0) <= 0) return;
  p.inventory.healingBurst--;
  const amt = getCraftingEffectPower('healingBurst');
  p.hp = Math.min(p.hpMax, p.hp + amt);
  c.log.push(`Healing burst — time queues the recovery. +${amt} HP. You: ${p.hp}/${p.hpMax}.`);
  renderGame();
}
function combatUseBlast() {
  const c = gameState.combat, p = gameState.player;
  if (!c.active || c.outcome || c.phase !== 'fight' || (p.inventory.blast || 0) <= 0) return;
  pushCombatSnapshot();
  p.inventory.blast--;
  const tgt = primaryEnemy();
  const dmg = getCraftingEffectPower('blast');
  tgt.hp = Math.max(0, tgt.hp - dmg);
  c.log.push(`💥 Blast — ${dmg} kinetic damage, straight through any brace. ${tgt.name}: ${tgt.hp}/${tgt.hpMax}.`);
  if (tgt.hp <= 0) { returnGrabbedLoot(tgt); c.log.push(`${tgt.name} goes down.`); }
  if (!c.enemies.some(e => e.hp > 0)) { winCombat(); return; }
  enemiesResolve();
  renderGame();
}
function combatUseDevice() {
  const p = gameState.player, c = gameState.combat;
  const deviceId = p.equipment.device;
  if (!deviceId) return;
  const device = p.devicesCompleted.find(d => d.id === deviceId);
  if (!device || getDeviceChargesLeft(device) <= 0) return;
  const dt = DEVICE_TYPES[device.type];
  if (dt.effect === 'freeze') {
    const tgt = primaryEnemy(); if (!tgt) return;
    device.chargesUsedToday++; awardDeviceXP(device, 10);
    const power = RECIPES['timePearl'].effectPower[p.craftingSkill] || 1;
    tgt.frozen += power; tgt.intent = null;
    c.log.push(`You activate the ${dt.name}. ${tgt.name} frozen for ${power} turn${power > 1 ? 's' : ''}.`);
  } else if (dt.effect === 'motion') {
    device.chargesUsedToday++; awardDeviceXP(device, 10);
    const power = RECIPES['enhancementPowder'].effectPower[p.craftingSkill] || 1;
    p.motionTurns += 2; p.motionPower = power;
    c.log.push(`You activate the ${dt.name}. Movement accelerated.`);
  }
  closeModal();
  renderGame();
}
function combatUseItem() {
  const c = gameState.combat;
  if (!c.active || c.outcome || c.phase !== 'fight') return;
  openModal('combat_items', {});
}

// ── ENEMY RESOLUTION ─────────────────────────────────────────
function enemiesResolve() {
  const c = gameState.combat, p = gameState.player;
  c.turn++;
  c.enemies.forEach(e => {
    if (e.hp <= 0) return;
    if (e.frozen > 0) { e.frozen--; if (e.frozen === 0) { c.log.push(`${e.name} shakes off the freeze.`); telegraph(e); } return; }
    resolveIntent(e);
    if (p.hp <= 0) return;
  });
  // Call reinforcement countdown
  if (c.pendingReinforce) {
    c.pendingReinforce.turnsLeft--;
    if (c.pendingReinforce.turnsLeft <= 0) {
      const add = makeCombatant(c.pendingReinforce.templateId);
      telegraph(add);
      c.enemies.push(add);
      c.log.push(`Backup arrives: ${add.name} joins the fight.`);
      c.pendingReinforce = null;
    }
  }
  // Player evade decays per round
  if (p.evadeTurns > 0) { p.evadeTurns--; if (p.evadeTurns === 0) p.evadeChance = 0; }
  // Re-telegraph living, unfrozen enemies for the next exchange
  c.enemies.forEach(e => { if (e.hp > 0 && e.frozen <= 0) telegraph(e); });
  // Remove any that bolted
  c.enemies = c.enemies.filter(e => !e._gone);
  checkCombatEnd();
}
function resolveIntent(e) {
  const c = gameState.combat;
  const intent = e.intent?.id || 'swing';
  switch (intent) {
    case 'brace': c.log.push(`${e.name} stays braced.`); break;
    case 'call':
      if (!c.pendingReinforce) {
        c.pendingReinforce = { turnsLeft: 2, templateId: pickEnemyOfTier(Math.max(1, e.tier - 1)) };
        c.log.push(`${e.name} calls it in. Backup two turns out — end this fast.`);
      } else { enemyAttackOne(e, 1, false); }
      break;
    case 'bolt':
      c.log.push(`${e.name} bolts${e.grabbedLoot ? ` — and keeps what they grabbed` : ''}. Gone.`);
      e._gone = true;
      break;
    case 'grab':  enemyAttackOne(e, 1, true); break;
    case 'heavy': enemyAttackOne(e, e.intent.mult || 2.2, false); break;
    case 'swing': default: enemyAttackOne(e, 1, false); break;
  }
}
function enemyAttackOne(e, mult, isGrab, firstStrike) {
  const c = gameState.combat, p = gameState.player;
  const label = INTENTS[e.intent?.id]?.label?.toLowerCase() || 'hit';
  // Evade
  if (p.evadeTurns > 0 && Math.random() < p.evadeChance) {
    c.log.push(`${e.name} ${label}s — you're not there.`);
    return;
  }
  // Shield absorbs a whole hit and negates contact (so no grab)
  if (p.shield > 0) {
    p.shield--;
    c.log.push(`Your shield eats ${e.name}'s ${label}. (${p.shield} left)`);
    return;
  }
  let dmg = Math.round(rand(e.attackMin, e.attackMax) * mult);
  if (e.enraged) { dmg = Math.round(dmg * 1.3); }
  dmg = resolveDamageToPlayer(dmg, e);
  p.hp = Math.max(0, p.hp - dmg);
  c.log.push(`${e.name} ${firstStrike ? 'gets a free ' + label + ' in' : label + 's'} for ${dmg}. You: ${p.hp}/${p.hpMax}.`);
  if (isGrab && p.hp > 0) doGrab(e);
  if (p.hp <= 0) { loseCombat(); }
}
// Affinity pipeline seam — player affinity profile lands in M3; enemy affinities
// already ride on templates. For now this is a pass-through.
function resolveDamageToPlayer(dmg, e) { return dmg; }
function doGrab(e) {
  const p = gameState.player, c = gameState.combat;
  const loot = e.grabbedLoot || { cash: 0, ore: {} };
  if ((p.cash || 0) > 0) {
    const take = Math.min(p.cash, rand(10, 40));
    p.cash -= take; loot.cash += take;
    c.log.push(`${e.name} snatches £${take} off you.`);
  } else {
    const types = ORE_TYPE_KEYS.filter(k => (p.orichalchum[k] || 0) > 0);
    if (types.length) {
      const k = randFrom(types); const take = Math.min(p.orichalchum[k], rand(2, 8));
      p.orichalchum[k] -= take; loot.ore[k] = (loot.ore[k] || 0) + take;
      c.log.push(`${e.name} grabs ${take} ${ORE_TYPES[k].name}.`);
    }
  }
  e.grabbedLoot = loot;
}
function returnGrabbedLoot(e) {
  if (!e.grabbedLoot) return;
  const p = gameState.player;
  p.cash += e.grabbedLoot.cash || 0;
  Object.entries(e.grabbedLoot.ore || {}).forEach(([k, v]) => p.orichalchum[k] = (p.orichalchum[k] || 0) + v);
  if ((e.grabbedLoot.cash || 0) > 0 || Object.keys(e.grabbedLoot.ore || {}).length) {
    gameState.combat.log.push(`You take your things back off ${e.name}.`);
  }
  e.grabbedLoot = null;
}
function checkCombatEnd() {
  const c = gameState.combat;
  if (c.outcome) return;
  if (!c.enemies.some(e => e.hp > 0 || (!e._gone))) { winCombat(); return; }
  if (!c.enemies.length) { winCombat(); return; }
  if (gameState.player.hp <= 0) { loseCombat(); }
}
function winCombat() {
  const c = gameState.combat;
  if (c.outcome) return;
  c.outcome = 'win'; c.phase = 'over';
  c.log.push(c.context === 'mugging' ? `They're down. You keep what's yours.` : `Down. The vein's yours.`);
  const topTier = Math.max(1, ...c.enemies.map(e => e.tier || 1));
  awardReputation(2 * topTier);
  awardFieldcraftXP(18 + topTier * 6);
  if (c.onWin) window[c.onWin]();
  renderGame();
}
function loseCombat() {
  const c = gameState.combat;
  if (c.outcome) return;
  c.outcome = 'loss'; c.phase = 'over';
  c.log.push(`You're done. You come round somewhere unpleasant.`);
  gameState.player.hp = Math.round(gameState.player.hpMax * 0.3);
  awardFieldcraftXP(6);
  renderGame();
}

// ── FIELDCRAFT & REPUTATION ──────────────────────────────────
function awardFieldcraftXP(amount) {
  const p = gameState.player;
  p.fieldcraftXP = (p.fieldcraftXP || 0) + amount;
  const max = FIELDCRAFT_XP_LEVELS.length - 1;
  while ((p.fieldcraftSkill || 1) < max && p.fieldcraftXP >= FIELDCRAFT_XP_LEVELS[(p.fieldcraftSkill || 1) + 1]) {
    p.fieldcraftSkill = (p.fieldcraftSkill || 1) + 1;
    pushNotification(`Fieldcraft up — now level ${p.fieldcraftSkill}.`);
    const unlocked = Object.values(FIELDCRAFT_MANEUVERS).find(m => m.level === p.fieldcraftSkill);
    if (unlocked) pushNotification(`Maneuver unlocked: ${unlocked.name} — ${unlocked.blurb}`);
  }
}
function awardReputation(amount) {
  const p = gameState.player;
  p.reputation = Math.max(0, Math.min(100, (p.reputation || 0) + amount));
}

// ── SNAPSHOT / REWIND (Combat 2.0) ───────────────────────────
function pushCombatSnapshot() {
  const c = gameState.combat;
  if (!c.enemies) return;
  c.snapshots = (c.snapshots || []).slice(-1); // keep max 2 frames
  c.snapshots.push(JSON.parse(JSON.stringify({
    playerHp: gameState.player.hp,
    playerCash: gameState.player.cash,
    orichalchum: gameState.player.orichalchum,
    inventory: gameState.player.inventory,
    enemies: c.enemies,
    log: c.log,
    player: c.player,
    turn: c.turn,
    pendingReinforce: c.pendingReinforce,
  })));
}
function combatRewind() {
  const c = gameState.combat, p = gameState.player;
  if (!c.active || !(c.snapshots || []).length) return;
  const hasConsumable = (p.inventory.rewind || 0) > 0;
  const devId = p.equipment.device;
  const rewindDev = devId ? (p.devicesCompleted || []).find(d => d.id === devId && DEVICE_TYPES[d.type]?.effect === 'rewind') : null;
  const hasDevice = rewindDev && getDeviceChargesLeft(rewindDev) > 0;
  if (!hasConsumable && !hasDevice) return;
  if (hasConsumable) p.inventory.rewind--;
  else { rewindDev.chargesUsedToday++; awardDeviceXP(rewindDev, 10); }
  const snap = c.snapshots[0];
  c.snapshots = [];
  p.hp = snap.playerHp;
  p.cash = snap.playerCash;
  p.orichalchum = snap.orichalchum;
  p.inventory = snap.inventory;
  c.enemies = snap.enemies;
  c.log = [...snap.log, '⟲ Time unspools. The moment resets. Only you remember.'];
  c.player = snap.player;
  c.turn = snap.turn;
  c.pendingReinforce = snap.pendingReinforce;
  c.outcome = null; c.phase = 'fight';
  c.player.evadeTurns = 2; c.player.evadeChance = 0.5;
  closeModal();
  renderGame();
}

function exitCombat() {
  const c = gameState.combat;
  const outcome = c.outcome, ctx = c.context;
  const saleEarned = c._saleEarned || 0;
  gameState.combat = {
    active: false, context: 'raid', phase: 'opener', veinId: null, enemies: [], log: [], outcome: null,
    onWin: null, turn: 0, player: { shield: 0, evadeTurns: 0, evadeChance: 0, motionTurns: 0, motionPower: 0, strengthNext: 0 }, snapshots: [], pendingReinforce: null,
  };
  if (ctx === 'home_raid') { afterHomeRaidCombat(outcome); return; }
  if (ctx === 'mugging') {
    // Any non-loss resolution means you completed the sale on the walk
    if (outcome !== 'loss') {
      const earned = outcome === 'win' ? saleEarned : (gameState._pendingSaleCut || 0);
      gameState._pendingSaleCut = 0;
      if (outcome !== 'win' && earned > 0) gameState.player.cash += earned;
      openModal('sale_result', { earned, gross: earned * 2, mugged: true });
    } else {
      gameState._pendingSaleCut = 0;
      gameState.currentScreen = 'home';
    }
    renderGame();
    return;
  }
  gameState.currentScreen = outcome === 'win' && ctx === 'raid' ? 'inventory' : 'home';
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

