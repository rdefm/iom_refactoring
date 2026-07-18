// ============================================================
// SAVE SYSTEM
// ============================================================

const SAVE_KEY_PREFIX = 'vein_save_';

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
    Object.assign(gameState, loaded);
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
    Object.assign(gameState, loaded);
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
  gameState.player = {
    name:'Player', cash:40, hp:100, hpMax:100, attackMin:5, attackMax:12,
    orichalchum:{}, veins:[], inventory:{timePearl:0, motionPowder:0, rewind:0},
    equipment:{weapon:null, device:null}, items:[],
    craftingSkill:1, craftingXP:0,
    cultivatingSkill:1, cultivatingXP:0,
    devicesInProgress:[], devicesCompleted:[],
  };
  gameState.world = { day:1, timeBlock:0, timeBlocksDone:[], blocksSinceReset:0 };
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

