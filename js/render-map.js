// ============================================================
// RENDER: LONDON MAP (M1) — tube-map style. Factions run lines;
// their veins are the stops. Your operation is a line too.
// ============================================================

// Beck-ish grid of district zones (x, y, w, h), phone-portrait friendly.
const MAP_ZONES = {
  hampstead:   { x: 14,  y: 30,  w: 106, h: 62 },
  camden:      { x: 134, y: 30,  w: 100, h: 62 },
  kingsx:      { x: 248, y: 30,  w: 126, h: 62 },
  soho:        { x: 48,  y: 128, w: 96,  h: 62 },
  city:        { x: 178, y: 128, w: 96,  h: 62 },
  shoreditch:  { x: 282, y: 110, w: 92,  h: 62 },
  whitechapel: { x: 282, y: 190, w: 92,  h: 62 },
  battersea:   { x: 30,  y: 272, w: 112, h: 62 },
  greenwich:   { x: 250, y: 292, w: 124, h: 62 },
};
const FACTION_LANE = { collective:0, firm:1, guild:2, network:3, conclave:4 };
function zoneCx(z)            { return z.x + z.w / 2; }
function laneY(z, lane)       { return z.y + 14 + lane * 7; }
function playerStopPos(z, i)  { return { x: z.x + 14 + i * 18, y: z.y + z.h - 9 }; }
function siteStopPos(z, i)    { return { x: z.x + z.w - 12 - i * 16, y: z.y + z.h - 9 }; }

// Beck routing: insert dogleg bends so every segment is horizontal,
// vertical, or 45° — the thing that makes a tube map a tube map.
function beckPoints(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = out[out.length - 1], b = pts[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx > 2 && ady > 2 && adx !== ady) {
      if (adx > ady) out.push({ x: b.x - Math.sign(dx) * ady, y: a.y });
      else           out.push({ x: a.x, y: b.y - Math.sign(dy) * adx });
    }
    out.push(b);
  }
  return out;
}
function beckPolyline(pts) { return beckPoints(pts).map(p => `${p.x},${p.y}`).join(' '); }

function renderMapScreen() {
  const here = gameState.player.currentDistrict || HOME_DISTRICT;
  const blocksLeftNow = blocksRemaining();

  // ── faction lines + their vein stops ──
  let linesSVG = '', factionStopsSVG = '';
  Object.entries(FACTION_LINES).forEach(([fid, line]) => {
    const colour = FACTIONS[fid].colour;
    const lane   = FACTION_LANE[fid];
    const pts    = beckPolyline(line.route.map(did => { const z = MAP_ZONES[did]; return { x: zoneCx(z), y: laneY(z, lane) }; }));
    linesSVG += `
      <polyline points="${pts}" fill="none" stroke="${colour}" stroke-width="4.5"
        stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      <polyline points="${pts}" fill="none" stroke="${colour}" stroke-width="16" opacity="0"
        onclick="openModal('faction_detail',{factionId:'${fid}'})" style="cursor:pointer"><title>${FACTIONS[fid].name}</title></polyline>`;
    line.route.forEach(did => {
      const n = (line.veins||{})[did] || 0;
      if (!n) return;
      const z = MAP_ZONES[did]; const cx = zoneCx(z); const y = laneY(z, lane);
      for (let j = 0; j < n; j++) {
        const sx = cx - (n - 1) * 9 + j * 18;
        factionStopsSVG += `<circle cx="${sx}" cy="${y}" r="3.6" fill="#fff" stroke="${colour}" stroke-width="2.2"
          onclick="openModal('faction_detail',{factionId:'${fid}'})" style="cursor:pointer"><title>${FACTIONS[fid].shortName} vein — ${DISTRICTS[did].name}</title></circle>`;
      }
    });
  });

  // ── your operation: a line of your own ──
  const playerStops = [];
  const perDistrictIdx = {};
  gameState.player.veins.forEach(v => {
    const did = veinDistrict(v);
    const z = MAP_ZONES[did]; if (!z) return;
    const i = perDistrictIdx[did] = (perDistrictIdx[did] ?? -1) + 1;
    const p = playerStopPos(z, i);
    playerStops.push({ v, ...p });
  });
  const playerLineSVG = playerStops.length >= 2
    ? `<polyline points="${beckPolyline(playerStops)}" fill="none" stroke="#1a1a1a"
        stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`
    : '';
  const playerStopsSVG = playerStops.map(p => `
    <g onclick="openModal('vein_detail',{veinId:'${p.v.id}'})" style="cursor:pointer">
      <circle cx="${p.x}" cy="${p.y}" r="5" fill="#fff" stroke="#1a1a1a" stroke-width="2.6"/>
      <text x="${p.x + 9}" y="${p.y + 3}" font-family="system-ui" font-size="8" fill="#1a1a1a">${ORE_TYPES[p.v.oreType].symbol}</text>
      <title>Your ${ORE_TYPES[p.v.oreType].name} — Lv${p.v.level}</title>
    </g>`).join('');

  // ── discovered sites: stops under construction ──
  const siteIdx = {};
  const sitesSVG = (gameState.world.sites||[]).map(s => {
    const z = MAP_ZONES[s.district]; if (!z) return '';
    const i = siteIdx[s.district] = (siteIdx[s.district] ?? -1) + 1;
    const p = siteStopPos(z, i);
    const col = s.tier === 'barren' ? '#8a8a8a' : '#c8873a';
    return `<circle cx="${p.x}" cy="${p.y}" r="4.6" fill="none" stroke="${col}" stroke-width="2"
      stroke-dasharray="3 2.4" onclick="openModal('district',{id:'${s.district}'})" style="cursor:pointer">
      <title>${SITE_TIERS[s.tier].label} site — ${DISTRICTS[s.district].name}</title>
      <animateTransform attributeName="transform" type="rotate" from="0 ${p.x} ${p.y}" to="360 ${p.x} ${p.y}" dur="14s" repeatCount="indefinite"/>
    </circle>`;
  }).join('');

  // ── district zones ──
  const zonesSVG = DISTRICT_KEYS.map(id => {
    const d = DISTRICTS[id]; const z = MAP_ZONES[id];
    const isHere = id === here;
    return `<g onclick="openModal('district',{id:'${id}'})" style="cursor:pointer">
      <rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="7"
        fill="${isHere ? '#fdf0e0' : '#faf8f3'}" stroke="${isHere ? '#c8873a' : '#d4cfc4'}" stroke-width="${isHere ? 2.2 : 1}">
        ${isHere ? '<animate attributeName="stroke-opacity" values="1;0.45;1" dur="2s" repeatCount="indefinite"/>' : ''}
      </rect>
      <text x="${z.x + 6}" y="${z.y + 11}" font-family="system-ui" font-size="8.5" font-weight="700"
        letter-spacing="0.6" fill="${isHere ? '#c8873a' : '#1a1a1a'}">${isHere ? '◉ ' : ''}${d.name.toUpperCase()}</text>
      ${isHere ? `<title>You are here</title>` : ''}
    </g>`;
  }).join('');

  const legendChip = (colour, label, dashed) => `
    <span style="display:inline-flex;align-items:center;gap:5px;font-family:var(--font-ui);font-size:10px;color:var(--slate)">
      <span style="width:16px;height:0;border-top:3.5px ${dashed?'dashed':'solid'} ${colour};border-radius:2px"></span>${label}
    </span>`;

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
      <svg viewBox="0 0 390 368" style="width:100%;display:block;background:#fefdfb;border:1px solid var(--border);border-radius:8px">
        ${zonesSVG}
        <!-- the Thames, in the house style -->
        <polyline points="0,258 150,258 200,278 390,278" fill="none" stroke="#b9d2dd" stroke-width="11" stroke-linejoin="round"/>
        <text x="6" y="254" font-family="system-ui" font-size="7.5" font-style="italic" fill="#4a5568" opacity="0.85">River Thames</text>
        ${linesSVG}
        ${playerLineSVG}
        ${factionStopsSVG}
        ${playerStopsSVG}
        ${sitesSVG}
        <text x="8" y="362" font-family="system-ui" font-size="7.5" fill="#8a8a8a">Lines are faction operations. Stops are their veins. Yours is the black one. Mind the gap.</text>
      </svg>
      <div style="display:flex;flex-wrap:wrap;gap:8px 14px;padding:8px 4px 0">
        ${Object.values(FACTIONS).map(f => legendChip(f.colour, f.shortName)).join('')}
        ${legendChip('#1a1a1a','Your operation')}
        ${legendChip('#c8873a','Discovered site', true)}
      </div>
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
    ${(() => {
      const throughHere = Object.entries(FACTION_LINES).filter(([,l]) => l.route.includes(d.id));
      if (!throughHere.length) return '';
      return `<div style="font-family:var(--font-ui);font-size:12px;color:var(--slate);margin-bottom:10px">
        ${throughHere.map(([fid,l]) => {
          const n = (l.veins||{})[d.id] || 0;
          return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px">
            <span style="width:12px;height:0;border-top:3px solid ${FACTIONS[fid].colour};border-radius:2px"></span>
            ${FACTIONS[fid].shortName}${n ? ` · ${n} vein${n>1?'s':''}` : ' · passes through'}</span>`;
        }).join('')}
      </div>`;
    })()}
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
      ${(gameState.player.devicesCompleted||[]).filter(dv => dv.type==='assayGlass').map(dv => {
        const fuel = resolveDeviceFuelCost('fate', DEVICE_TYPES.assayGlass.fuelPerUse);
        const canUse = d.canProspect && (gameState.player.orichalchum.fate||0) >= fuel;
        return `<button class="btn btn-secondary" onclick="useAssayGlass('${dv.id}','${d.id}')" ${canUse?'':'disabled'}>🔍 Assay Glass — preview best site (${fuel} fate)</button>`;
      }).join('')}
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

// ── ASSAY GLASS RESULT MODAL ─────────────────────────────────
function renderAssayResultModal(data) {
  const d = DISTRICTS[data.districtId];
  const t = SITE_TIERS[data.tier];
  return `<div class="modal">
    <div class="modal-title">🔍 The glass clears</div>
    <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-bottom:6px">${d.name}</div>
    <div class="modal-sub">Best prospect right now reads as <strong style="color:var(--amber)">${t.label}</strong>. ${t.blurb}<br><span style="color:var(--muted)">A preview, not a promise — the ground shifts by the time you get a spade in it.</span></div>
    <div class="modal-actions">
      ${d.canProspect ? `<button class="btn btn-amber" onclick="closeModal();prospectDistrict('${d.id}')">⛏ Prospect now</button>` : ''}
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  </div>`;
}
