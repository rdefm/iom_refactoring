// ============================================================
// RENDER: CRAFTING SCREEN
// ============================================================
function renderCraftingScreen() {
  const p=gameState.player, sk=p.craftingSkill, xp=p.craftingXP;
  const nextLvl=CRAFTING_XP_LEVELS[sk+1]||null;
  const xpPct=nextLvl?Math.round((xp-CRAFTING_XP_LEVELS[sk])/(nextLvl-CRAFTING_XP_LEVELS[sk])*100):100;
  const section = gameState.craftSection;

  // ── CONSUMABLES ───────────────────────────────────────────
  const recipesHTML = Object.entries(RECIPES).map(([key,r]) => {
    const cost=getCraftingCalcCost(key), chance=getCraftingSuccessChance(key), power=getCraftingEffectPower(key);
    const canMake=canCraft(key);
    const stock = key==='timePearl' ? (p.inventory.timePearl||0) : key==='enhancementPowder' ? (p.inventory.enhancementPowder||0) : (p.inventory.rewind||0);
    const ingredientsHTML=r.ingredients.map(ing=>{
      const have=p.orichalchum[ing.type]||0, ok=have>=cost;
      return `<div class="recipe-ingredient"><span class="recipe-ingredient-name">${ORE_TYPES[ing.type].symbol} ${ORE_TYPES[ing.type].name}</span><span class="recipe-ingredient-qty ${ok?'ok':'missing'}">${have}/${cost}</span></div>`;
    }).join('');
    return `<div class="recipe-card">
      <div class="recipe-card-header">
        <div class="recipe-name">${r.symbol} ${r.name}</div>
        <span class="pill ${canMake?'pill-success':'pill-danger'}">${canMake?'Can craft':'Missing calc'}</span>
      </div>
      <div class="recipe-body">
        <div class="recipe-desc">${r.description}</div>
        <div class="section-label">Ingredients (at Skill ${sk})</div>
        <div class="recipe-ingredients">${ingredientsHTML}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
          <div class="vein-stat"><div class="vein-stat-label">Success</div><div class="vein-stat-value">${Math.round(chance*100)}%</div></div>
          <div class="vein-stat"><div class="vein-stat-label">Effect</div><div class="vein-stat-value">${power} turn${power>1?'s':''}</div></div>
          <div class="vein-stat"><div class="vein-stat-label">Stock</div><div class="vein-stat-value">${stock}</div></div>
        </div>
        <button class="btn ${canMake?'btn-amber':'btn-secondary'}" onclick="${canMake?`attemptCraft('${key}')`:'null'}" ${canMake?'':'disabled'}>Craft one</button>
      </div>
    </div>`;
  }).join('');

  // ── DEVICES ───────────────────────────────────────────────
  const inProgress = p.devicesInProgress || [];
  const inProgressHTML = inProgress.length === 0
    ? `<div style="font-family:var(--font-ui);font-size:13px;color:var(--muted);padding:4px 0 10px">No devices in progress.</div>`
    : inProgress.map(d => {
        const dt   = DEVICE_TYPES[d.type];
        const cost = getDeviceCalcCost(d.type);
        const have = p.orichalchum[dt.calcType]||0;
        const canAttempt = have >= cost;
        const pct  = Math.round(d.progress);
        return `<div class="recipe-card" style="margin-bottom:10px">
          <div class="recipe-card-header">
            <div class="recipe-name">${dt.symbol} ${dt.name}</div>
            <span class="pill ${pct>=75?'pill-success':'pill-amber'}">${pct}%</span>
          </div>
          <div class="recipe-body">
            <div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;font-family:var(--font-ui);font-size:10px;color:var(--muted);margin-bottom:3px">
                <span>Progress — +5% success / −2.5% fail</span><span>${pct}/100</span>
              </div>
              <div class="dev-bar-wrap"><div class="dev-bar-fill ${pct>=75?'almost':''}" style="width:${pct}%"></div></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
              <div class="vein-stat"><div class="vein-stat-label">Cost per attempt</div><div class="vein-stat-value">${cost} ${ORE_TYPES[dt.calcType].symbol}</div></div>
              <div class="vein-stat"><div class="vein-stat-label">You have</div><div class="vein-stat-value ${canAttempt?'':'danger'}">${have}</div></div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn ${canAttempt?'btn-amber':'btn-secondary'}" style="flex:1" onclick="attemptDeviceBuild('${d.id}')" ${canAttempt?'':'disabled'}>Attempt</button>
              <button class="btn btn-secondary" style="padding:8px 12px;font-size:12px" onclick="if(confirm('Abandon this device?'))abandonDevice('${d.id}')">✕</button>
            </div>
          </div>
        </div>`;
      }).join('');

  const availableTypes = Object.values(DEVICE_TYPES).filter(dt => gameState.flags[dt.unlockFlag]);
  const startNewHTML = availableTypes.length === 0
    ? `<div style="font-family:var(--font-ui);font-size:12px;color:var(--muted)">No device types unlocked yet.</div>`
    : `<div class="section-label" style="margin-bottom:8px">Start a new device</div>
       ${availableTypes.map(dt => {
         const cost = getDeviceCalcCost(dt.id);
         const have = p.orichalchum[dt.calcType]||0;
         const ok   = have >= cost;
         return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid var(--border)">
           <div>
             <div style="font-family:var(--font-ui);font-size:13px;font-weight:600">${dt.symbol} ${dt.name}</div>
             <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">${dt.description}</div>
             <div style="font-family:var(--font-ui);font-size:11px;color:${ok?'var(--slate)':'var(--danger)'};margin-top:2px">${cost} ${ORE_TYPES[dt.calcType].name} per attempt · have ${have}</div>
           </div>
           <button class="btn ${ok?'btn-amber':'btn-secondary'}" style="margin-left:12px;white-space:nowrap" onclick="startDevice('${dt.id}')" ${ok?'':'disabled'}>Begin</button>
         </div>`;
       }).join('')}`;

  const devicesHTML = `${inProgressHTML}${startNewHTML}`;

  // ── ACCORDION HELPERS ─────────────────────────────────────
  const accordion = (id, label, count, content) => {
    const open = section === id;
    return `<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:10px">
      <div onclick="gameState.craftSection=gameState.craftSection==='${id}'?null:'${id}';renderGame()"
           style="display:flex;justify-content:space-between;align-items:center;padding:13px 14px;cursor:pointer;background:var(--card-bg)">
        <div style="font-family:var(--font-ui);font-size:14px;font-weight:700">${label}</div>
        <div style="display:flex;align-items:center;gap:8px">
          ${count!==null?`<span style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">${count}</span>`:''}
          <span style="font-size:12px;color:var(--muted);transform:rotate(${open?'90':'0'}deg);display:inline-block;transition:transform 0.15s">›</span>
        </div>
      </div>
      ${open?`<div style="padding:12px 14px;border-top:1px solid var(--border)">${content}</div>`:''}
    </div>`;
  };

  return `<div class="crafting-screen screen-fade-enter">
    <div class="screen-header"><button class="screen-header-back" onclick="navigate('home')">‹</button><div class="screen-header-titles"><div class="screen-header-eyebrow">Workshop</div><div class="screen-header-title">Crafting</div><div class="screen-header-sub">Skill ${sk}${nextLvl?` · ${xp}/${nextLvl} XP`:' · Max level'}</div></div></div>
    <div class="crafting-body">
      <div>
        <div class="skill-bar-row"><span class="skill-bar-label">Crafting XP</span><span class="skill-bar-value">${xp} XP</span></div>
        <div class="bar-wrap"><div class="bar-fill xp" style="width:${xpPct}%"></div></div>
      </div>
      ${accordion('consumables','Consumables', Object.keys(RECIPES).length + ' recipes', recipesHTML)}
      ${accordion('devices','Devices', inProgress.length > 0 ? inProgress.length + ' in progress' : null, devicesHTML)}
    </div>
  </div>`;
}

// ============================================================
// RENDER: COMBAT
// ============================================================
function renderCombatScreen() {
  const c = gameState.combat, p = gameState.player;
  const logHTML = c.log.slice(-7).map(line => {
    const cls = /^You attack|Blast|pearl|shield|Strength|Speed|Healing|Press|take your things/i.test(line) ? 'player-hit'
      : /for \d+\.|free |grabs|snatches|bolts|Backup/i.test(line) ? 'enemy-hit' : 'info';
    return `<div class="combat-log-line ${cls}">${line}</div>`;
  }).join('');
  return renderCombat2(c, p, logHTML);
}
function renderCombat2(c, p, logHTML) {
  const pPct = Math.round((p.hp / p.hpMax) * 100);
  const ps = c.player || {};
  const eyebrow = c.context === 'mugging' ? 'Mugging' : c.context === 'home_raid' ? 'Break-in' : c.context === 'vein_raid' ? 'Vein Raid' : 'Raid';
  const primary = (c.enemies || []).find(e => e.hp > 0) || (c.enemies || [])[0];
  const liveCount = (c.enemies || []).filter(e => e.hp > 0).length;

  const pChips = [];
  if (ps.shield > 0)       pChips.push(`SHIELD x${ps.shield}`);
  if (ps.motionTurns > 0)  pChips.push(`Fast (${ps.motionTurns})`);
  if (ps.strengthNext > 0) pChips.push(`+${ps.strengthNext} next hit`);
  if (ps.evadeTurns > 0)   pChips.push(`Evade (${ps.evadeTurns})`);
  const pChipHTML = pChips.length ? `<div class="combatant-status" style="color:var(--success)">${pChips.join(' - ')}</div>` : '';

  const enemyCards = (c.enemies || []).filter(e => e.hp > 0).map(e => {
    const ePct = Math.round((e.hp / e.hpMax) * 100);
    const intent = e.intent;
    const intentHTML = e.frozen > 0
      ? `<div class="intent-row" style="border-color:#7b68ee"><span class="intent-icon">&#9203;</span><div><div class="intent-label">Frozen (${e.frozen})</div><div class="intent-line">Not going anywhere.</div></div></div>`
      : intent
      ? `<div class="intent-row"><span class="intent-icon">${intent.icon}</span><div><div class="intent-label">${intent.label}${intent.mult ? ` x${intent.mult}` : ''}</div><div class="intent-line">${intent.line}</div></div></div><div class="intent-answer">&#8627; ${intent.answers}</div>`
      : '';
    return `<div class="combatant-card enemy">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div class="combatant-name">${e.name} <span class="pill" style="font-size:9px;background:#efe9dd;color:var(--slate)">T${e.tier}</span></div>
        ${e.grabbedLoot ? `<span style="font-size:11px;color:var(--danger)">has your stuff</span>` : ''}
      </div>
      <div class="combatant-hp">${e.hp} / ${e.hpMax} HP</div>
      <div class="bar-wrap"><div class="bar-fill hp ${ePct < 30 ? 'low' : ''}" style="width:${ePct}%"></div></div>
      ${c.phase === 'fight' ? intentHTML : ''}
    </div>`;
  }).join('');

  let bar = '';
  if (c.phase === 'opener' && primary) {
    const e = primary;
    const bribe = bribeCost(e), canBribe = (p.cash || 0) >= bribe;
    bar = `<div class="combat-actions" style="grid-template-columns:1fr 1fr">
      <button class="btn btn-secondary" onclick="openerTalk()">Talk<span style="display:block;font-size:11px;opacity:0.7">${Math.round(talkChance(e) * 100)}% - free</span></button>
      <button class="btn btn-secondary" onclick="openerBribe()" ${canBribe ? '' : 'disabled'}>Bribe<span style="display:block;font-size:11px;opacity:0.7">&pound;${bribe}${canBribe ? '' : ' - short'}</span></button>
      <button class="btn btn-secondary" onclick="openerIntimidate()">Intimidate<span style="display:block;font-size:11px;opacity:0.7">${Math.round(intimidateChance(e) * 100)}%</span></button>
      <button class="btn btn-danger" onclick="openerFight()">Fight<span style="display:block;font-size:11px;opacity:0.7">start it</span></button>
    </div>`;
  } else if (c.phase === 'fight' && !c.outcome) {
    const dev = p.equipment.device ? (p.devicesCompleted || []).find(d => d.id === p.equipment.device) : null;
    const hasItems = ['timePearl','enhancementPowder','blast','shield','healingBurst','rewind'].some(k => (p.inventory[k] || 0) > 0) || (dev && getDeviceChargesLeft(dev) > 0);
    bar = `<div class="combat-actions"><button class="btn btn-danger" onclick="combatPlayerAttack()">Attack</button><button class="btn btn-secondary" onclick="combatUseItem()" ${hasItems ? '' : 'disabled'}>Item</button><button class="btn btn-secondary" onclick="combatFlee()">Run</button></div>`;
  } else if (c.outcome) {
    const label = c.outcome === 'win' ? (c.context === 'mugging' ? 'They have legged it' : c.context === 'raid' ? 'Vein secured' : 'Sorted')
      : c.outcome === 'talked' ? 'Talked your way out' : c.outcome === 'bribed' ? 'Paid them off'
      : c.outcome === 'intimidated' ? 'Scared them off' : c.outcome === 'fled' ? 'Scarpered' : 'Come round';
    const good = ['win','talked','bribed','intimidated','fled'].includes(c.outcome);
    bar = `<div class="action-bar visible"><button class="btn ${good ? 'btn-success' : 'btn-primary'}" onclick="exitCombat()">${label}</button></div>`;
  }

  const sub = c.phase === 'opener' ? 'Standoff - pay, talk, or swing' : `Turn ${c.turn} - ${DISTRICTS[p.currentDistrict || HOME_DISTRICT]?.name || ''}`;
  return `<div class="combat-screen screen-fade-enter">
    <div class="screen-header"><div class="screen-header-titles"><div class="screen-header-eyebrow">${eyebrow}</div><div class="screen-header-title">${primary ? primary.name : 'Combat'}${liveCount > 1 ? ` +${liveCount - 1}` : ''}</div><div class="screen-header-sub">${sub}</div></div></div>
    <div class="combat-body">
      <div class="combatant-card">
        <div class="combatant-name">You - rep ${p.reputation || 0}</div>
        <div class="combatant-hp">${p.hp} / ${p.hpMax} HP</div>
        ${pChipHTML}
        <div class="bar-wrap"><div class="bar-fill hp ${pPct < 30 ? 'low' : ''}" style="width:${pPct}%"></div></div>
      </div>
      ${enemyCards}
      <div class="combat-log">${logHTML}</div>
    </div>
    ${bar}
  </div>`;
}

// ============================================================
// RENDER: MODALS
// ============================================================
function renderVeinDetailModal(data) {
  const vein = gameState.player.veins.find(v => v.id === data.veinId);
  if (!vein) return '';
  const ore  = ORE_TYPES[vein.oreType];
  const ld   = VEIN_LEVELS[vein.level];
  const sec  = SECURITY_TIERS.find(s => s.id === vein.security);
  const vd     = veinDistrict(vein);
  const travel = travelBlocksTo(vd);
  const need   = 1 + travel;
  const exh    = blocksRemaining() < need;
  const travelNote = travel ? ` · +${travel} travel` : '';
  const maxLv  = getVeinMaxLevel(vein);
  const hosp   = vein.hospitability || { tier:'fair', bonuses:[] };
  const hospBonuses = (hosp.bonuses||[]).map(b => SITE_BONUSES[b]?.label).filter(Boolean).join(' · ');
  const secOpts = SECURITY_TIERS
    .filter(t => t.id !== vein.security && t.raidResist > (sec?.raidResist||0))
    .map(t => `<button class="btn btn-secondary" onclick="upgradeVeinSecurity('${vein.id}','${t.id}')" ${gameState.player.cash<t.cost?'disabled':''}>Upgrade security: ${t.label} — £${t.cost}</button>`)
    .join('');
  const devPct    = vein.level >= maxLv ? 100 : Math.min(100, Math.round(((vein.devBar||0) / ld.devBarMax) * 100));
  const devAlmost = devPct >= 75 && vein.level < maxLv;
  const chargePct = Math.round(((vein.chargeBlocks||0) / getVeinRechargeBlocks(vein)) * 100);
  return `<div class="modal">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
      <span style="font-size:24px">${ore.symbol}</span>
      <div>
        <div class="modal-title">${ore.name}</div>
        <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">${DISTRICTS[vd].name} · ${vein.location}${travel?` · ${travel} block away`:' · you\'re here'}</div>
      </div>
    </div>
    <div class="modal-sub">${ore.flavorText}${hospBonuses ? `<br><span style="color:var(--amber)">Terroir (${SITE_TIERS[hosp.tier]?.label||'Fair'}): ${hospBonuses}</span>` : ''}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div class="vein-stat"><div class="vein-stat-label">Level</div><div class="vein-stat-value">${vein.level} — ${vein.levelLabel}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Recharge</div><div class="vein-stat-value">${vein.charged ? '✅ Ready' : `⏳ ${chargePct}%`}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Cautious yield</div><div class="vein-stat-value">${ld.yieldCautious[0]}–${ld.yieldCautious[1]} u</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Full yield</div><div class="vein-stat-value">${ld.yieldFull[0]}–${ld.yieldFull[1]} u</div></div>
    </div>
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
        <span class="section-label" style="margin-bottom:0">Development</span>
        <span style="font-family:var(--font-ui);font-size:12px;color:var(--muted)">
          ${vein.level >= maxLv ? 'Max level' : `${vein.devBar||0} / ${ld.devBarMax} pts`}
        </span>
      </div>
      <div class="dev-bar-wrap" style="height:10px">
        <div class="dev-bar-fill ${devAlmost?'almost':''}" style="width:${devPct}%"></div>
      </div>
      ${devAlmost && vein.level < maxLv ? `<div style="font-family:var(--font-ui);font-size:11px;color:var(--amber);margin-top:4px">Almost ready to level up</div>` : ''}
    </div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="harvestVeinCautious('${vein.id}')" ${(!vein.charged||exh)?'disabled':''}>
        ${!vein.charged ? '⛏ Not recharged yet' : exh ? '⛏ Not enough time today' : `⛏ Cautious — ${ld.yieldCautious[0]}–${ld.yieldCautious[1]} u · no dev cost${travelNote}`}
      </button>
      <button class="btn btn-amber" onclick="harvestVeinFull('${vein.id}')" ${(!vein.charged||exh)?'disabled':''}>
        ${!vein.charged || exh ? '' : `⛏ Full — ${ld.yieldFull[0]}–${ld.yieldFull[1]} u · -${ld.devBarHarvestCost} dev${travelNote}`}
      </button>
      <button class="btn btn-secondary" onclick="attemptCultivate('${vein.id}')" ${exh?'disabled':''}>
        🌱 Cultivate (${Math.round(getCultivatingSuccessChance()*100)}% · +${getCultivatingBarGain()} dev${travelNote})
      </button>
      ${secOpts}
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  </div>`;
}

// ============================================================
// RENDER: CRAFTING SCREEN
// ============================================================


// ============================================================
// RENDER: MODALS
// ============================================================

function renderExportModal(data) {
  return `<div class="modal">
    <div class="modal-title">Export save</div>
    <div class="modal-sub">Copy this entire string and keep it somewhere safe. Paste it back via Import to restore your progress on any device.</div>
    <textarea class="save-export" readonly onclick="this.select()">${data.encoded}</textarea>
    <div class="modal-actions" style="margin-top:12px">
      <button class="btn btn-primary" onclick="navigator.clipboard&&navigator.clipboard.writeText('${data.encoded}').then(()=>pushNotification('Copied to clipboard.'),()=>0);closeModal()">Copy to clipboard</button>
      <button class="btn btn-secondary" onclick="closeModal()">Done</button>
    </div>
  </div>`;
}

function renderImportModal() {
  return `<div class="modal">
    <div class="modal-title">Import save</div>
    <div class="modal-sub">Paste your exported save string below. This will overwrite your current progress.</div>
    <textarea class="save-export" id="importInput" placeholder="Paste save string here…" style="color:#f0ece2"></textarea>
    <div class="modal-actions" style="margin-top:12px">
      <button class="btn btn-primary" onclick="doImport(document.getElementById('importInput').value)">Load save</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  </div>`;
}

function renderConfirmNewGameModal() {
  return `<div class="modal">
    <div class="modal-title">Start over?</div>
    <div class="modal-sub">This will wipe your current progress and take you back to the title screen. Save slots are kept. This cannot be undone.</div>
    <div class="modal-actions">
      <button class="btn btn-danger"    onclick="doNewGame()">Yes, wipe it</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  </div>`;
}

function renderCombatItemsModal() {
  const p = gameState.player;
  const inv = p.inventory;
  const deviceId  = p.equipment.device;
  const device    = deviceId ? (p.devicesCompleted||[]).find(d => d.id === deviceId) : null;
  const deviceCharges = device ? getDeviceChargesLeft(device) : 0;
  const dt = device ? DEVICE_TYPES[device.type] : null;
  const snapCount = (gameState.combat.snapshots||[]).length;
  const btn = (cond, cls, onclick, label) => cond ? `<button class="btn ${cls}" onclick="${onclick}">${label}</button>` : '';
  return `<div class="modal">
    <div class="modal-title">Answer the intent</div>
    <div class="modal-sub">Items are free actions this turn. Attack, Blast, or Run end your turn.</div>
    <div class="modal-actions">
      ${btn((inv.timePearl||0)>0, 'btn-primary', "closeModal();combatUseTimePearl()", `&#9198; Time Pearl (${inv.timePearl}) &mdash; freeze a target (beats Heavy)`)}
      ${btn((inv.shield||0)>0, 'btn-primary', "closeModal();combatUseShield()", `&#128737; Shield (${inv.shield}) &mdash; absorb next hits (beats Heavy/Grab)`)}
      ${btn((inv.blast||0)>0, 'btn-primary', "closeModal();combatUseBlast()", `&#128165; Blast (${inv.blast}) &mdash; damage, ignores Brace (ends turn)`)}
      ${btn((inv.enhancementPowder||0)>0, 'btn-secondary', "closeModal();combatUseEnhancement('speed')", `&#8623; Enhancement: Speed (${inv.enhancementPowder}) &mdash; extra attacks (beats Grab)`)}
      ${btn((inv.enhancementPowder||0)>0, 'btn-secondary', "closeModal();combatUseEnhancement('strength')", `&#128170; Enhancement: Strength &mdash; big next hit`)}
      ${btn((inv.healingBurst||0)>0, 'btn-primary', "closeModal();combatUseHeal()", `&#10010; Healing Burst (${inv.healingBurst}) &mdash; heal now`)}
      ${(inv.rewind||0)>0 && snapCount>0 ? `<button class="btn btn-primary" onclick="combatRewind()">&#8634; Rewind (${inv.rewind}) &mdash; undo, +evade</button>` : ''}
      ${(inv.rewind||0)>0 && snapCount===0 ? `<button class="btn btn-secondary" disabled>&#8634; Rewind &mdash; nothing to undo yet</button>` : ''}
      ${device && deviceCharges>0 ? `<button class="btn btn-primary" onclick="${dt?.effect==='rewind'?'combatRewind()':'combatUseDevice()'}">${dt.symbol} ${dt.name} (${deviceCharges}/${device.chargesPerDay})</button>` : ''}
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  </div>`;
}

function renderJamesJobOfferModal(data) {
  const j = data.job;
  return `<div class="modal">
    <div class="modal-title">Job from James</div>
    <div class="modal-sub">"I need ${j.qty} ${j.recipeName}${j.qty>1?'s':''}. Standard rate. Don't take too long about it."</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      <div class="vein-stat"><div class="vein-stat-label">Item</div><div class="vein-stat-value">${j.symbol} ${j.recipeName}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Quantity</div><div class="vein-stat-value">${j.qty}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Pay per item</div><div class="vein-stat-value">£${j.payPerItem}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Total</div><div class="vein-stat-value" style="color:var(--success)">£${j.totalPay}</div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-success"   onclick="acceptJamesJob()">Accept</button>
      <button class="btn btn-secondary" onclick="closeModal();gameState.flags.jamesJobActive=false;gameState.jamesJob=null">Decline</button>
    </div>
  </div>`;
}

function renderJamesJobCompleteModal(data) {
  return `<div class="modal">
    <div class="modal-title">Job done.</div>
    <div class="modal-sub">"Adequate work. Prompt enough." He counts out the money without ceremony.</div>
    <div style="font-size:26px;color:var(--success);margin-bottom:16px">+£${data.earned}</div>
    <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal()">Good.</button></div>
  </div>`;
}

function renderJamesJobShortModal(data) {
  const j = data.job;
  return `<div class="modal">
    <div class="modal-title">Not enough stock</div>
    <div class="modal-sub">James needs ${j.qty}× ${j.recipeName}. You have ${data.have}. Get crafting.</div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Back to it</button></div>
  </div>`;
}

function renderSeedVeinPickModal() {
  const sites = gameState.world.sites || [];
  const rows = sites.length === 0
    ? `<div style="font-family:var(--font-ui);font-size:13px;color:var(--muted);padding:16px 0;line-height:1.5">
        No discovered sites. Veins are seeded into <strong>sites</strong> now — open the London map and prospect a district to find one. Site quality is visible before you pay for anything, which is the point.
      </div>`
    : sites.map(s => {
        const t = SITE_TIERS[s.tier];
        const d = DISTRICTS[s.district];
        const travel = travelBlocksTo(s.district);
        const bonuses = (s.bonuses||[]).map(b => SITE_BONUSES[b].label).join(' · ');
        const barren = s.tier === 'barren';
        const btn = s.natural
          ? `<button class="btn btn-success" style="width:auto;padding:8px 12px;font-size:12px" onclick="claimNaturalVein('${s.id}')">Claim vein</button>`
          : barren
          ? `<span class="pill pill-danger">Barren</span>`
          : `<button class="btn btn-amber" style="width:auto;padding:8px 12px;font-size:12px" onclick="closeModal();openModal('seed_vein',{siteId:'${s.id}'})">Seed</button>`;
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1">
            <div style="font-family:var(--font-ui);font-size:13px;font-weight:600;color:var(--ink)">${d.name} · <span style="color:${barren?'var(--muted)':'var(--amber)'}">${t.label}</span>${s.natural?' · 💠 live vein':''}</div>
            <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">${s.location}${travel?` · +${travel} travel`:''}${bonuses?`<br><span style="color:var(--amber)">${bonuses}</span>`:''}</div>
          </div>
          ${btn}
        </div>`;
      }).join('');
  return `<div class="modal">
    <div class="modal-title">Your discovered sites</div>
    <div class="modal-sub">Prospect districts on the map to discover sites. A site's hospitability becomes the vein's permanent terroir.</div>
    <div style="margin-bottom:16px">${rows}</div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="closeModal();navigate('map')">🗺 Open the map</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  </div>`;
}

function renderSeedVeinModal(data) {
  const site = (gameState.world.sites||[]).find(s => s.id === data.siteId);
  if (!site) return '';
  const t = SITE_TIERS[site.tier];
  const d = DISTRICTS[site.district];
  const p = gameState.player;
  const travel = travelBlocksTo(site.district);
  const need   = 1 + travel;
  const noTime = blocksRemaining() < need;
  const chance = Math.round(Math.min(0.95, getCultivatingSuccessChance() + t.seedMod) * 100);
  const bonuses = (site.bonuses||[]).map(b => `${SITE_BONUSES[b].label} — ${SITE_BONUSES[b].blurb}`).join('<br>');
  const rows = ORE_TYPE_KEYS.map(k => {
    const ore  = ORE_TYPES[k];
    const have = p.orichalchum[k] || 0;
    const ok   = have >= SEED_ORE_COST && !noTime;
    const biased = site.oreBias === k;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:20px;width:26px;text-align:center">${ore.symbol}</span>
      <div style="flex:1">
        <div style="font-family:var(--font-ui);font-size:13px;font-weight:600;color:var(--ink)">${ore.name.replace(' Orichalchum','')}${biased?' <span class="pill pill-amber" style="font-size:9px">local bias</span>':''}</div>
        <div style="font-family:var(--font-ui);font-size:11px;color:${have>=SEED_ORE_COST?'var(--success)':'var(--muted)'}">${have} / ${SEED_ORE_COST} u</div>
      </div>
      <button class="btn btn-amber" style="width:auto;padding:8px 12px;font-size:12px" onclick="attemptSeedAtSite('${site.id}','${k}')" ${ok?'':'disabled'}>Seed</button>
    </div>`;
  }).join('');
  return `<div class="modal">
    <div class="modal-title">Seed at ${d.name}</div>
    <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-bottom:6px">${site.location}</div>
    <div class="modal-sub"><strong style="color:var(--amber)">${t.label} site.</strong> ${t.blurb}${bonuses?`<br><span style="color:var(--amber)">${bonuses}</span>`:''}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div class="vein-stat"><div class="vein-stat-label">Success chance</div><div class="vein-stat-value">${chance}%</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Time cost</div><div class="vein-stat-value">${need} block${need>1?'s':''}${travel?' (incl. travel)':''}</div></div>
    </div>
    ${noTime ? `<div style="font-family:var(--font-ui);font-size:13px;color:var(--danger);margin-bottom:12px">Not enough time blocks left today.</div>` : ''}
    <div style="margin-bottom:16px">${rows}</div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal();openModal('seed_vein_pick',{})">‹ Back to sites</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  </div>`;
}

function renderSeedResultModal(data) {
  return `<div class="modal">
    <div class="modal-title">${data.success ? '✅ Vein seeded.' : '❌ Nothing took.'}</div>
    <div class="modal-sub">${data.success
      ? `A level 1 ${ORE_TYPES[data.oreType].name} vein has formed. Cultivate it to grow.`
      : `The calc dispersed without forming anything. Happens. Keep practising.`
    }</div>
    <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal()">Got it</button></div>
  </div>`;
}

function renderCraftResultModal(data) {
  const r = RECIPES[data.recipeKey];
  const effectDesc = {
    timePearl:'freezes for', enhancementPowder:'grants power', blast:'hits for', shield:'absorbs', healingBurst:'heals', healingSalve:'restores', rewind:'undoes',
  }[data.recipeKey] || 'power';
  const unit = ['blast','healingBurst','healingSalve'].includes(data.recipeKey) ? ` ${data.power} HP`
    : data.recipeKey === 'shield' ? ` ${data.power} hit${data.power>1?'s':''}`
    : data.recipeKey === 'timePearl' ? ` ${data.power} turn${data.power>1?'s':''}`
    : '';
  const stock = gameState.player.inventory[data.recipeKey] || 0;
  return `<div class="modal">
    <div class="modal-title">${data.success ? '✅ Success' : '❌ Failed'}</div>
    <div class="modal-sub">${data.success
      ? `You made a ${r.name}${unit ? ` — ${effectDesc}${unit}` : ''}. The calc cost was worth it.`
      : `The calc dispersed. Nothing to show for it. James would be smug about this if he knew.`
    }</div>
    <div style="font-family:var(--font-ui);font-size:12px;color:var(--muted);margin-bottom:16px">
      ${data.success ? `+${r.xpReward} crafting XP · Stock: ${stock} ${r.name}${stock!==1?'s':''}` : ''}
    </div>
    <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal()">Got it</button></div>
  </div>`;
}

function renderSaleResultModal(data) {
  return `<div class="modal">
    <div class="modal-title">${data.mugged ? 'You held them off.' : 'Done.'}</div>
    <div class="modal-sub">${data.mugged
      ? `They tried their luck. They didn't get it. Archie owes you a pint.`
      : `Smooth as you like. Buyer paid promptly and left.`
    }</div>
    <div style="font-family:var(--font-ui);font-size:22px;font-weight:normal;color:var(--success);margin-bottom:16px">+£${data.earned}</div>
    <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal();navigate('home')">Back to it</button></div>
  </div>`;
}

function renderItemDetailModal(data) {
  const itemObj = (gameState.player.items||[]).find(i => i.id === data.itemId);
  if (!itemObj) return '';
  const def = ITEMS[itemObj.type];
  if (!def) return '';
  const isEquipped = gameState.player.equipment[def.slot] === itemObj.id;
  return `<div class="modal">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <span style="font-size:32px">${def.symbol}</span>
      <div>
        <div class="modal-title">${def.name}</div>
        <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">${def.slot} · ${isEquipped?'Currently equipped':'Unequipped'}</div>
      </div>
    </div>
    <div class="modal-sub">${def.description}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      <div class="vein-stat"><div class="vein-stat-label">Attack bonus</div><div class="vein-stat-value">+${def.attackBonus.min}–${def.attackBonus.max}</div></div>
      <div class="vein-stat"><div class="vein-stat-label">Slot</div><div class="vein-stat-value" style="text-transform:capitalize">${def.slot}</div></div>
    </div>
    <div class="modal-actions">
      ${isEquipped
        ? `<button class="btn btn-secondary" onclick="unequipSlot('${def.slot}')">Unequip</button>`
        : `<button class="btn btn-amber"     onclick="equipItem('${itemObj.id}')">Equip</button>`}
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  </div>`;
}

function renderCultivateResultModal(data) {
  const vein = gameState.player.veins.find(v => v.id === data.veinId);
  const ld   = vein ? VEIN_LEVELS[vein.level] : null;
  const devPct = vein && ld ? Math.min(100, Math.round(((vein.devBar||0) / ld.devBarMax) * 100)) : 0;
  return `<div class="modal">
    <div class="modal-title">${data.success ? '🌱 Cultivation worked.' : '❌ Nothing happened.'}</div>
    <div class="modal-sub">${data.success
      ? data.levelledUp
        ? `The vein responded well. It's levelled up to <strong>${data.newLabel}</strong>.`
        : `Development bar +${data.gain}. Keep at it.`
      : `The vein didn't respond this time. Happens. Your cultivating skill will improve with practice.`
    }</div>
    ${data.success && vein && !data.levelledUp ? `
    <div style="margin-bottom:16px">
      <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-bottom:6px">
        Development — ${vein.devBar||0} / ${ld.devBarMax}
      </div>
      <div class="dev-bar-wrap" style="height:10px">
        <div class="dev-bar-fill ${devPct>=75?'almost':''}" style="width:${devPct}%"></div>
      </div>
    </div>` : ''}
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="closeModal()">Got it</button>
    </div>
  </div>`;
}

function renderEventItemsModal(data) {
  const p = gameState.player;
  const rewindCount  = p.inventory.rewind||0;
  const devId = p.equipment.device;
  const dev = devId ? (p.devicesCompleted||[]).find(d => d.id === devId && DEVICE_TYPES[d.type]?.eventUsable) : null;
  const devCharges = dev ? getDeviceChargesLeft(dev) : 0;
  const dt = dev ? DEVICE_TYPES[dev.type] : null;
  return `<div class="modal">
    <div class="modal-title">Use an item</div>
    <div class="modal-sub">Time unspools. Only you'll remember this version of events.</div>
    <div class="modal-actions">
      ${rewindCount > 0
        ? `<button class="btn btn-primary" onclick="useEventRewindItem('consumable')">⟲ Rewind (${rewindCount}) — reset this event to the beginning</button>`
        : `<button class="btn btn-secondary" disabled>⟲ No Rewind in stock</button>`}
      ${dev && devCharges > 0
        ? `<button class="btn btn-primary" onclick="useEventRewindItem('device')">${dt.symbol} ${dt.name} (${devCharges}/${dev.chargesPerDay}) — reset this event</button>`
        : dev
        ? `<button class="btn btn-secondary" disabled>${dt.symbol} ${dt.name} — no charges today</button>`
        : ''}
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  </div>`;
}

function renderBarometerSectionModal(data) {
  const { section } = data;
  ensureBarometerInit();
  const secLabel  = { economic:'Economic', social:'Social', political:'Political' }[section];
  const bp  = gameState.barometerProgress[section];
  const bcd = gameState.barometerCooldowns[section];
  const day = gameState.world.day;
  const active = gameState.barometer[section];
  const fxLabels = { orePrice:'Ore prices', mugChance:'Mugging risk', dailyCost:'Daily costs', searchFind:'Search chance', homeRaid:'Home raid risk', timePremium:'Time premium', physicsPremium:'Physics premium', lifePremium:'Life premium', fatePremium:'Fate premium', emotionPremium:'Emotion premium', effectMod:'Effect modifier' };
  const canAfford = gameState.player.cash >= 2000;

  const statesHTML = Object.entries(BAROMETER_STATES[section]).map(([sid, state]) => {
    const isActive  = sid === active;
    const progress  = bp[sid] || 0;
    const cd        = bcd[sid] || { push:0, pull:0 };
    const pushCooled = day <= cd.push;
    const pullCooled = day <= cd.pull;
    const fx = state.effects || {};
    const chips = Object.entries(fx).map(([k,v]) => {
      const pos = v > 0;
      return `<span class="effect-chip ${pos?'neg':'pos'}">${fxLabels[k]||k} ${(pos?'+':'')+Math.round(v*100)}%</span>`;
    });

    return `<div style="padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <div style="font-family:var(--font-ui);font-size:13px;font-weight:700;flex:1">${state.label}</div>
        ${isActive ? `<span style="font-family:var(--font-ui);font-size:10px;font-weight:600;color:var(--success);border:1px solid var(--success);border-radius:4px;padding:1px 5px">ACTIVE</span>` : ''}
      </div>
      <div style="font-family:var(--font-body);font-size:12px;color:var(--slate);line-height:1.5;margin-bottom:6px">${state.description}</div>
      ${chips.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">${chips.join('')}</div>` : ''}
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-family:var(--font-ui);font-size:10px;color:var(--muted);margin-bottom:3px">
          <span>Progress</span><span>${progress}/100</span>
        </div>
        <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${progress}%;background:${isActive?'var(--success)':'var(--amber)'};border-radius:3px;transition:width 0.3s"></div>
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <button onclick="pushBarometerState('${section}','${sid}')"
          style="flex:1;padding:7px 4px;font-family:var(--font-ui);font-size:11px;font-weight:600;border-radius:6px;cursor:pointer;border:1px solid ${(!canAfford||pushCooled)?'var(--border)':'var(--success)'};background:${(!canAfford||pushCooled)?'var(--card-bg)':'rgba(58,122,82,0.08)'};color:${(!canAfford||pushCooled)?'var(--muted)':'var(--success)'}"
          ${(!canAfford||pushCooled)?'disabled':''}>
          ▲ Push toward${pushCooled?' (tomorrow)':''}
        </button>
        <button onclick="pullBarometerState('${section}','${sid}')"
          style="flex:1;padding:7px 4px;font-family:var(--font-ui);font-size:11px;font-weight:600;border-radius:6px;cursor:pointer;border:1px solid ${(!canAfford||pullCooled||progress===0)?'var(--border)':'var(--danger)'};background:${(!canAfford||pullCooled||progress===0)?'var(--card-bg)':'rgba(155,35,53,0.08)'};color:${(!canAfford||pullCooled||progress===0)?'var(--muted)':'var(--danger)'}"
          ${(!canAfford||pullCooled||progress===0)?'disabled':''}>
          ▼ Work against${pullCooled?' (tomorrow)':''}
        </button>
      </div>
      ${(!canAfford&&!pushCooled)?`<div style="font-family:var(--font-ui);font-size:10px;color:var(--danger);margin-top:4px">Need £2,000 (have £${gameState.player.cash.toLocaleString()})</div>`:''}
    </div>`;
  }).join('');

  // Faction movements for this section
  const factionLines = Object.entries(FACTION_BAROMETER_PREFS).map(([fid, prefs]) => {
    const relevant = prefs.filter(p => p.section === section);
    if (!relevant.length) return '';
    const f = FACTIONS[fid];
    const parts = relevant.map(p => `${p.direction==='push'?'↑':'↓'} ${BAROMETER_STATES[section][p.state]?.label||p.state}`);
    return `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px">
      <div style="width:8px;height:8px;border-radius:50%;background:${f.colour};flex-shrink:0;margin-top:3px"></div>
      <div style="font-family:var(--font-ui);font-size:11px"><span style="font-weight:600">${f.shortName}</span> — ${parts.join(', ')}</div>
    </div>`;
  }).filter(Boolean).join('');

  return `<div class="modal" onclick="event.stopPropagation()" style="max-height:85vh;display:flex;flex-direction:column">
    <div style="padding:16px 16px 0;display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:var(--font-ui);font-size:17px;font-weight:700">${secLabel} Climate</div>
      <div style="font-family:var(--font-ui);font-size:12px;color:var(--muted)">£2,000 per action</div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:0 16px">
      ${statesHTML}
      ${factionLines ? `<div style="margin-top:14px">
        <div class="section-label" style="margin-bottom:8px">Faction Movements</div>
        ${factionLines}
      </div>` : ''}
    </div>
    <div style="padding:12px 16px;border-top:1px solid var(--border)">
      <button class="btn btn-secondary" onclick="closeModal()" style="width:100%">Close</button>
    </div>
  </div>`;
}

function renderLabOptions() {
  const thresholds = gameState.labThresholds || {};
  const unlocked = Object.entries(RECIPES).filter(([key]) =>
    (key === 'timePearl'    && gameState.flags.craftingUnlocked) ||
    (key === 'enhancementPowder' && gameState.flags.enhancementPowderUnlocked)
  );
  if (unlocked.length === 0) return `<div style="font-family:var(--font-ui);font-size:12px;color:var(--muted);margin-top:4px">No recipes unlocked yet.</div>`;
  return `<div style="margin-top:4px">
    <div class="section-label" style="margin-bottom:6px">Auto-craft Thresholds</div>
    <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-bottom:10px">The lab crafts each item until you hold this many. Set to 0 to disable.</div>
    ${unlocked.map(([key,r]) => {
      const inv = key === 'timePearl' ? (gameState.player.inventory.timePearl||0) : (gameState.player.inventory.enhancementPowder||0);
      const t   = thresholds[key] || 0;
      return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div>
          <div style="font-family:var(--font-ui);font-size:13px;font-weight:600">${r.symbol} ${r.name}</div>
          <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">In stock: ${inv}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button onclick="adjustLabThreshold('${key}',-1)" style="width:28px;height:28px;border:1px solid var(--border);border-radius:4px;background:var(--card-bg);font-size:16px;cursor:pointer;line-height:1">−</button>
          <span style="font-family:var(--font-ui);font-size:16px;font-weight:700;min-width:24px;text-align:center">${t}</span>
          <button onclick="adjustLabThreshold('${key}',1)"  style="width:28px;height:28px;border:1px solid var(--border);border-radius:4px;background:var(--card-bg);font-size:16px;cursor:pointer;line-height:1">+</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderVeinStationOptions() {
  const veins    = gameState.player.veins;
  const selected = gameState.veinStationVeins || [];
  if (veins.length === 0) return `<div style="font-family:var(--font-ui);font-size:12px;color:var(--muted);margin-top:4px">No veins claimed yet.</div>`;
  return `<div style="margin-top:4px">
    <div class="section-label" style="margin-bottom:6px">Veins to Tend</div>
    <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-bottom:10px">Ticked veins are cultivated daily. Charged veins are cautiously harvested — yield goes straight to your inventory.</div>
    ${veins.map(v => {
      const ore  = ORE_TYPES[v.oreType];
      const ld   = VEIN_LEVELS[v.level];
      const on   = selected.includes(v.id);
      return `<div onclick="toggleVeinStationVein('${v.id}')" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid ${on?'var(--amber)':'var(--border)'};border-radius:8px;margin-bottom:8px;cursor:pointer;background:${on?'rgba(200,135,58,0.07)':'var(--card-bg)'}">
        <div style="width:18px;height:18px;border:2px solid ${on?'var(--amber)':'var(--border)'};border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center">
          ${on?`<div style="width:9px;height:9px;background:var(--amber);border-radius:2px"></div>`:''}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-family:var(--font-ui);font-size:13px;font-weight:600">${ore.symbol} ${ore.name} vein — ${ld.label}</div>
          <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">${v.location.split(',')[0]} · ${v.charged?'⚡ charged':vein_devStr(v,ld)}</div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
function vein_devStr(v,ld) { return `${v.devBar||0}/${ld.devBarMax} dev`; }

function renderRoomDetailModal(data) {
  const { roomId } = data;
  const room      = HOME_ROOMS[roomId];
  const installed = gameState.home.rooms.includes(roomId);
  // Find currently assigned contact
  const assignedId = Object.keys(gameState.contacts).find(cid => gameState.contacts[cid].assignedRoom === roomId) || null;
  // Recruited contacts available for this room (not assigned elsewhere, or already here)
  const available  = Object.entries(gameState.contacts).filter(([,c]) => c.recruited && (!c.assignedRoom || c.assignedRoom === roomId));
  const nameMap = { archie:'Archie', james:'James' };

  const assignSection = installed ? `
    <div style="margin:14px 0 10px">
      <div class="section-label" style="margin-bottom:6px">Assigned Contact</div>
      ${available.length === 0
        ? `<div style="font-family:var(--font-ui);font-size:12px;color:var(--muted)">No recruited contacts available. Recruit Archie or James via Contacts.</div>`
        : `<select onchange="assignContactToRoom(this.value,'${roomId}')" style="width:100%;padding:9px 10px;font-family:var(--font-ui);font-size:13px;border:1px solid var(--border);border-radius:7px;background:var(--card-bg);color:var(--ink)">
            <option value="none"${!assignedId?' selected':''}>— Unassigned —</option>
            ${available.map(([cid,c])=>`<option value="${cid}"${cid===assignedId?' selected':''}>${nameMap[cid]||cid} · Craft Sk${c.craftingSkill||1} · Cult Sk${c.cultivatingSkill||1}</option>`).join('')}
          </select>`
      }
    </div>` : '';

  const roomOptions = installed && assignedId
    ? (roomId === 'lab'        ? renderLabOptions()        :
       roomId === 'veinStation' ? renderVeinStationOptions() : '')
    : (installed && !assignedId && (roomId === 'lab' || roomId === 'veinStation')
        ? `<div style="font-family:var(--font-ui);font-size:12px;color:var(--muted);margin-top:4px">Assign a contact to configure this room.</div>`
        : '');

  return `<div class="modal" onclick="event.stopPropagation()" style="max-height:82vh;display:flex;flex-direction:column">
    <div class="modal-title" style="font-size:16px;font-weight:700;padding:16px 16px 0">${room.name}</div>
    <div style="padding:10px 16px 0;font-family:var(--font-body);font-size:14px;color:var(--slate);line-height:1.6">${room.description}</div>
    <div style="padding:0 16px 16px;overflow-y:auto;flex:1">
      ${assignSection}
      ${roomOptions}
    </div>
    <div style="padding:12px 16px;border-top:1px solid var(--border)">
      <button class="btn btn-secondary" onclick="closeModal()" style="width:100%">Close</button>
    </div>
  </div>`;
}

function renderModal() {
  if (!gameState.modal) return '';
  const { type, data } = gameState.modal;
  let inner = '';
  if (type==='vein_detail')       inner = renderVeinDetailModal(data);
  if (type==='craft_result')      inner = renderCraftResultModal(data);
  if (type==='sale_result')       inner = renderSaleResultModal(data);
  if (type==='item_detail')       inner = renderItemDetailModal(data);
  if (type==='export_save')       inner = renderExportModal(data);
  if (type==='import_save')       inner = renderImportModal();
  if (type==='confirm_new_game')  inner = renderConfirmNewGameModal();
  if (type==='sell_menu')         inner = renderSellMenuModal();
  if (type==='combat_items')      inner = renderCombatItemsModal();
  if (type==='james_job_offer')   inner = renderJamesJobOfferModal(data);
  if (type==='james_job_complete')inner = renderJamesJobCompleteModal(data);
  if (type==='james_job_short')   inner = renderJamesJobShortModal(data);
  if (type==='event_items')       inner = renderEventItemsModal(data);
  if (type==='barometer_section') inner = renderBarometerSectionModal(data);
  if (type==='room_detail')       inner = renderRoomDetailModal(data);
  if (type==='faction_detail')    inner = renderFactionDetailModal(data);
  if (type==='seed_vein')         inner = renderSeedVeinModal(data);
  if (type==='seed_result')       inner = renderSeedResultModal(data);
  if (type==='seed_vein_pick')    inner = renderSeedVeinPickModal();
  if (type==='cultivate_result')  inner = renderCultivateResultModal(data);
  if (type==='district')          inner = renderDistrictModal(data);
  if (type==='prospect_result')   inner = renderProspectResultModal(data);
  if (type==='district_event')    inner = renderDistrictEventModal(data);
  return inner ? `<div class="modal-overlay" onclick="if(event.target===this)closeModal()">${inner}</div>` : '';
}

function renderGlobalNav() {
  const stage = gameState.flags.tutorialStage;
  const s = gameState.currentScreen;
  const contactsBadge = ['sms_archie','meet_james','buyer_event','crafting_event','archie_craft_chat'].includes(stage) ? 'nav-btn-badge' : '';
  const craftEnabled  = gameState.flags.craftingUnlocked;
  const worldScreens  = ['world','map','property','factions','barometer','stats','save'];
  const onHome      = s === 'home'                               ? 'active' : '';
  const onInventory = s === 'inventory'                          ? 'active' : '';
  const onCraft     = s === 'crafting'                           ? 'active' : '';
  const onWorld     = worldScreens.includes(s)                  ? 'active' : '';
  const onContacts  = (s === 'contacts' || s.startsWith('sms')) ? 'active' : '';
  return `<nav class="global-nav">
    <button class="nav-btn ${onHome}"      onclick="navigate('home')">
      <span class="nav-btn-icon">⌂</span><span class="nav-btn-label">Home</span>
    </button>
    <button class="nav-btn ${onInventory}" onclick="navigate('inventory')">
      <span class="nav-btn-icon">🎒</span><span class="nav-btn-label">Inventory</span>
    </button>
    <button class="nav-btn ${onCraft}" style="${craftEnabled ? '' : 'opacity:0.35;pointer-events:none'}" onclick="navigate('crafting')">
      <span class="nav-btn-icon">⚗️</span><span class="nav-btn-label">Craft</span>
    </button>
    <button class="nav-btn ${onWorld}"     onclick="navigate('world')">
      <span class="nav-btn-icon">🌍</span><span class="nav-btn-label">World</span>
    </button>
    <button class="nav-btn ${onContacts} ${contactsBadge}" onclick="navigate('contacts')">
      <span class="nav-btn-icon">👤</span><span class="nav-btn-label">Contacts</span>
    </button>
  </nav>`;
}

