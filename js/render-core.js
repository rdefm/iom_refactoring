// ============================================================
// RENDER HELPERS
// ============================================================
function makeEventScreen(eyebrow, time, cards, step, totalCards, onContinue, onComplete, completeLabel, rewindFnName) {
  const allShown  = step >= totalCards;
  const noneShown = step === 0;
  // Render ALL revealed cards — CSS handles overflow/push-up
  const cardsHTML = noneShown
    ? `<div class="event-card visible"><div class="event-card-text">…</div></div>`
    : cards.slice(0, step).map((card, i) => {
        const inner = card.type === 'speaker'
          ? `<div class="speaker-name">${card.speaker}</div><div class="event-card-text">${card.text}</div>`
          : `${card.label ? `<div class="event-card-label">${card.label}</div>` : ''}<div class="event-card-text">${card.text}</div>`;
        return `<div class="event-card ${card.type} visible">${inner}</div>`;
      }).join('');
  const dots = `<div class="progress-dots ec-dots">${Array.from({length:6}).map((_,i)=>`<div class="dot ${step>=Math.ceil((i+1)*totalCards/6)?'active':''}"></div>`).join('')}</div>`;
  const showItemBtn = rewindFnName && !noneShown && hasEventUsableItems();
  const itemBtn = showItemBtn ? `<button class="btn btn-secondary" style="flex-shrink:0;padding:10px 14px;font-size:16px" onclick="openEventItemModal('${rewindFnName}')" title="Use item">⟲</button>` : '';
  const mainBtn = noneShown
    ? `<button class="btn btn-primary" style="flex:1" onclick="${onContinue}()">Begin →</button>`
    : allShown
    ? `<button class="btn btn-primary" style="flex:1" onclick="${onComplete}()">${completeLabel||'Continue →'}</button>`
    : `<button class="btn btn-primary" style="flex:1" onclick="${onContinue}()">Continue →</button>`;
  const bar = `<div class="action-bar visible" style="display:flex;gap:8px">${itemBtn}${mainBtn}</div>`;
  return `<div class="event-screen"><div class="event-header"><div class="event-header-title">${eyebrow}</div><div class="event-header-time">${time}</div></div><div class="event-card-area">${cardsHTML}${dots}</div>${bar}</div>`;
}

// ============================================================
// RENDER: TITLE
// ============================================================
function renderTitleScreen() {
  return `<div class="title-screen">
    <div class="title-hero">
      <div class="title-eyebrow">London · Urban Fantasy</div>
      <div class="title-word">Vein.</div>
      <div class="title-tagline">Source the ore. Mind your veins. Don't get robbed.<br>Easier said than done.</div>
    </div>
    <div class="title-starts">
      <button class="title-start-btn title-start-main" onclick="goToAffinitySelect()">
        <div><div>New Game</div><span class="title-start-label">Tuesday night, Whitechapel</span></div><span style="font-size:18px">›</span>
      </button>
      <button class="title-start-btn title-start-debug" onclick="startDebug()">
        <div><div>Debug Start</div><span class="title-start-label">All flags · £1m · 3 veins · 20× ore · 5 pearls · Crafting Lv3</span></div><span style="font-size:16px;opacity:0.4">›</span>
      </button>
    </div>
    <div class="title-version">prototype v0.7 — M3: The Craft</div>
  </div>`;
}

// ============================================================
// RENDER: AFFINITY SELECT (new game only)
// ============================================================
function renderAffinitySelectScreen() {
  const presetCards = Object.values(AFFINITY_PRESETS).map(preset => `
    <div class="action-card" onclick="previewAffinityPreset('${preset.id}')">
      <div class="action-card-left">
        <div class="action-card-title">${preset.name}</div>
        <div class="action-card-sub">Attuned: ${ORE_TYPES[preset.attuned].symbol} ${ORE_TYPES[preset.attuned].name.replace(' Orichalchum','')} · Resistant: ${ORE_TYPES[preset.resistant].symbol} ${ORE_TYPES[preset.resistant].name.replace(' Orichalchum','')}</div>
      </div>
      <div class="action-card-arrow">›</div>
    </div>`).join('');
  return `<div class="screen-fade-enter" style="flex:1;display:flex;flex-direction:column;">
    <div class="screen-header">
      <div class="screen-header-titles">
        <div class="screen-header-eyebrow">Before you go</div>
        <div class="screen-header-title">Affinity</div>
        <div class="screen-header-sub">Fixed at birth. Pick a stance, or leave it to chance.</div>
      </div>
    </div>
    <div style="flex:1;padding:16px 18px;overflow-y:auto">
      <div style="font-family:var(--font-body);font-size:14px;color:var(--slate);line-height:1.6;margin-bottom:14px">
        Orichalchum runs in the blood before you ever touch a vein. One type sits right with you; one sits wrong. Everything else is neutral.
      </div>
      <div class="section-label">Presets</div>
      ${presetCards}
      <div class="section-label" style="margin-top:14px">Or</div>
      <div class="action-card" onclick="rollAffinityRandom()" style="border-color:var(--amber)">
        <div class="action-card-left">
          <div class="action-card-title">🎲 See what the midwife says</div>
          <div class="action-card-sub">Random roll. Small chance of an allergy — compensated, if it happens.</div>
        </div>
        <div class="action-card-arrow">›</div>
      </div>
    </div>
  </div>`;
}
function renderAffinityPreviewModal(data) {
  if (data.random) {
    const r = gameState._pendingAffinityRoll;
    if (!r) return '';
    const attunedType = Object.keys(r.profile).find(k => r.profile[k] === 'attuned');
    const resistType   = Object.keys(r.profile).find(k => r.profile[k] === 'resistant');
    const allergicType = Object.keys(r.profile).find(k => r.profile[k] === 'allergic');
    return `<div class="modal">
      <div class="modal-title">${r.isAllergic ? '⚠ An allergy.' : 'The roll.'}</div>
      <div class="modal-sub">
        Attuned: <strong>${ORE_TYPES[attunedType].symbol} ${ORE_TYPES[attunedType].name.replace(' Orichalchum','')}</strong><br>
        ${r.isAllergic
          ? `Allergic: <strong>${ORE_TYPES[allergicType].symbol} ${ORE_TYPES[allergicType].name.replace(' Orichalchum','')}</strong> — can't use it on yourself. Cultivating and selling it is fine.<br>Compensated: <strong>+£${r.bonusCash}</strong> starting cash.`
          : `Resistant: <strong>${ORE_TYPES[resistType].symbol} ${ORE_TYPES[resistType].name.replace(' Orichalchum','')}</strong>`}
      </div>
      <div class="modal-actions">
        <button class="btn btn-amber" onclick="confirmAffinityRandom()">Begin →</button>
        <button class="btn btn-secondary" onclick="closeModal()">Roll again later</button>
      </div>
    </div>`;
  }
  const preset = AFFINITY_PRESETS[data.presetId];
  if (!preset) return '';
  return `<div class="modal">
    <div class="modal-title">${preset.name}</div>
    <div class="modal-sub">${preset.blurb}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      <div class="vein-stat"><div class="vein-stat-label">Attuned</div><div class="vein-stat-value">${ORE_TYPES[preset.attuned].symbol} ${ORE_TYPES[preset.attuned].name.replace(' Orichalchum','')}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Resistant</div><div class="vein-stat-value">${ORE_TYPES[preset.resistant].symbol} ${ORE_TYPES[preset.resistant].name.replace(' Orichalchum','')}</div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-amber" onclick="confirmAffinityPreset('${preset.id}')">Begin →</button>
      <button class="btn btn-secondary" onclick="closeModal()">Back</button>
    </div>
  </div>`;
}

// ============================================================
// RENDER: INTRO
// ============================================================
function renderIntroScreen() {
  const allShown  = gameState.introStep >= INTRO_CARDS.length;
  const noneShown = gameState.introStep === 0;
  const cardsHTML = noneShown
    ? `<div class="event-card tension visible"><div class="event-card-label">Tuesday Night</div><div class="event-card-text">Rent is due Friday.</div></div>`
    : INTRO_CARDS.slice(0, gameState.introStep).map(card => {
        const inner = card.type === 'speaker'
          ? `<div class="speaker-name">${card.speaker}</div><div class="event-card-text">${card.text}</div>`
          : `${card.label ? `<div class="event-card-label">${card.label}</div>` : ''}<div class="event-card-text">${card.text}</div>`;
        return `<div class="event-card ${card.type} visible">${inner}</div>`;
      }).join('');
  const dots = `<div class="progress-dots ec-dots">${Array.from({length:6}).map((_,i)=>`<div class="dot ${gameState.introStep>=Math.ceil((i+1)*INTRO_CARDS.length/6)?'active':''}"></div>`).join('')}</div>`;
  const bar = noneShown
    ? `<div class="action-bar visible"><button class="btn btn-primary" onclick="advanceIntro()">Begin →</button></div>`
    : allShown
    ? `<div class="action-bar visible"><button class="btn btn-primary" onclick="completeIntro()">Accept Archie's offer →</button><button class="btn btn-secondary" onclick="completeIntro()">You could really use the money... →</button></div>`
    : `<div class="action-bar visible"><button class="btn btn-primary" onclick="advanceIntro()">Continue →</button></div>`;
  return `<div class="event-screen"><div class="event-header"><div class="event-header-title">London — Day 1</div><div class="event-header-time">22:47</div></div><div class="event-card-area">${cardsHTML}${dots}</div>${bar}</div>`;
}

// ============================================================
// RENDER: HOME
// ============================================================
function renderHomeScreen() {
  const block = TIME_BLOCKS[gameState.world.timeBlock];
  const exh   = isTimeExhausted();
  const ore   = totalOre(gameState.player.orichalchum);
  const p     = gameState.player;
  const atk   = getAttackRange();

  // Home raid event — show as urgent banner
  if (gameState.flags.homeRaidEventPending && !gameState.flags.homeRaidEventSeen) {
    // Show as a persistent action card rather than dismissable notification
  }
  const notifHTML = gameState.notifications.length > 0 ? gameState.notifications.map(n =>
    `<div style="background:#1a1a1a;color:#f0ece2;border-radius:var(--radius);padding:11px 14px;font-family:var(--font-ui);font-size:13px;line-height:1.4;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;animation:slideUp 0.25s ease">
      <span>${n.text}</span>
      <button onclick="dismissNotification(${n.id})" style="background:none;border:none;color:#888;font-size:16px;cursor:pointer;flex-shrink:0;line-height:1;padding:0">✕</button>
    </div>`
  ).join('') : '';

  const todos = getTodoItems();
  const todoHTML = `<div class="todo-card">
    <div class="todo-heading">things to do</div>
    ${todos.map(t => `<div class="todo-item">
      <span class="todo-check">${t.done ? '☑' : '☐'}</span>
      <span class="todo-text ${t.done ? 'done' : ''}">${t.text}</span>
    </div>`).join('')}
  </div>`;

  const hpPct   = Math.round((p.hp / p.hpMax) * 100);
  const nextXP  = CRAFTING_XP_LEVELS[p.craftingSkill + 1] || null;
  const xpPct   = nextXP ? Math.round((p.craftingXP - CRAFTING_XP_LEVELS[p.craftingSkill]) / (nextXP - CRAFTING_XP_LEVELS[p.craftingSkill]) * 100) : 100;
  const weaponId  = p.equipment.weapon;
  const weaponObj = weaponId ? p.items.find(i => i.id === weaponId) : null;
  const weaponDef = weaponObj ? ITEMS[weaponObj.type] : null;
  const open = gameState.statsOpen;

  const statsHTML = `<div class="collapsible-stats">
    <div class="collapsible-stats-header" onclick="toggleStats()">
      <span class="collapsible-stats-title">Your Stats</span>
      <span class="collapsible-stats-arrow ${open ? 'open' : ''}">▾</span>
    </div>
    ${open ? `<div class="collapsible-stats-body">
      <div>
        <div class="stats-section-title">Health</div>
        <div class="stats-card">
          <div class="stats-card-label">HP</div>
          <div class="stats-card-value">${p.hp} <span style="font-family:var(--font-ui);font-size:13px;color:var(--muted)">/ ${p.hpMax}</span></div>
          <div class="bar-wrap" style="margin-top:8px"><div class="bar-fill hp ${hpPct<30?'low':''}" style="width:${hpPct}%"></div></div>
        </div>
      </div>
      <div>
        <div class="stats-section-title">Combat</div>
        <div class="stats-grid">
          <div class="stats-card">
            <div class="stats-card-label">Attack</div>
            <div class="stats-card-value">${atk.min}–${atk.max}</div>
            <div class="stats-card-sub">${weaponDef ? 'w/ ' + weaponDef.name : 'unarmed'}</div>
          </div>
          <div class="stats-card">
            <div class="stats-card-label">Weapon</div>
            <div class="stats-card-value" style="font-size:15px">${weaponDef ? weaponDef.symbol + ' ' + weaponDef.name : '—'}</div>
            <div class="stats-card-sub">${weaponDef ? 'equipped' : 'nothing equipped'}</div>
          </div>
        </div>
      </div>
      <div>
        <div class="stats-section-title">Skills</div>
        <div class="stats-grid">
          <div class="stats-card">
            <div class="stats-card-label">Crafting</div>
            <div class="stats-card-value">${p.craftingSkill}<span style="font-family:var(--font-ui);font-size:13px;color:var(--muted)">/5</span></div>
            <div class="stats-card-sub">${nextXP ? p.craftingXP+'/'+nextXP+' XP' : 'Max'}</div>
            <div class="bar-wrap" style="margin-top:6px"><div class="bar-fill xp" style="width:${xpPct}%"></div></div>
          </div>
          <div class="stats-card">
            <div class="stats-card-label">Cultivating</div>
            <div class="stats-card-value">${p.cultivatingSkill}<span style="font-family:var(--font-ui);font-size:13px;color:var(--muted)">/5</span></div>
            <div class="stats-card-sub">${CULTIVATING_XP_LEVELS[p.cultivatingSkill+1] ? p.cultivatingXP+'/'+CULTIVATING_XP_LEVELS[p.cultivatingSkill+1]+' XP' : 'Max'}</div>
            <div class="bar-wrap" style="margin-top:6px"><div class="bar-fill xp" style="width:${Math.round((p.cultivatingXP-(CULTIVATING_XP_LEVELS[p.cultivatingSkill]||0))/((CULTIVATING_XP_LEVELS[p.cultivatingSkill+1]||p.cultivatingXP+1)-(CULTIVATING_XP_LEVELS[p.cultivatingSkill]||0))*100)}%"></div></div>
          </div>
        </div>
      </div>
      <div>
        <div class="stats-section-title">Operations</div>
        <div class="stats-grid">
          <div class="stats-card">
            <div class="stats-card-label">Veins held</div>
            <div class="stats-card-value">${p.veins.length}</div>
          </div>
          <div class="stats-card">
            <div class="stats-card-label">Ore in stock</div>
            <div class="stats-card-value">${totalOre(p.orichalchum)}<span style="font-family:var(--font-ui);font-size:11px;color:var(--muted)"> u</span></div>
          </div>
        </div>
      </div>
      <div>
        <div class="stats-section-title">Progress</div>
        <div class="save-action" onclick="navigate('save')" style="border-radius:var(--radius);border:1px solid var(--border);margin-top:0">
          <div class="save-action-icon">💾</div>
          <div class="save-action-info">
            <div class="save-action-title">Save &amp; Load</div>
            <div class="save-action-sub">Manage saves · export · new game</div>
          </div>
        </div>
      </div>
    </div>` : ''}
  </div>`;

  return `<div class="home-screen screen-fade-enter">
    <div class="home-header">
      <div class="home-header-city">London · Day ${gameState.world.day}</div>
      <div class="home-header-title">Vein</div>
      <div class="home-header-sub">${exh ? `That's enough for today.` : `It's ${block}. What now?`}</div>
    </div>
    <div class="home-body">
      ${notifHTML}
      <div class="stat-row">
        <div class="stat-card"><div class="stat-label">Cash</div><div class="stat-value">£${p.cash}</div></div>
        <div class="stat-card"><div class="stat-label">Ore</div><div class="stat-value">${ore}<span> u</span></div></div>
        <div class="stat-card"><div class="stat-label">Veins</div><div class="stat-value">${p.veins.length}<span> held</span></div></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;cursor:pointer" onclick="navigate('world')">
        ${['economic','social','political'].map(sec => {
          const state = BAROMETER_STATES[sec][gameState.barometer[sec]];
          return `<span class="pill pill-amber" style="cursor:pointer">${state.label}</span>`;
        }).join('')}
      </div>
      <div>
        <div class="section-label">Today</div>
        <div class="time-bar">${TIME_BLOCKS.map((l,i) => {
          const d = gameState.world.timeBlocksDone.includes(i);
          const c = i === gameState.world.timeBlock && !exh;
          return `<div class="time-block"><div class="time-block-label">${l}</div><div class="time-block-indicator ${d?'past':c?'current':''}"></div></div>`;
        }).join('')}</div>
      </div>
      ${todoHTML}
      <div>
        <div class="section-label">Actions</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${gameState.flags.homeRaidEventPending && !gameState.flags.homeRaidEventSeen ? `
          <div class="action-card" onclick="startHomeRaidEvent()" style="border-color:var(--danger);background:#fdf5f5">
            <div class="action-card-left">
              <div class="action-card-title" style="color:var(--danger)">⚠ Something woke you up</div>
              <div class="action-card-sub">3:14 AM — there's someone in the flat</div>
            </div>
            <div class="action-card-arrow" style="color:var(--danger)">›</div>
          </div>` : ''}

          <div class="action-card" onclick="navigate('veins')">
            <div class="action-card-left"><div class="action-card-title">⛏ Manage Veins</div><div class="action-card-sub">${p.veins.length===0 ? 'No veins claimed yet' : `${p.veins.length} vein${p.veins.length>1?'s':''} · tap to harvest`}</div></div>
            <div class="action-card-arrow">›</div>
          </div>
          <div class="action-card" onclick="doRest()">
            <div class="action-card-left">
              <div class="action-card-title">🛏 Rest until morning</div>
              <div class="action-card-sub">Skips to next day · +${Math.round(p.hpMax * 0.2)} HP${p.hp < p.hpMax ? ` · currently ${p.hp}/${p.hpMax}` : ' · already full'}</div>
            </div>
            <div class="action-card-arrow">›</div>
          </div>
        </div>
      </div>
      ${statsHTML}
    </div>
  </div>`;
}


// ============================================================
// RENDER: VEINS
// ============================================================
function renderVeinsScreen() {
  const veins = gameState.player.veins;
  const p     = gameState.player;

  const veinCards = veins.length === 0
    ? `<div class="card" style="font-family:var(--font-ui);font-size:14px;color:var(--muted);text-align:center;padding:30px 20px">
        No veins yet.<br>Seed one below to get started.
       </div>`
    : veins.map(v => {
        const ore     = ORE_TYPES[v.oreType];
        const ld      = VEIN_LEVELS[v.level];
        const sec     = SECURITY_TIERS.find(s => s.id === v.security);
        const chargePct = Math.round(((v.chargeBlocks||0) / ld.rechargeBlocks) * 100);
        const devPct    = v.level >= 5 ? 100 : Math.min(100, Math.round(((v.devBar||0) / ld.devBarMax) * 100));
        const devAlmost = devPct >= 75 && v.level < 5;
        const vd     = veinDistrict(v);
        const travel = travelBlocksTo(vd);
        return `
          <div class="vein-list-card" onclick="openModal('vein_detail',{veinId:'${v.id}'})">
            <div class="vein-list-card-top">
              <div class="vein-list-name">${ore.symbol} ${ore.name.replace(' Orichalchum','')}</div>
              <div class="vein-list-level">Lv${v.level} · ${v.levelLabel}</div>
            </div>
            <div class="vein-list-meta">
              <span>${v.charged ? '✅ Ready to harvest' : `⏳ Charging`}</span>
              <span>📍 ${DISTRICTS[vd].name}${travel ? ` (+${travel})` : ''}</span>
              <span>🔒 ${sec.label}</span>
            </div>
            <div style="margin-top:7px;display:flex;flex-direction:column;gap:6px">
              <div>
                <div style="display:flex;justify-content:space-between;font-family:var(--font-ui);font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin-bottom:3px">
                  <span>Charge</span>
                  <span>${v.charged ? 'Full' : `${v.chargeBlocks||0}/${ld.rechargeBlocks} blocks`}</span>
                </div>
                <div class="dev-bar-wrap">
                  <div class="dev-bar-fill" style="width:${v.charged ? 100 : chargePct}%;background:${v.charged ? 'var(--success)' : 'var(--amber)'}"></div>
                </div>
              </div>
              <div>
                <div style="display:flex;justify-content:space-between;font-family:var(--font-ui);font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin-bottom:3px">
                  <span>Development</span>
                  <span>${v.level >= 5 ? 'Max level' : `${v.devBar||0}/${ld.devBarMax}`}</span>
                </div>
                <div class="dev-bar-wrap">
                  <div class="dev-bar-fill ${devAlmost?'almost':''}" style="width:${devPct}%"></div>
                </div>
              </div>
            </div>
          </div>`;
      }).join('');



  const cultivatingSkillInfo = `Lv${p.cultivatingSkill} · ${Math.round(getCultivatingSuccessChance()*100)}% success · +${getCultivatingBarGain()} dev/cultivate`;

  return `
    <div class="veins-screen screen-fade-enter">
      <div class="screen-header">
        <button class="screen-header-back" onclick="navigate('home')">‹</button>
        <div class="screen-header-titles">
          <div class="screen-header-eyebrow">Operations</div>
          <div class="screen-header-title">Veins</div>
          <div class="screen-header-sub">${veins.length} active · ${cultivatingSkillInfo}</div>
        </div>
      </div>
      <div class="veins-body">
        ${veinCards}
        <div style="margin-top:8px">
          <div class="action-card" onclick="openModal('seed_vein_pick',{})">
            <div class="action-card-left">
              <div class="action-card-title">🌱 Seed a new vein</div>
              <div class="action-card-sub">${(gameState.world.sites||[]).length ? `${(gameState.world.sites||[]).length} discovered site${(gameState.world.sites||[]).length!==1?'s':''} · ${SEED_ORE_COST} calc + 1 block` : `Prospect a district on the map to discover sites first`}</div>
            </div>
            <div class="action-card-arrow">›</div>
          </div>
          <div class="action-card" onclick="navigate('map')" style="margin-top:6px">
            <div class="action-card-left">
              <div class="action-card-title">🗺 Open the map</div>
              <div class="action-card-sub">Travel · prospect for sites · you're in ${DISTRICTS[gameState.player.currentDistrict||HOME_DISTRICT].name}</div>
            </div>
            <div class="action-card-arrow">›</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ============================================================
// RENDER: INVENTORY
// ============================================================
function renderInventoryScreen() {
  const p = gameState.player;
  const tab = gameState.inventoryTab || 'ore';

  // ORE TAB
  const oreTypes = ORE_TYPE_KEYS.filter(k => (p.orichalchum[k]||0) > 0);
  const oreHTML = oreTypes.length === 0
    ? '<div class="inv-empty">No orichalchum in stock.<br>Get searching.</div>'
    : oreTypes.map(k => {
        const ore = ORE_TYPES[k];
        return `<div class="ore-row">
          <div class="ore-row-symbol">${ore.symbol}</div>
          <div class="ore-row-info">
            <div class="ore-row-name">${ore.name}</div>
            <div class="ore-row-sub">${ore.flavorText}</div>
          </div>
          <div class="ore-row-qty">${p.orichalchum[k]}</div>
        </div>`;
      }).join('');

  // CONSUMABLES TAB
  const consumables = CONSUMABLE_KEYS.filter(k => (p.inventory[k] || 0) > 0);
  const consumTotal = consumables.reduce((s, k) => s + (p.inventory[k] || 0), 0);
  const consumHTML = consumables.length === 0
    ? '<div class="inv-empty">No consumables.<br>Craft some to get started.</div>'
    : consumables.map(k => {
        const r = RECIPES[k];
        return `<div class="item-card">
          <div class="item-card-top"><div class="item-card-icon">${r.symbol}</div><div class="item-card-name">${r.name} ×${p.inventory[k]}</div></div>
          <div class="item-card-desc">${r.description}</div>
        </div>`;
      }).join('');

  // EQUIPMENT TAB
  const equippedWeaponId = p.equipment.weapon;
  const equippedDeviceId = p.equipment.device;
  const ownedItems = p.items || [];
  const devicesCompleted = p.devicesCompleted || [];

  const weaponHTML = ownedItems.length === 0
    ? '<div class="inv-empty" style="margin-bottom:10px">No weapons yet.</div>'
    : ownedItems.map(itemObj => {
        const def = ITEMS[itemObj.type];
        if (!def) return '';
        const isEquipped = equippedWeaponId === itemObj.id;
        return `<div class="item-card ${isEquipped?'equipped':''}" onclick="openModal('item_detail',{itemId:'${itemObj.id}'})">
          <div class="item-card-top">
            <div class="item-card-icon">${def.symbol}</div>
            <div><div class="item-card-name">${def.name} ${isEquipped?'<span class="pill pill-amber">Equipped</span>':''}</div></div>
          </div>
          <div class="item-card-desc">${def.description}</div>
          <div class="item-card-stats"><span class="pill pill-success">+${def.attackBonus.min}–${def.attackBonus.max} attack</span></div>
        </div>`;
      }).join('');

  const combatDevices = devicesCompleted.filter(d => !DEVICE_TYPES[d.type]?.utility);
  const utilityDevices = devicesCompleted.filter(d => DEVICE_TYPES[d.type]?.utility);
  const equippedDevice = equippedDeviceId ? combatDevices.find(d => d.id === equippedDeviceId) : null;
  const unequippedDevices = combatDevices.filter(d => d.id !== equippedDeviceId);

  const deviceSlotHTML = equippedDevice
    ? (() => {
        const dt = DEVICE_TYPES[equippedDevice.type];
        const charges = getDeviceChargesLeft(equippedDevice);
        const xpNext  = DEVICE_XP_LEVELS[equippedDevice.level+1]||null;
        return `<div class="item-card equipped" style="margin-bottom:8px">
          <div class="item-card-top">
            <div class="item-card-icon">${dt.symbol}</div>
            <div>
              <div class="item-card-name">${dt.name} <span class="pill pill-amber">Equipped</span></div>
              <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-top:2px">Lv${equippedDevice.level} · ${charges}/${equippedDevice.chargesPerDay} charges today</div>
            </div>
          </div>
          <div style="margin:8px 0 6px">
            <div style="display:flex;justify-content:space-between;font-family:var(--font-ui);font-size:10px;color:var(--muted);margin-bottom:3px"><span>Device XP</span><span>${equippedDevice.xp}${xpNext?'/'+xpNext:' — max'}</span></div>
            <div class="dev-bar-wrap"><div class="dev-bar-fill" style="width:${xpNext?Math.round(equippedDevice.xp/xpNext*100):100}%"></div></div>
          </div>
          <button class="btn btn-secondary" style="font-size:11px;padding:5px 10px;width:auto" onclick="unequipDevice()">Unequip</button>
        </div>`;
      })()
    : `<div style="font-family:var(--font-ui);font-size:13px;color:var(--muted);padding:10px 0 8px">No device equipped.</div>`;

  const unequippedDeviceHTML = unequippedDevices.length === 0 ? ''
    : unequippedDevices.map(d => {
        const dt = DEVICE_TYPES[d.type];
        const charges = getDeviceChargesLeft(d);
        return `<div class="item-card" style="margin-bottom:8px">
          <div class="item-card-top">
            <div class="item-card-icon">${dt.symbol}</div>
            <div>
              <div class="item-card-name">${dt.name}</div>
              <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-top:2px">Lv${d.level} · ${charges}/${d.chargesPerDay} charges today</div>
            </div>
          </div>
          <button class="btn btn-secondary" style="font-size:11px;padding:5px 10px;width:auto;margin-top:6px" onclick="equipDevice('${d.id}')">Equip</button>
        </div>`;
      }).join('');

  const utilityDeviceHTML = utilityDevices.length === 0 ? '' : `
    <div class="section-label" style="margin:10px 0 6px">Utility devices</div>
    ${utilityDevices.map(d => {
      const dt = DEVICE_TYPES[d.type];
      return `<div class="item-card" style="margin-bottom:8px" onclick="navigate('property')">
        <div class="item-card-top">
          <div class="item-card-icon">${dt.symbol}</div>
          <div><div class="item-card-name">${dt.name} ${d.active?'<span class="pill pill-success">Active</span>':''}</div></div>
        </div>
        <div class="item-card-desc">${dt.description}</div>
        <div style="font-family:var(--font-ui);font-size:11px;color:var(--amber);margin-top:4px">Manage on Your Property →</div>
      </div>`;
    }).join('')}
  `;

  const equipHTML = `
    <div class="section-label" style="margin-bottom:6px">Weapon</div>
    ${weaponHTML}
    <div class="section-label" style="margin:10px 0 6px">Device</div>
    ${deviceSlotHTML}
    ${unequippedDeviceHTML}
    ${utilityDeviceHTML}
    ${devicesCompleted.length === 0 && ownedItems.length === 0 ? '<div class="inv-empty">No equipment yet.</div>' : ''}
  `;

  const tabs = ['ore','consumables','equipment'].map(t =>
    `<button class="inv-tab ${tab===t?'active':''}" onclick="gameState.inventoryTab='${t}';renderGame()">${t==='ore'?'Ore':t==='consumables'?'Consumables':'Equipment'}</button>`
  ).join('');

  const content = tab==='ore' ? oreHTML : tab==='consumables' ? consumHTML : equipHTML;

  return `<div class="inventory-screen screen-fade-enter">
    <div class="screen-header">
      <div class="screen-header-titles">
        <div class="screen-header-eyebrow">Stock</div>
        <div class="screen-header-title">Inventory</div>
        <div class="screen-header-sub">${totalOre(p.orichalchum)} ore · ${consumTotal} consumable${consumTotal!==1?'s':''} · ${ownedItems.length} item${ownedItems.length!==1?'s':''}</div>
      </div>
    </div>
    <div class="inventory-body">
      <div class="inv-tabs">${tabs}</div>
      <div class="inv-section">${content}</div>
    </div>
  </div>`;
}

