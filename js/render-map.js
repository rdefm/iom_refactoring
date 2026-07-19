// ============================================================
// RENDER: LONDON MAP (M1) — occult A-Z, ink on paper
// ============================================================

// Rough geography, phone-portrait friendly. cx/cy are label anchors.
const MAP_LAYOUT = {
  hampstead:   { cx:  72, cy:  62, rx: 52, ry: 34 },
  camden:      { cx: 158, cy:  84, rx: 46, ry: 30 },
  kingsx:      { cx: 232, cy:  98, rx: 40, ry: 27 },
  shoreditch:  { cx: 300, cy: 130, rx: 46, ry: 30 },
  soho:        { cx: 168, cy: 168, rx: 40, ry: 26 },
  city:        { cx: 252, cy: 178, rx: 42, ry: 27 },
  whitechapel: { cx: 322, cy: 196, rx: 44, ry: 29 },
  battersea:   { cx: 138, cy: 268, rx: 50, ry: 30 },
  greenwich:   { cx: 316, cy: 278, rx: 50, ry: 31 },
};

function renderMapScreen() {
  const here = gameState.player.currentDistrict || HOME_DISTRICT;
  const blocksLeftNow = blocksRemaining();

  const blobs = DISTRICT_KEYS.map(id => {
    const d = DISTRICTS[id];
    const L = MAP_LAYOUT[id];
    const isHere = id === here;
    const sites  = districtSites(id);
    const veins  = gameState.player.veins.filter(v => veinDistrict(v) === id);
    const biasArr = d.oreBias ? (Array.isArray(d.oreBias) ? d.oreBias : [d.oreBias]) : [];
    const biasTxt = biasArr.map(t => ORE_TYPES[t].symbol).join('');
    // site glow dots along the bottom of the blob
    const dots = sites.map((s,i) =>
      `<circle cx="${L.cx - (sites.length-1)*6 + i*12}" cy="${L.cy + L.ry - 8}" r="4"
        fill="${s.tier==='barren' ? '#8a8a8a' : '#c8873a'}" opacity="0.9">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite"/>
      </circle>`).join('');
    const veinDots = veins.map((v,i) =>
      `<circle cx="${L.cx - (veins.length-1)*6 + i*12}" cy="${L.cy + L.ry - 20}" r="4" fill="#3a7a52"/>`).join('');
    return `<g onclick="openModal('district',{id:'${id}'})" style="cursor:pointer">
      <ellipse cx="${L.cx}" cy="${L.cy}" rx="${L.rx}" ry="${L.ry}"
        fill="${isHere ? '#fdf0e0' : '#faf8f3'}" stroke="${isHere ? '#c8873a' : '#b8b2a4'}"
        stroke-width="${isHere ? 2.5 : 1.2}" stroke-dasharray="${id==='soho' ? '4 3' : 'none'}"/>
      <text x="${L.cx}" y="${L.cy - 4}" text-anchor="middle"
        font-family="Georgia,serif" font-size="13" fill="#1a1a1a">${d.name}</text>
      <text x="${L.cx}" y="${L.cy + 11}" text-anchor="middle"
        font-family="Georgia,serif" font-size="10" fill="#8a8a8a">${biasTxt || (id==='soho' ? 'market' : 'balanced')}</text>
      ${isHere ? `<text x="${L.cx}" y="${L.cy - L.ry + 12}" text-anchor="middle" font-family="system-ui" font-size="8" font-weight="700" letter-spacing="1" fill="#c8873a">YOU</text>` : ''}
      ${dots}${veinDots}
    </g>`;
  }).join('');

  return `<div class="screen-fade-enter" style="flex:1;display:flex;flex-direction:column;">
    <div class="screen-header">
      <button class="screen-header-back" onclick="navigate('world')">‹</button>
      <div class="screen-header-titles">
        <div class="screen-header-eyebrow">London</div>
        <div class="screen-header-title">The Map</div>
        <div class="screen-header-sub">You're in ${DISTRICTS[here].name} · ${blocksLeftNow} block${blocksLeftNow!==1?'s':''} left today</div>
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:10px 10px 16px">
      <svg viewBox="0 0 390 330" style="width:100%;display:block;background:#f0ece2;border:1px solid var(--border);border-radius:8px">
        <!-- the Thames -->
        <path d="M 0 232 C 70 236, 100 210, 160 214 C 220 218, 232 244, 268 240 C 310 236, 330 222, 390 230"
          fill="none" stroke="#9db4c0" stroke-width="16" stroke-linecap="round" opacity="0.55"/>
        <text x="196" y="238" font-family="Georgia,serif" font-size="9" font-style="italic" fill="#4a5568" opacity="0.8">Thames</text>
        <!-- deep-vein glow, for later -->
        <circle cx="252" cy="182" r="60" fill="#c8873a" opacity="0.05"/>
        ${blobs}
        <text x="8" y="322" font-family="system-ui" font-size="8" fill="#8a8a8a">⬤ site&nbsp;&nbsp;<tspan fill="#3a7a52">⬤</tspan> your vein · acting outside your district costs +1 travel block</text>
      </svg>
      <div style="margin-top:12px">
        <div class="section-label">Districts</div>
        ${DISTRICT_KEYS.map(id => {
          const d = DISTRICTS[id];
          const sites = districtSites(id);
          const veins = gameState.player.veins.filter(v => veinDistrict(v) === id).length;
          const isHere = id === here;
          const bits = [];
          if (veins) bits.push(`${veins} vein${veins>1?'s':''}`);
          if (sites.length) bits.push(`${sites.length} site${sites.length>1?'s':''}`);
          return `<div class="action-card" onclick="openModal('district',{id:'${id}'})" style="margin-bottom:6px${isHere?';border-color:var(--amber)':''}">
            <div class="action-card-left">
              <div class="action-card-title">${d.name} ${isHere?'<span class="pill pill-amber" style="font-size:9px">you are here</span>':''}</div>
              <div class="action-card-sub">${bits.length ? bits.join(' · ') + ' · ' : ''}${d.character}</div>
            </div>
            <div class="action-card-arrow">›</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

// ── DISTRICT DETAIL MODAL ────────────────────────────────────
function renderDistrictModal(data) {
  const d = DISTRICTS[data.id];
  if (!d) return '';
  const here = isPlayerIn(d.id);
  const travel = travelBlocksTo(d.id);
  const blocksNow = blocksRemaining();
  const sites = districtSites(d.id);
  const veins = gameState.player.veins.filter(v => veinDistrict(v) === d.id);
  const biasArr = d.oreBias ? (Array.isArray(d.oreBias) ? d.oreBias : [d.oreBias]) : [];
  const biasTxt = biasArr.length ? biasArr.map(t => `${ORE_TYPES[t].symbol} ${ORE_TYPES[t].name.replace(' Orichalchum','')}`).join(' · ') : 'Balanced';
  const danger = d.dangerMod >= 0.10 ? 'High' : d.dangerMod >= 0.05 ? 'Elevated' : d.dangerMod < 0 ? 'Low' : 'Normal';
  const factions = (d.factionPresence||[]).map(f => FACTIONS[f]?.shortName).filter(Boolean).join(', ');

  const siteRows = sites.map(s => {
    const t = SITE_TIERS[s.tier];
    const bonuses = (s.bonuses||[]).map(b => SITE_BONUSES[b].label).join(' · ');
    const btn = s.natural
      ? `<button class="btn btn-success" style="width:auto;padding:7px 11px;font-size:12px" onclick="claimNaturalVein('${s.id}')">Claim</button>`
      : s.tier === 'barren' ? `<span class="pill pill-danger">Barren</span>`
      : `<button class="btn btn-amber" style="width:auto;padding:7px 11px;font-size:12px" onclick="closeModal();openModal('seed_vein',{siteId:'${s.id}'})">Seed</button>`;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1">
        <div style="font-family:var(--font-ui);font-size:12px;font-weight:600;color:var(--ink)"><span style="color:var(--amber)">${t.label}</span>${s.natural?' · 💠 live vein':''} · ${ORE_TYPES[s.oreBias].symbol} bias</div>
        <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">${s.location}${bonuses?` · <span style="color:var(--amber)">${bonuses}</span>`:''}</div>
      </div>
      ${btn}
    </div>`;
  }).join('');

  const prospectNeed = 1 + travel;
  const canProspect = d.canProspect && blocksNow >= prospectNeed;
  const atCap = sites.length >= d.siteCap && d.siteCap > 0;

  return `<div class="modal" style="max-height:82vh;overflow-y:auto">
    <div class="modal-title">${d.name} ${here ? '<span class="pill pill-amber" style="font-size:10px;vertical-align:middle">you are here</span>' : ''}</div>
    <div class="modal-sub">${d.character}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div class="vein-stat"><div class="vein-stat-label">Ore bias</div><div class="vein-stat-value" style="font-size:12px">${biasTxt}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Street risk</div><div class="vein-stat-value">${danger}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Site capacity</div><div class="vein-stat-value">${d.siteCap === 0 ? 'No veins' : `${sites.length}/${d.siteCap}`}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Presence</div><div class="vein-stat-value" style="font-size:12px">${factions || '—'}</div></div>
    </div>
    ${d.rechargeBonus ? `<div style="font-family:var(--font-ui);font-size:12px;color:var(--amber);margin-bottom:10px">⚡ Veins here recharge +${d.rechargeBonus} block/day.</div>` : ''}
    ${veins.length ? `<div class="section-label">Your veins here</div>${veins.map(v => `
      <div style="font-family:var(--font-ui);font-size:12px;color:var(--slate);padding:5px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="closeModal();openModal('vein_detail',{veinId:'${v.id}'})">
        ${ORE_TYPES[v.oreType].symbol} Lv${v.level} ${v.levelLabel} · ${v.charged?'✅ ready':'⏳ charging'} ›
      </div>`).join('')}` : ''}
    ${sites.length ? `<div class="section-label" style="margin-top:10px">Discovered sites</div>${siteRows}` : ''}
    <div class="modal-actions" style="margin-top:14px">
      ${!here ? `<button class="btn btn-primary" onclick="travelTo('${d.id}')" ${blocksNow >= 1 ? '' : 'disabled'}>
        🚶 Travel here — 1 block${blocksNow < 1 ? ' (no time left)' : ''}
      </button>` : ''}
      ${d.canProspect ? `<button class="btn btn-amber" onclick="prospectDistrict('${d.id}')" ${canProspect ? '' : 'disabled'}>
        ⛏ Prospect — ${prospectNeed} block${prospectNeed>1?'s':''}${travel?' (incl. travel)':''}${atCap ? ' · re-rolls worst site' : ''}${!canProspect && d.canProspect ? ' · no time' : ''}
      </button>` : `<div style="font-family:var(--font-ui);font-size:12px;color:var(--muted);text-align:center;padding:4px">Soho doesn't grow anything. Soho sells.</div>`}
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  </div>`;
}

// ── PROSPECT RESULT MODAL ────────────────────────────────────
function renderProspectResultModal(data) {
  const site = (gameState.world.sites||[]).find(s => s.id === data.siteId);
  if (!site) return '';
  const t = SITE_TIERS[site.tier];
  const d = DISTRICTS[site.district];
  const bonuses = (site.bonuses||[]).map(b => `${SITE_BONUSES[b].label} — ${SITE_BONUSES[b].blurb}`).join('<br>');
  const barren = site.tier === 'barren';
  return `<div class="modal">
    <div class="modal-title">${barren ? 'Nothing here.' : site.natural ? '💠 A live vein.' : 'Site discovered.'}</div>
    <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-bottom:6px">${d.name} · ${site.location}${data.rerolledTier ? ` · replaced the old ${data.rerolledTier.toLowerCase()} site` : ''}</div>
    <div class="modal-sub">
      <strong style="color:${barren?'var(--muted)':'var(--amber)'}">${t.label}.</strong> ${t.blurb}
      ${site.natural ? `<br><strong style="color:var(--success)">It's already alive — a level 1 ${ORE_TYPES[site.oreBias].name} vein, free to claim.</strong>` : ''}
      ${bonuses ? `<br><span style="color:var(--amber)">${bonuses}</span>` : ''}
      ${!barren && !site.natural ? `<br><span style="color:var(--muted)">Local bias: ${ORE_TYPES[site.oreBias].symbol} ${ORE_TYPES[site.oreBias].name.replace(' Orichalchum','')}. Unclaimed sites don't stay unclaimed.</span>` : ''}
    </div>
    <div class="modal-actions">
      ${site.natural ? `<button class="btn btn-success" onclick="claimNaturalVein('${site.id}')">Claim it</button>` : ''}
      ${!barren && !site.natural ? `<button class="btn btn-amber" onclick="closeModal();openModal('seed_vein',{siteId:'${site.id}'})">🌱 Seed it now</button>` : ''}
      <button class="btn btn-secondary" onclick="closeModal()">${barren ? 'Typical' : 'Later'}</button>
    </div>
  </div>`;
}

// ── DISTRICT EVENT MODAL ─────────────────────────────────────
function renderDistrictEventModal(data) {
  const ev = DISTRICT_EVENTS.find(e => e.id === data.eventId);
  if (!ev) return '';
  const e = ev.effect;
  const fxLine = e.kind === 'cash' ? (e.amount >= 0 ? `+£${e.amount}` : `−£${-e.amount}`)
    : e.kind === 'ore' ? `+${e.amount} ${ORE_TYPES[e.type].symbol} ${ORE_TYPES[e.type].name.replace(' Orichalchum','')}`
    : e.kind === 'relation' ? `Relation +${e.amount}`
    : '';
  return `<div class="modal">
    <div class="modal-title">${ev.title}</div>
    <div class="modal-sub" style="font-family:var(--font-body);font-size:15px;line-height:1.6;color:var(--ink)">${ev.text}</div>
    ${fxLine ? `<div style="font-family:var(--font-ui);font-size:15px;font-weight:600;color:${e.kind==='cash'&&e.amount<0?'var(--danger)':'var(--success)'};margin-bottom:14px">${fxLine}</div>` : ''}
    <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal()">On your way</button></div>
  </div>`;
}

// ── CULTIVATING TUTORIAL EVENT SCREEN ────────────────────────
function renderCultivateTutorialScreen() {
  return makeEventScreen(
    `London — Day ${gameState.world.day}`, 'Whitechapel',
    CULTIVATE_TUTORIAL_CARDS, cultivateTutorialStep, CULTIVATE_TUTORIAL_CARDS.length,
    'advanceCultivateTutorial', 'completeCultivateTutorial', 'To the vein →', 'rewindCultivateTutorial'
  );
}
