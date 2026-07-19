// ============================================================
// SAVE SYSTEM
// ============================================================

const SAVE_KEY_PREFIX = 'vein_save_';
const SAVE_VERSION = 2;

// ── VERSIONED SAVE MIGRATION ─────────────────────────────────
// v1 → v2: ore roster change (M1). energy + motion merge into physics; void is
// bought out for cash at its old base price; fate and emotion join the roster.
// motionPowder becomes enhancementPowder throughout. Veins/world gain M1 fields.
function migrateSave(s) {
  const from = s.__version || 1;
  if (from < 2) {
    const renameOre = (bag) => {
      if (!bag) return;
      bag.physics = (bag.physics||0) + (bag.energy||0) + (bag.motion||0);
      delete bag.energy; delete bag.motion;
      if (bag.void) {
        s.player.cash = (s.player.cash||0) + bag.void * 90;
        s.notifications = s.notifications || [];
        s.notifications.push({ id: Date.now()+Math.random(), text: `The void market has quietly ceased to exist. Your ${bag.void} units were bought out at £90 each by a livery company with exceptional lawyers.` });
        delete bag.void;
      }
    };
    renameOre(s.player?.orichalchum);
    renameOre(s.home?.storedOre);
    const mapType = (t) => t==='energy'||t==='motion' ? 'physics' : t==='void' ? 'fate' : t;
    (s.player?.veins||[]).forEach(v => { v.oreType = mapType(v.oreType); });
    if (s.player?.inventory) {
      s.player.inventory.enhancementPowder = (s.player.inventory.enhancementPowder||0) + (s.player.inventory.motionPowder||0);
      delete s.player.inventory.motionPowder;
    }
    if (s.flags && s.flags.motionPowderUnlocked !== undefined) {
      s.flags.enhancementPowderUnlocked = s.flags.motionPowderUnlocked;
      delete s.flags.motionPowderUnlocked;
    }
    (s.player?.devicesInProgress||[]).forEach(d => { if (d.type==='motionDevice') d.type='enhancementDevice'; });
    (s.player?.devicesCompleted ||[]).forEach(d => { if (d.type==='motionDevice') d.type='enhancementDevice'; });
    if (s.jamesJob?.recipeKey === 'motionPowder') { s.jamesJob.recipeKey = 'enhancementPowder'; }
    if (s.labThresholds?.motionPowder !== undefined) {
      s.labThresholds.enhancementPowder = s.labThresholds.motionPowder;
      delete s.labThresholds.motionPowder;
    }
  }
  // M1 field defaults (idempotent — also patches partial saves)
  if (s.player && !s.player.currentDistrict) s.player.currentDistrict = HOME_DISTRICT;
  if (s.world) {
    if (!s.world.sites)  s.world.sites  = [];
    if (!s.world._siteId) s.world._siteId = 1;
  }
  (s.player?.veins||[]).forEach(v => {
    if (!v.district)      v.district      = 'whitechapel';
    if (!v.hospitability) v.hospitability = { tier:'fair', bonuses:[] };
    if (!v.maxLevel)      v.maxLevel      = VEIN_MAX_LEVEL_DEFAULT;
  });
  if (s.flags && s.flags.cultivateTutorialSeen === undefined) {
    // Pre-M1 saves that already own the Archie vein have effectively done the tutorial
    s.flags.cultivateTutorialSeen = !!s.flags.archiePartnerSeen;
  }
  s.__version = SAVE_VERSION;
  return s;
}

function getSaveSlots() {
  const slots = [];
  for (let i = 1; i <= 3; i++) {
    const raw = localStorage.getItem(SAVE_KEY_PREFIX + i);
    if (raw) {
      try {
        const meta = JSON.parse(raw).__meta;
        slots.push({ slot: i, meta, raw });
      } catch(e) { slots.push({ slot: i, meta: null, raw: null }); }
    } else {
      slots.push({ slot: i, meta: null, raw: null });
    }
  }
  return slots;
}

function saveToSlot(slot) {
  const snapshot = JSON.parse(JSON.stringify(gameState));
  snapshot.__meta = {
    savedAt: new Date().toLocaleString('en-GB'),
    day: gameState.world.day,
    cash: gameState.player.cash,
    stage: gameState.flags.tutorialStage,
  };
  localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(snapshot));
  pushNotification('Game saved to slot ' + slot + '.');
  renderGame();
}

function loadFromSlot(slot) {
  const raw = localStorage.getItem(SAVE_KEY_PREFIX + slot);
  if (!raw) return;
  try {
    const loaded = JSON.parse(raw);
    delete loaded.__meta;
    Object.assign(gameState, migrateSave(loaded));
    renderGame();
  } catch(e) {
    pushNotification('Save slot ' + slot + ' appears corrupted. Sorry about that.');
    renderGame();
  }
}

function deleteSlot(slot) {
  localStorage.removeItem(SAVE_KEY_PREFIX + slot);
  renderGame();
}

function exportSave() {
  const snapshot = JSON.parse(JSON.stringify(gameState));
  snapshot.__meta = {
    savedAt: new Date().toLocaleString('en-GB'),
    day: gameState.world.day,
    cash: gameState.player.cash,
  };
  const encoded = btoa(JSON.stringify(snapshot));
  gameState.modal = { type: 'export_save', data: { encoded } };
  renderGame();
}

function importSave() {
  gameState.modal = { type: 'import_save', data: {} };
  renderGame();
}

function doImport(encoded) {
  try {
    const loaded = JSON.parse(atob(encoded.trim()));
    delete loaded.__meta;
    Object.assign(gameState, migrateSave(loaded));
    closeModal();
    renderGame();
  } catch(e) {
    pushNotification('Could not read that save string. Make sure you copied the whole thing.');
    closeModal();
    renderGame();
  }
}

function confirmNewGame() {
  gameState.modal = { type: 'confirm_new_game', data: {} };
  renderGame();
}

function doNewGame() {
  // Clear save state and go to title
  localStorage.removeItem('vein_autosave');
  closeModal();
  // Reset gameState to initial values
  gameState.currentScreen  = 'title';
  gameState.modal          = null;
  gameState.introStep      = 0;
  gameState.jamesStep      = 0;
  gameState.jamesCraftStep = 0;
  gameState.buyerStep      = 0;
  gameState.smsContext     = 'archie_1';
  gameState.smsStep        = 0;
  gameState.smsSentFirst   = false;
  gameState.smsSent2First  = false;
  gameState.smsStep2       = 0;
  gameState.notifications  = [];
  gameState.inventoryTab   = 'ore';
  gameState.__version = SAVE_VERSION;
  gameState.player = {
    name:'Player', cash:40, hp:100, hpMax:100, attackMin:5, attackMax:12,
    currentDistrict:HOME_DISTRICT,
    orichalchum:{}, veins:[], inventory:{timePearl:0, enhancementPowder:0, rewind:0},
    equipment:{weapon:null, device:null}, items:[],
    craftingSkill:1, craftingXP:0,
    cultivatingSkill:1, cultivatingXP:0,
    devicesInProgress:[], devicesCompleted:[],
  };
  gameState.world = { day:1, timeBlock:0, timeBlocksDone:[], blocksSinceReset:0, sites:[], _siteId:1 };
  gameState.home = { tier:'bedsit', security:[], rooms:[], lastRaidDay:0, storedOre:{} };
  gameState.factions = { collective:{relation:0,joined:false,assignedRoom:null}, firm:{relation:0,joined:false,assignedRoom:null}, guild:{relation:0,joined:false,assignedRoom:null}, network:{relation:0,joined:false,assignedRoom:null}, conclave:{relation:0,joined:false,assignedRoom:null} };
  gameState.barometer = { economic:'stable', social:'stable', political:'stable', lastShift:{economic:0,social:0,political:0} };
  gameState.sellState = {};
  gameState.archieChatStep = 0;
  gameState.statsOpen = false;
  gameState.combat = { active:false, context:'raid', veinId:null, enemy:null, log:[], outcome:null, frozenTurns:0, motionTurns:0, motionPower:0, onWin:null, snapshots:[], evadeTurns:0, evadeChance:0 };
  gameState.contacts = { archie:{relation:10,unlocked:true,recruited:false,recruitThreshold:80,craftingSkill:1,craftingXP:0,cultivatingSkill:1,cultivatingXP:0,assignedRoom:null}, james:{relation:0,unlocked:false,recruited:false,recruitThreshold:100,craftingSkill:1,craftingXP:0,cultivatingSkill:1,cultivatingXP:0,assignedRoom:null} };
  gameState.labThresholds    = {};
  gameState.veinStationVeins = [];
  gameState.craftSection     = null;
  gameState.barometerProgress  = null;
  gameState.barometerCooldowns = null;
  gameState.flags = {
    tutorialStage:'collect_ore', metArchie:false, hasDetector:false, hasHarvester:false,
    metJames:false, hasTimePearls:false, buyerEventSeen:false, craftingUnlocked:false,
    jamesCraftEventSeen:false,
    archieCraftChatSeen:false,
    canSellConsumables:false,
  };
  renderGame();
}

