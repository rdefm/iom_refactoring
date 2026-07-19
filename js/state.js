// ============================================================
// STATE
// ============================================================

const gameState = {
  __version:      2,
  currentScreen:  'title',
  modal:          null,
  introStep:      0,
  jamesStep:      0,
  jamesCraftStep: 0,
  archieChatStep:  0,
  buyerStep:      0,
  smsContext:     'archie_1',  // which SMS thread is open
  smsStep:        0,
  smsSentFirst:   false,
  smsSent2First:  false,
  smsStep2:       0,
  player: {
    name:       'Player',
    cash:       40,
    hp:         100,
    hpMax:      100,
    attackMin:  5,
    attackMax:  12,
    currentDistrict: 'shoreditch',
    orichalchum: {},
    veins:       [],
    inventory:      { timePearl: 0, enhancementPowder: 0, rewind: 0 },
    craftingSkill:    1,
    craftingXP:       0,
    cultivatingSkill: 1,
    cultivatingXP:    0,
    equipment:   { weapon: null, device: null },   // null | item id string
    items:       [],                 // array of owned item objects
    craftingSkill:    1,
    craftingXP:       0,
    cultivatingSkill: 1,
    cultivatingXP:    0,
    devicesInProgress: [],   // [{ id, type, progress }]
    devicesCompleted:  [],   // [{ id, type, level, xp, chargesPerDay, chargesUsedToday, lastResetDay }]
  },
  world: {
    day:              1,
    timeBlock:        0,
    timeBlocksDone:   [],
    blocksSinceReset: 0,
    sites:            [],   // discovered, unclaimed prospecting sites
    _siteId:          1,
  },
  home: {
    tier:           'bedsit',
    security:       [],           // array of security upgrade ids installed
    rooms:          [],           // array of room ids installed
    lastRaidDay:    0,
    storedOre:      {},           // ore stored at home (separate from carried)
  },
  factions: {
    collective:{ relation:0, joined:false, assignedRoom:null },
    firm:      { relation:0, joined:false, assignedRoom:null },
    guild:     { relation:0, joined:false, assignedRoom:null },
    network:   { relation:0, joined:false, assignedRoom:null },
    conclave:  { relation:0, joined:false, assignedRoom:null },
  },
  barometer: {
    economic:  'stable',
    social:    'stable',
    political: 'stable',
    lastShift: { economic:0, social:0, political:0 },
  },
  notifications: [],
  inventoryTab:  'ore',
  statsOpen:      false,
  combat: {
    active:       false,
    context:      'raid',  // 'raid' | 'mugging'
    veinId:       null,
    enemy:        null,
    log:          [],
    outcome:      null,
    frozenTurns:  0,
    motionTurns:  0,   // turns of motion powder active
    motionPower:  0,   // attacks per turn while active
    onWin:        null,  // function name string to call on win
    snapshots:    [],   // combat state snapshots for rewind
    evadeTurns:   0,    // turns of evade buff remaining
    evadeChance:  0,    // miss chance per evade turn (0-1)
  },
  contacts: {
    archie: { relation: 10, unlocked: true,  recruited: false, recruitThreshold: 80,  craftingSkill:1, craftingXP:0, cultivatingSkill:1, cultivatingXP:0, assignedRoom:null },
    james:  { relation: 0,  unlocked: false, recruited: false, recruitThreshold: 100, craftingSkill:1, craftingXP:0, cultivatingSkill:1, cultivatingXP:0, assignedRoom:null },
  },
  flags: {
    tutorialStage:          'buyer_event',
    metArchie:              false,
    hasDetector:            false,
    hasHarvester:           false,
    metJames:               false,
    hasTimePearls:          false,
    buyerEventSeen:         false,
    craftingUnlocked:       false,
    jamesCraftEventSeen:    false,
    archieCraftChatSeen:    false,
    canSellConsumables:     false,
    consSoldCount:          0,
    archieMotionEventSeen:  false,
    jamesMotionEventSeen:   false,
    enhancementPowderUnlocked: false,
    cultivateTutorialSeen:  false,
    jamesJobActive:         false,
    _archieMotionPending:   false,
    homeRaidEventPending:   false,
    homeRaidEventSeen:      false,
    homeRaidWon:            false,
    archiePartnerSeen:      false,
    homeUnlocked:           false,
    securityContactUnlocked:false,
  },
  labThresholds:    {},   // { recipeKey: targetQty }
  veinStationVeins: [],   // vein ids to auto-cultivate
  craftSection:     null, // 'consumables' | 'devices' | null — accordion state
  barometerProgress:  null, // initialised on first use — { section: { stateId: 0-100 } }
  barometerCooldowns: null, // { section: { stateId: { push: day, pull: day } } }
};

