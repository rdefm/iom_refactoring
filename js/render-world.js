// ============================================================
// RENDER: STATS
// ============================================================
function renderStatsScreen() {
  const p = gameState.player;
  const atk = getAttackRange();
  const hpPct = Math.round((p.hp / p.hpMax) * 100);
  const nextXP = CRAFTING_XP_LEVELS[p.craftingSkill + 1] || null;
  const xpPct  = nextXP ? Math.round((p.craftingXP - CRAFTING_XP_LEVELS[p.craftingSkill]) / (nextXP - CRAFTING_XP_LEVELS[p.craftingSkill]) * 100) : 100;
  const weaponId = p.equipment.weapon;
  const weaponObj = weaponId ? p.items.find(i => i.id === weaponId) : null;
  const weaponDef = weaponObj ? ITEMS[weaponObj.type] : null;
  const rep = p.reputation || 0;
  const fcSkill = p.fieldcraftSkill || 1;
  const fcNext = FIELDCRAFT_XP_LEVELS[fcSkill + 1] || null;
  const fcPrev = FIELDCRAFT_XP_LEVELS[fcSkill] || 0;
  const fcPct = fcNext ? Math.round(((p.fieldcraftXP || 0) - fcPrev) / (fcNext - fcPrev) * 100) : 100;
  const fcBonus = Math.min(0.12, (fcSkill - 1) * 0.03);
  const maneuvers = Object.values(FIELDCRAFT_MANEUVERS).filter(m => fcSkill >= m.level).map(m => m.name).join(', ');

  return `<div class="stats-screen screen-fade-enter">
    <div class="screen-header">
      <button class="screen-header-back" onclick="navigate('world')">‹</button>
      <div class="screen-header-titles">
        <div class="screen-header-eyebrow">You</div>
        <div class="screen-header-title">Stats</div>
        <div class="screen-header-sub">Day ${gameState.world.day} · £${p.cash} cash</div>
      </div>
    </div>
    <div class="stats-body">
      <div>
        <div class="stats-section-title">Health</div>
        <div class="stats-card" style="grid-column:span 2">
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
            <div class="stats-card-sub">${weaponDef ? `w/ ${weaponDef.name}` : 'unarmed'}${fcBonus > 0 ? ` · +${Math.round(fcBonus*100)}% fieldcraft` : ''}</div>
          </div>
          <div class="stats-card">
            <div class="stats-card-label">Reputation</div>
            <div class="stats-card-value">${rep}<span style="font-family:var(--font-ui);font-size:13px;color:var(--muted)">/100</span></div>
            <div class="stats-card-sub">${rep >= 55 ? 'chancers think twice' : rep >= 25 ? 'a name that travels' : 'a nobody, for now'}</div>
            <div class="bar-wrap" style="margin-top:6px"><div class="bar-fill xp" style="width:${rep}%"></div></div>
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
          <div class="stats-card">
            <div class="stats-card-label">Fieldcraft</div>
            <div class="stats-card-value">${fcSkill}<span style="font-family:var(--font-ui);font-size:13px;color:var(--muted)">/5</span></div>
            <div class="stats-card-sub">${fcNext ? p.fieldcraftXP+'/'+fcNext+' XP' : 'Max'}</div>
            <div class="bar-wrap" style="margin-top:6px"><div class="bar-fill xp" style="width:${fcPct}%"></div></div>
          </div>
          <div class="stats-card">
            <div class="stats-card-label">Maneuvers</div>
            <div class="stats-card-value" style="font-size:14px">${maneuvers || '—'}</div>
            <div class="stats-card-sub">${maneuvers ? 'combat unlocks' : 'raise Fieldcraft to unlock'}</div>
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
    </div>
  </div>`;
}

// ============================================================
// RENDER: HOME RAID INTRO
// ============================================================
function renderHomeRaidIntroScreen() {
  const allShown  = homeRaidIntroStep >= HOME_RAID_INTRO_CARDS.length;
  const noneShown = homeRaidIntroStep === 0;
  const cardsHTML = noneShown
    ? `<div class="event-card tension visible"><div class="event-card-label">3:14 AM</div><div class="event-card-text">Something woke you up.</div></div>`
    : HOME_RAID_INTRO_CARDS.slice(0, homeRaidIntroStep).map(card => {
        const inner = `${card.label?`<div class="event-card-label">${card.label}</div>`:''}<div class="event-card-text">${card.text}</div>`;
        return `<div class="event-card ${card.type} visible">${inner}</div>`;
      }).join('');
  const dots = `<div class="progress-dots ec-dots">${Array.from({length:3}).map((_,i)=>`<div class="dot ${homeRaidIntroStep>i?'active':''}"></div>`).join('')}</div>`;
  const showItemBtn = !noneShown && !allShown && hasEventUsableItems();
  const itemBtn = showItemBtn ? `<button class="btn btn-secondary" style="flex-shrink:0;padding:10px 14px;font-size:16px" onclick="openEventItemModal('rewindHomeRaidIntro')">⟲</button>` : '';
  const bar = noneShown
    ? `<div class="action-bar visible"><button class="btn btn-danger" onclick="advanceHomeRaidIntro()">→ Find out what's happening</button></div>`
    : allShown
    ? `<div class="action-bar visible"><button class="btn btn-danger" onclick="beginHomeRaidCombat()">⚔ Face them</button></div>`
    : `<div class="action-bar visible" style="display:flex;gap:8px">${itemBtn}<button class="btn btn-primary" style="flex:1" onclick="advanceHomeRaidIntro()">Continue →</button></div>`;
  return `<div class="event-screen"><div class="event-header"><div class="event-header-title">Your flat — night</div><div class="event-header-time">3:14 AM</div></div><div class="event-card-area">${cardsHTML}${dots}</div>${bar}</div>`;
}

function renderHomeRaidDebriefScreen() {
  const cards    = gameState.flags.homeRaidWon ? HOME_RAID_WIN_CARDS : HOME_RAID_LOSS_CARDS;
  const allShown = homeRaidDebriefStep >= cards.length;
  const noneShown= homeRaidDebriefStep === 0;
  const placeholder = gameState.flags.homeRaidWon
    ? `<div class="event-card resolution visible"><div class="event-card-text">The flat is yours. Archie is on his way.</div></div>`
    : `<div class="event-card tension visible"><div class="event-card-text">You come round. Archie is on his way.</div></div>`;
  const cardsHTML = noneShown ? placeholder
    : cards.slice(0, homeRaidDebriefStep).map(card => {
        const inner = card.type === 'speaker'
          ? `<div class="speaker-name">${card.speaker}</div><div class="event-card-text">${card.text}</div>`
          : `${card.label?`<div class="event-card-label">${card.label}</div>`:''}<div class="event-card-text">${card.text}</div>`;
        return `<div class="event-card ${card.type} visible">${inner}</div>`;
      }).join('');
  const dots = `<div class="progress-dots ec-dots">${Array.from({length:6}).map((_,i)=>`<div class="dot ${homeRaidDebriefStep>=Math.ceil((i+1)*cards.length/6)?'active':''}"></div>`).join('')}</div>`;
  const showItemBtnD = !noneShown && !allShown && hasEventUsableItems();
  const itemBtnD = showItemBtnD ? `<button class="btn btn-secondary" style="flex-shrink:0;padding:10px 14px;font-size:16px" onclick="openEventItemModal('rewindHomeRaidDebrief')">⟲</button>` : '';
  const bar = noneShown
    ? `<div class="action-bar visible"><button class="btn btn-primary" onclick="advanceHomeRaidDebrief()">Begin →</button></div>`
    : allShown
    ? `<div class="action-bar visible"><button class="btn btn-success" onclick="completeHomeRaidDebrief()">Make it official →</button></div>`
    : `<div class="action-bar visible" style="display:flex;gap:8px">${itemBtnD}<button class="btn btn-primary" style="flex:1" onclick="advanceHomeRaidDebrief()">Continue →</button></div>`;
  return `<div class="event-screen"><div class="event-header"><div class="event-header-title">${gameState.flags.homeRaidWon?'You held it together.':'You took a hit.'}</div><div class="event-header-time">Your flat</div></div><div class="event-card-area">${cardsHTML}${dots}</div>${bar}</div>`;
}

// ============================================================
// RENDER: WORLD HUB
// ============================================================
function renderWorldScreen() {
  const b = gameState.barometer;
  const h = gameState.home;
  const tier = HOME_TIERS[h.tier];
  const raidPct = Math.round(getHomeRaidChance() * 100);

  // Barometer summary
  const baroSummary = ['economic','social','political'].map(sec => {
    const state = BAROMETER_STATES[sec][b[sec]];
    const hasFx = Object.keys(state.effects||{}).length > 0;
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-family:var(--font-ui);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin-bottom:2px">${sec}</div>
        <div style="font-family:var(--font-ui);font-size:14px;font-weight:600;color:var(--ink)">${state.label}</div>
      </div>
      <span class="pill ${hasFx?'pill-amber':'pill-success'}">${hasFx?'Active effects':'Neutral'}</span>
    </div>`;
  }).join('');

  // Faction summary
  const joinedFactions = Object.values(FACTIONS).filter(f => gameState.factions[f.id]?.joined);
  const topFactions = Object.values(FACTIONS).sort((a,b) =>
    (gameState.factions[b.id]?.relation||0) - (gameState.factions[a.id]?.relation||0)
  ).slice(0,3);

  return `<div class="screen-fade-enter" style="flex:1;display:flex;flex-direction:column;">
    <div class="screen-header">
      <div class="screen-header-titles">
        <div class="screen-header-eyebrow">London</div>
        <div class="screen-header-title">World</div>
        <div class="screen-header-sub">Day ${gameState.world.day}</div>
      </div>
    </div>
    <div style="flex:1;padding:16px 18px;display:flex;flex-direction:column;gap:14px;overflow-y:auto">

      <!-- THE MAP -->
      <div>
        <div class="section-label">London</div>
        <div class="action-card" onclick="navigate('map')" style="border-color:var(--amber)">
          <div class="action-card-left">
            <div class="action-card-title">🗺 The Map</div>
            <div class="action-card-sub">You're in ${DISTRICTS[gameState.player.currentDistrict||HOME_DISTRICT].name} · ${(gameState.world.sites||[]).length} discovered site${(gameState.world.sites||[]).length!==1?'s':''} · travel, prospect, seed</div>
          </div>
          <div class="action-card-arrow">›</div>
        </div>
      </div>

      <!-- BAROMETER -->
      <div>
        <div class="section-label">Global Barometer</div>
        <div class="card" style="padding:4px 16px" onclick="navigate('barometer')" style="cursor:pointer">
          ${baroSummary}
          <div style="padding:10px 0 2px;font-family:var(--font-ui);font-size:12px;color:var(--amber)">View details & influence actions →</div>
        </div>
      </div>

      <!-- PROPERTY -->
      <div>
        <div class="section-label">Your Property</div>
        <div class="action-card" onclick="navigate('property')">
          <div class="action-card-left">
            <div class="action-card-title">🏠 ${tier.name}</div>
            <div class="action-card-sub">Raid risk: ${raidPct}% · ${h.security.length} security upgrades · ${h.rooms.length} rooms</div>
          </div>
          <div class="action-card-arrow">›</div>
        </div>
      </div>

      <!-- FACTIONS -->
      <div>
        <div class="section-label">Factions ${joinedFactions.length > 0 ? `· Member of ${joinedFactions.map(f=>f.shortName).join(', ')}` : ''}</div>
        ${topFactions.map(f => {
          const rel    = gameState.factions[f.id]?.relation || 0;
          const joined = gameState.factions[f.id]?.joined;
          const pct    = Math.min(100, Math.round(rel / f.joinRelation * 100));
          return `<div class="action-card" onclick="navigate('factions')" style="margin-bottom:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:${f.colour};flex-shrink:0;margin-right:4px"></div>
            <div class="action-card-left" style="margin-left:6px">
              <div class="action-card-title">${f.name} ${joined?'<span class="pill pill-success" style="font-size:10px">Member</span>':''}</div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                <div style="flex:1;background:var(--border);border-radius:3px;height:4px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${f.colour};border-radius:3px"></div></div>
                <span style="font-family:var(--font-ui);font-size:10px;color:var(--muted)">${rel}/${f.joinRelation}</span>
              </div>
            </div>
          </div>`;
        }).join('')}
        <div style="font-family:var(--font-ui);font-size:12px;color:var(--amber);padding:4px 0" onclick="navigate('factions')">View all factions →</div>
      </div>

      <!-- SAVE -->
      <div>
        <div class="section-label">Progress</div>
        <div class="action-card" onclick="navigate('save')">
          <div class="action-card-left"><div class="action-card-title">💾 Save &amp; Load</div><div class="action-card-sub">Manage saves · export · new game</div></div>
          <div class="action-card-arrow">›</div>
        </div>
      </div>

    </div>
  </div>`;
}

// ============================================================
// RENDER: HOME PROPERTY
// ============================================================
function renderPropertyScreen() {
  if (!gameState.flags.homeUnlocked) {
    return `<div class="property-screen screen-fade-enter">
      <div class="screen-header">
        <button class="screen-header-back" onclick="navigate('world')">‹</button>
        <div class="screen-header-titles">
          <div class="screen-header-eyebrow">Your Property</div>
          <div class="screen-header-title">Locked</div>
        </div>
      </div>
      <div class="property-body">
        <div class="card" style="font-family:var(--font-ui);font-size:14px;color:var(--muted);line-height:1.6;text-align:center;padding:30px 20px">
          🔒<br><br>Property upgrades unlock as you progress.<br>Keep sourcing. Keep your head down.
        </div>
      </div>
    </div>`;
  }
  const h    = gameState.home;
  const tier = getHomeTier();
  const next = getNextTier();
  const p    = gameState.player;
  const raidChance = Math.round(getHomeRaidChance() * 100);

  const secDiscount = gameState.flags.securityContactUnlocked ? 0.7 : 1; // 30% off via Archie's contact
  const secHTML = Object.values(HOME_SECURITY).map(sec => {
    const installed  = h.security.includes(sec.id);
    const fullSlots  = h.security.length >= tier.maxSecuritySlots && !installed;
    const adjCost    = Math.round(sec.cost * secDiscount);
    const canAfford  = p.cash >= adjCost;
    const priceLabel = secDiscount < 1 ? `£${adjCost} <span style="text-decoration:line-through;color:var(--muted);font-weight:400">£${sec.cost}</span>` : `£${adjCost}`;
    return `<div class="upgrade-row ${installed?'installed':''}">
      <div class="upgrade-row-info">
        <div class="upgrade-row-name">${installed?'✅ ':''} ${sec.name}</div>
        <div class="upgrade-row-desc">${sec.description}</div>
      </div>
      <div class="upgrade-row-cost">
        ${installed ? 'Installed' : fullSlots ? 'Slots full' : `<button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;width:auto" onclick="addHomeSecurity('${sec.id}')" ${canAfford?'':'disabled'}>${priceLabel}</button>`}
      </div>
    </div>`;
  }).join('');
  const secNote = gameState.flags.securityContactUnlocked
    ? `<div style="font-family:var(--font-ui);font-size:11px;color:var(--success);margin-bottom:8px">✅ Archie's contact — 30% off all security</div>`
    : '';

  const roomsHTML = Object.values(HOME_ROOMS).map(room => {
    const installed = h.rooms.includes(room.id);
    const tierOrder = Object.keys(HOME_TIERS);
    const available = tierOrder.indexOf(tier.id) >= tierOrder.indexOf(room.minTier);
    const full = h.rooms.length >= tier.maxRooms && !installed;
    const canAfford = p.cash >= room.cost;
    return `<div class="upgrade-row ${installed?'installed':''}">
      <div class="upgrade-row-info">
        <div class="upgrade-row-name">${installed?'✅ ':!available?'🔒 ':''} ${room.name}</div>
        <div class="upgrade-row-desc">${room.description}${!available?' Requires '+HOME_TIERS[room.minTier].name+'.':''}</div>
      </div>
      <div class="upgrade-row-cost">
        ${installed ? `<button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;width:auto" onclick="openRoomModal('${room.id}')">Manage →</button>` : !available ? 'Locked' : full ? 'No room' : `<button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;width:auto" onclick="addHomeRoom('${room.id}')" ${canAfford?'':'disabled'}>£${room.cost}</button>`}
      </div>
    </div>`;
  }).join('');

  return `<div class="property-screen screen-fade-enter">
    <div class="screen-header">
      <button class="screen-header-back" onclick="navigate('home')">‹</button>
      <div class="screen-header-titles">
        <div class="screen-header-eyebrow">Your Property</div>
        <div class="screen-header-title">${tier.name}</div>
        <div class="screen-header-sub">Raid risk: ${raidChance}% · ${tier.maxSecuritySlots - h.security.length} security slots · ${tier.maxRooms - h.rooms.length} room slots</div>
      </div>
    </div>
    <div class="property-body">
      <div class="property-tier">
        <div class="property-tier-name">${tier.name}</div>
        <div class="property-tier-desc">${tier.description}</div>
        <div class="property-tier-meta">Daily cost: £${tier.dailyCost} · Tier ${tier.tier}/6</div>
      </div>
      ${next ? `<div>
        <div class="section-label">Upgrade</div>
        <div class="upgrade-row">
          <div class="upgrade-row-info">
            <div class="upgrade-row-name">→ ${next.name}</div>
            <div class="upgrade-row-desc">${next.description}</div>
          </div>
          <div class="upgrade-row-cost"><button class="btn btn-amber" style="padding:6px 12px;font-size:12px;width:auto" onclick="upgradeHome()" ${p.cash>=next.upgradeCost?'':'disabled'}>£${next.upgradeCost.toLocaleString()}</button></div>
        </div>
      </div>` : '<div class="card" style="font-family:var(--font-ui);font-size:13px;color:var(--muted)">Maximum tier reached.</div>'}
      <div><div class="section-label">Security (${h.security.length}/${tier.maxSecuritySlots} slots)</div>${secNote}${secHTML}</div>
      <div><div class="section-label">Rooms (${h.rooms.length}/${tier.maxRooms} slots)</div>${roomsHTML}</div>
    </div>
  </div>`;
}

// ============================================================
// RENDER: FACTIONS
// ============================================================
function renderFactionsScreen() {
  return `<div class="factions-screen screen-fade-enter">
    <div class="screen-header">
      <button class="screen-header-back" onclick="navigate('home')">‹</button>
      <div class="screen-header-titles">
        <div class="screen-header-eyebrow">London Underground</div>
        <div class="screen-header-title">Factions</div>
        <div class="screen-header-sub">Build relations. Join. Use rooms.</div>
      </div>
    </div>
    <div class="factions-body">
      ${Object.values(FACTIONS).map(f => {
        const rel     = getFactionRelation(f.id);
        const joined  = gameState.factions[f.id].joined;
        const relPct  = Math.min(100, Math.round(rel / f.joinRelation * 100));
        return `<div class="faction-card" onclick="openModal('faction_detail',{factionId:'${f.id}'})">
          <div class="faction-card-top">
            <div class="faction-dot" style="background:${f.colour}"></div>
            <div class="faction-name">${f.name}</div>
            ${joined ? '<span class="pill pill-success">Member</span>' : ''}
          </div>
          <div class="faction-tag">${f.tagline}</div>
          <div class="faction-meta">
            <div class="relation-bar-wrap"><div class="relation-bar-fill" style="width:${relPct}%;background:${f.colour}"></div></div>
            <div class="relation-label">${rel} / ${f.joinRelation}</div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ============================================================
// RENDER: BAROMETER
// ============================================================
function renderBarometerScreen() {
  ensureBarometerInit();
  const sections = ['economic','social','political'];
  const labels   = { economic:'Economic', social:'Social', political:'Political' };
  const sectionHTML = sections.map(sec => {
    const stateId = gameState.barometer[sec];
    const state   = BAROMETER_STATES[sec][stateId];
    const bp      = gameState.barometerProgress[sec];
    const fx      = state.effects || {};
    const chips   = Object.entries(fx).map(([k,v]) => {
      const pos = v > 0;
      const lbls = { orePrice:'Ore prices', mugChance:'Mugging risk', dailyCost:'Daily costs', searchFind:'Search chance', homeRaid:'Home raid risk', timePremium:'Time premium', physicsPremium:'Physics premium', lifePremium:'Life premium', fatePremium:'Fate premium', emotionPremium:'Emotion premium', effectMod:'Effect modifier' };
      return `<span class="effect-chip ${pos?'neg':'pos'}">${lbls[k]||k} ${(pos?'+':'')+Math.round(v*100)}%</span>`;
    });
    // Show mini-bars for non-active states that have any progress
    const buildingStates = Object.entries(bp)
      .filter(([id,v]) => id !== stateId && v > 0)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,2)
      .map(([id,v]) => `<span style="font-family:var(--font-ui);font-size:10px;color:var(--muted)">${BAROMETER_STATES[sec][id].label} ${v}%</span>`);
    return `<div class="barometer-section" onclick="openBarometerSection('${sec}')" style="cursor:pointer;user-select:none">
      <div class="barometer-section-header">
        <span class="barometer-section-name">${labels[sec]}</span>
        <span class="barometer-state-label">${state.label} <span style="font-size:10px;color:var(--muted)">›</span></span>
      </div>
      <div class="barometer-state-desc">${state.description}</div>
      ${chips.length ? `<div class="barometer-effects">${chips.join('')}</div>` : ''}
      ${buildingStates.length ? `<div style="margin-top:6px;display:flex;gap:8px">Building: ${buildingStates.join(' · ')}</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="barometer-screen screen-fade-enter">
    <div class="screen-header">
      <button class="screen-header-back" onclick="navigate('home')">‹</button>
      <div class="screen-header-titles">
        <div class="screen-header-eyebrow">World State</div>
        <div class="screen-header-title">Barometer</div>
        <div class="screen-header-sub">Tap a section to see all states and influence options.</div>
      </div>
    </div>
    <div class="barometer-body">
      ${sectionHTML}
    </div>
  </div>`;
}

function openBarometerSection(section) { openModal('barometer_section', { section }); }

// ============================================================
// RENDER: FACTION DETAIL MODAL
// ============================================================
function renderFactionDetailModal(data) {
  const f      = FACTIONS[data.factionId];
  if (!f) return '';
  const fState = gameState.factions[f.id];
  const rel    = fState.relation;
  const joined = fState.joined;
  const canJoin = canJoinFaction(f.id);
  return `<div class="modal">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <div style="width:16px;height:16px;border-radius:50%;background:${f.colour};flex-shrink:0"></div>
      <div class="modal-title" style="margin:0">${f.name}</div>
      ${joined?'<span class="pill pill-success">Member</span>':''}
    </div>
    <div style="font-family:var(--font-ui);font-size:12px;color:var(--amber);font-style:italic;margin-bottom:10px">${f.tagline}</div>
    <div class="modal-sub">${f.description}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      ${f.industries.map(i=>`<span class="pill pill-amber">${i}</span>`).join('')}
    </div>
    <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-bottom:6px">Relation: ${rel} / ${f.joinRelation} to join</div>
    <div class="bar-wrap" style="margin-bottom:16px"><div class="bar-fill" style="width:${Math.min(100,Math.round(rel/f.joinRelation*100))}%;background:${f.colour}"></div></div>
    <div class="modal-actions">
      ${canJoin ? `<button class="btn btn-success" onclick="joinFaction('${f.id}')">Join ${f.name}</button>` : joined ? '' : `<button class="btn btn-secondary" disabled>Need ${f.joinRelation - rel} more relation</button>`}
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  </div>`;
}

// ============================================================
// RENDER: SAVE / LOAD
// ============================================================
function renderSaveScreen() {
  const slots = getSaveSlots();
  const slotsHTML = slots.map(s => {
    const filled = s.meta !== null;
    return `<div class="save-slot">
      <div class="save-slot-info">
        <div class="save-slot-name">Slot ${s.slot}</div>
        <div class="save-slot-meta">${filled ? 'Day ' + s.meta.day + ' · £' + s.meta.cash + ' · ' + s.meta.savedAt : 'Empty'}</div>
      </div>
      <div class="save-slot-actions">
        <button class="save-slot-btn save" onclick="saveToSlot(${s.slot})">Save</button>
        ${filled ? `<button class="save-slot-btn load" onclick="loadFromSlot(${s.slot})">Load</button>` : ''}
        ${filled ? `<button class="save-slot-btn del" onclick="deleteSlot(${s.slot})">✕</button>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<div class="save-screen screen-fade-enter">
    <div class="screen-header">
      <button class="screen-header-back" onclick="navigate('world')">‹</button>
      <div class="screen-header-titles">
        <div class="screen-header-eyebrow">Progress</div>
        <div class="screen-header-title">Save &amp; Load</div>
      </div>
    </div>
    <div class="save-body">
      <div class="section-label">Save slots</div>
      ${slotsHTML}
      <div class="save-note">Saves are stored in this browser. Clearing site data will delete them.</div>

      <div class="section-label" style="margin-top:8px">Portable save</div>
      <div class="save-action" onclick="exportSave()">
        <div class="save-action-icon">📤</div>
        <div class="save-action-info">
          <div class="save-action-title">Export save string</div>
          <div class="save-action-sub">Copy a text string you can paste back later</div>
        </div>
      </div>
      <div class="save-action" onclick="importSave()">
        <div class="save-action-icon">📥</div>
        <div class="save-action-info">
          <div class="save-action-title">Import save string</div>
          <div class="save-action-sub">Paste a previously exported save</div>
        </div>
      </div>

      <div class="section-label" style="margin-top:8px">Danger zone</div>
      <div class="save-action danger" onclick="confirmNewGame()">
        <div class="save-action-icon">🗑</div>
        <div class="save-action-info">
          <div class="save-action-title">New game</div>
          <div class="save-action-sub">Wipe progress and return to the start screen</div>
        </div>
      </div>
      <div>
        <div class="stats-section-title">Progress</div>
        <div class="save-action" onclick="navigate('save')" style="border-radius:var(--radius);border:1px solid var(--border)">
          <div class="save-action-icon">💾</div>
          <div class="save-action-info">
            <div class="save-action-title">Save &amp; Load</div>
            <div class="save-action-sub">Manage saves · export · new game</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

