// ============================================================
// RENDER: ARCHIE CRAFT CHAT EVENT
// ============================================================
function renderArchieCraftChatScreen() {
  return makeEventScreen(
    `London — Day ${gameState.world.day}`, 'Spitalfields',
    ARCHIE_CRAFT_CHAT_CARDS, gameState.archieChatStep, ARCHIE_CRAFT_CHAT_CARDS.length,
    'advanceArchieCraftChat', 'completeArchieCraftChat', 'Back to it →', 'rewindArchieChatEvent'
  );
}

// ============================================================
// RENDER: SELL MENU MODAL
// ============================================================
function renderSellMenuModal() {
  const p = gameState.player;
  // Build sell state from gameState.sellState
  if (!gameState.sellState) gameState.sellState = {};
  const ss = gameState.sellState;

  let gross = 0;
  let lineItems = [];

  // Ore rows
  const oreRows = ORE_TYPE_KEYS.map(k => {
    const have = p.orichalchum[k] || 0;
    if (have === 0) return '';
    const qty = ss['ore_'+k] || 0;
    const price = ORE_TYPES[k].basePrice;
    if (qty > 0) { gross += price * qty; lineItems.push({kind:'ore',type:k,qty}); }
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:18px;width:24px;text-align:center">${ORE_TYPES[k].symbol}</span>
      <div style="flex:1">
        <div style="font-family:var(--font-ui);font-size:13px;font-weight:600;color:var(--ink)">${ORE_TYPES[k].name.replace(' Orichalchum','')}</div>
        <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">£${price}/u · have ${have}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button onclick="sellAdjust('ore_${k}',-1,${have})" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--paper);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
        <span style="font-family:var(--font-ui);font-size:14px;font-weight:700;min-width:20px;text-align:center">${qty}</span>
        <button onclick="sellAdjust('ore_${k}',1,${have})" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--paper);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
      </div>
    </div>`;
  }).join('');

  // Consumable rows
  const canSellCons = gameState.flags.canSellConsumables;
  const pearlHave   = p.inventory.timePearl;
  const pearlQty    = ss['con_timePearl'] || 0;
  const pearlPrice  = CONSUMABLE_PRICES.timePearl;
  const motionHave  = p.inventory.enhancementPowder;
  const motionQty   = ss['con_enhancementPowder'] || 0;
  const motionPrice = CONSUMABLE_PRICES.enhancementPowder;
  if (pearlQty  > 0) { gross += pearlPrice  * pearlQty;  lineItems.push({kind:'consumable',type:'timePearl',   qty:pearlQty}); }
  if (motionQty > 0) { gross += motionPrice * motionQty; lineItems.push({kind:'consumable',type:'enhancementPowder',qty:motionQty}); }

  function conRow(symbol, label, price, have, ssKey) {
    if (!have) return '';
    const qty = ss[ssKey]||0;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:18px;width:24px;text-align:center">${symbol}</span>
      <div style="flex:1">
        <div style="font-family:var(--font-ui);font-size:13px;font-weight:600;color:var(--ink)">${label}</div>
        <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted)">£${price}/ea · have ${have}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button onclick="sellAdjust('${ssKey}',-1,${have})" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--paper);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
        <span style="font-family:var(--font-ui);font-size:14px;font-weight:700;min-width:20px;text-align:center">${qty}</span>
        <button onclick="sellAdjust('${ssKey}',1,${have})" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--paper);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
      </div>
    </div>`;
  }
  const conRows = canSellCons
    ? (pearlHave > 0 || motionHave > 0
      ? conRow('⧖','Time Pearl',   pearlPrice,  pearlHave,  'con_timePearl') +
        conRow('↯','Enhancement Powder',motionPrice, motionHave, 'con_enhancementPowder')
      : '<div style="font-family:var(--font-ui);font-size:12px;color:var(--muted);padding:8px 0">No consumables in stock.</div>')
    : '';

  const hasAnything = totalOre(p.orichalchum) > 0 || (canSellCons && pearlHave > 0);
  const playerCut = Math.floor(gross * 0.5);

  return `<div class="modal">
    <div class="modal-title">Find a buyer</div>
    <div class="modal-sub">Archie splits 50/50. Select what you want to move.</div>
    ${!hasAnything ? '<div style="font-family:var(--font-ui);font-size:13px;color:var(--muted);padding:8px 0">Nothing to sell right now.</div>' : ''}
    ${oreRows}
    ${conRows}
    <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;margin-top:14px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);margin-bottom:2px">Your cut (50%)</div>
        <div style="font-size:22px;color:${playerCut>0?'var(--success)':'var(--ink)'}">£${playerCut}</div>
      </div>
      <div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);text-align:right">20% chance<br>of mugging</div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-success" onclick="doSell()" ${playerCut===0?'disabled':''}>Go — find a buyer</button>
      <button class="btn btn-secondary" onclick="closeModal();gameState.sellState={}">Cancel</button>
    </div>
  </div>`;
}

// ============================================================
// RENDER: ARCHIE MOTION EVENT
// ============================================================
function renderArchieMotionEventScreen() {
  return makeEventScreen(
    `London — Day ${gameState.world.day}`, 'Phone call',
    ARCHIE_MOTION_CARDS, archieMotionStep, ARCHIE_MOTION_CARDS.length,
    'advanceArchieMotion', 'completeArchieMotion', 'Head to Bermondsey →', 'rewindArchieMotion'
  );
}

// ============================================================
// RENDER: JAMES MOTION EVENT
// ============================================================
function renderJamesMotionEventScreen() {
  return makeEventScreen(
    `London — Day ${gameState.world.day}`, 'Bermondsey',
    JAMES_MOTION_CARDS, jamesMotionStep, JAMES_MOTION_CARDS.length,
    'advanceJamesMotion', 'completeJamesMotion', 'Back to the bench →', 'rewindJamesMotion'
  );
}

// ============================================================
// RENDER: CONTACTS
// ============================================================
function renderContactAffinityLine(contactId) {
  const ca = CONTACT_AFFINITIES[contactId];
  const relation = gameState.contacts[contactId]?.relation || 0;
  if (!ca || relation < ca.revealAt) return '';
  return `<div style="font-family:var(--font-ui);font-size:11px;color:var(--muted);padding:0 0 8px;font-style:italic">${ca.blurb}</div>`;
}

function renderContactsScreen() {
  const stage    = gameState.flags.tutorialStage;
  const ore      = totalOre(gameState.player.orichalchum);
  const canSms1  = ['sms_archie','meet_james','crafting_event','free'].includes(stage);
  const canFindBuyer = gameState.flags.buyerEventSeen;
  const hasSellable = ore > 0 || (gameState.flags.canSellConsumables && gameState.player.inventory.timePearl > 0);
  const buyerActionLabel = canFindBuyer
    ? `<div class="contact-action ${hasSellable?'':'locked'}" onclick="${hasSellable?'openSellMenu()':''}"><span>💰 Find a buyer</span>${hasSellable?'<span class="contact-action-arrow">›</span>':'<span class="contact-lock-reason">Nothing to sell</span>'}</div>`
    : `<div class="contact-action locked"><span>💰 Find a buyer</span><span class="contact-lock-reason">Not unlocked yet</span></div>`;

  // Buyer event trigger via contacts
  const buyerEventAction = (stage==='buyer_event' && !gameState.flags.buyerEventSeen && gameState.world.day >= 2)
    ? `<div class="contact-action" onclick="navigate('event_buyer')"><span>💬 Archie texted — buyer tonight</span><span class="contact-action-arrow" style="color:var(--amber)">●</span></div>`
    : '';
  const archieChatAction = stage==='archie_craft_chat' && !gameState.flags.archieCraftChatSeen
    ? `<div class="contact-action" onclick="navigate('event_archie_craft_chat')"><span>💬 Archie wants to meet</span><span class="contact-action-arrow" style="color:var(--amber)">●</span></div>`
    : '';
  const craftingEventAction = '';
  const archieMotionAction = gameState.flags._archieMotionPending && !gameState.flags.archieMotionEventSeen
    ? `<div class="contact-action" onclick="navigate('event_archie_motion')"><span>💬 Archie texted — diversify</span><span class="contact-action-arrow" style="color:var(--amber)">●</span></div>`
    : '';
  const jamesMotionAction = gameState.flags.archieMotionEventSeen && !gameState.flags.jamesMotionEventSeen
    ? `<div class="contact-action" onclick="navigate('event_james_motion')"><span>💬 Visit James — ask about new recipes</span><span class="contact-action-arrow">›</span></div>`
    : '';
  const jamesJobAction = gameState.flags.jamesMotionEventSeen
    ? (gameState.flags.jamesJobActive && gameState.jamesJob
      ? `<div class="contact-action" onclick="fulfillJamesJob()"><span>📦 Deliver job: ${gameState.jamesJob.qty}× ${gameState.jamesJob.symbol} ${gameState.jamesJob.recipeName}</span><span class="contact-action-arrow" style="color:var(--success)">›</span></div>`
      : `<div class="contact-action" onclick="offerJamesJob()"><span>📋 Ask James for work</span><span class="contact-action-arrow">›</span></div>`)
    : '';

  const sms1Action = canSms1 && stage!=='buyer_event' && stage!=='crafting_event'
    ? `<div class="contact-action" onclick="navigate('sms_archie')"><span>💬 Message Archie — set up James meeting</span><span class="contact-action-arrow">›</span></div>`
    : !canSms1
    ? `<div class="contact-action locked"><span>💬 Message Archie</span><span class="contact-lock-reason">Complete the sale first</span></div>`
    : '';

  const jamesCard = gameState.contacts.james.unlocked ? `
    <div class="contact-card">
      <div class="contact-card-header"><div class="contact-avatar">🧓</div><div><div class="contact-name">James</div><div class="contact-role">Craftsman · Bermondsey</div></div><div style="text-align:right"><div style="font-family:var(--font-ui);font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em">Relation</div><div style="font-family:var(--font-ui);font-size:16px;font-weight:700;color:var(--amber)">${gameState.contacts.james.relation}</div></div></div>
      ${renderContactAffinityLine('james')}
      <div class="contact-actions">
        ${craftingEventAction}
        ${jamesMotionAction}
        ${jamesJobAction}
        <div class="contact-action locked"><span>💬 Message James</span><span class="contact-lock-reason">Coming soon</span></div>
        ${canRecruit('james') ? `<div class="contact-action" onclick="recruitContact('james')" style="color:var(--success);font-weight:600"><span>⭐ Recruit James</span><span class="contact-action-arrow" style="color:var(--success)">›</span></div>` : gameState.contacts.james.recruited ? `<div class="contact-action locked"><span>✅ James recruited</span></div>` : `<div class="contact-action locked"><span>⭐ Recruit James</span><span class="contact-lock-reason">${gameState.contacts.james.recruitThreshold - gameState.contacts.james.relation} relation needed</span></div>`}
      </div>
    </div>` : '';

  return `<div class="contacts-screen screen-fade-enter">
    <div class="screen-header"><button class="screen-header-back" onclick="navigate('home')">‹</button><div class="screen-header-titles"><div class="screen-header-eyebrow">Network</div><div class="screen-header-title">Contacts</div></div></div>
    <div class="contacts-body">
      <div class="contact-card">
        <div class="contact-card-header"><div class="contact-avatar">🧔</div><div><div class="contact-name">Archie</div><div class="contact-role">Trader · Whitechapel</div></div><div style="text-align:right"><div style="font-family:var(--font-ui);font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em">Relation</div><div style="font-family:var(--font-ui);font-size:16px;font-weight:700;color:var(--amber)">${gameState.contacts.archie.relation}</div></div></div>
        ${renderContactAffinityLine('archie')}
        <div class="contact-actions">
          ${archieMotionAction}
          ${archieChatAction}
          ${buyerEventAction}
          ${sms1Action}
          ${buyerActionLabel}
          ${canRecruit('archie') ? `<div class="contact-action" onclick="recruitContact('archie')" style="color:var(--success);font-weight:600"><span>⭐ Recruit Archie</span><span class="contact-action-arrow" style="color:var(--success)">›</span></div>` : gameState.contacts.archie.recruited ? `<div class="contact-action locked"><span>✅ Archie recruited</span></div>` : `<div class="contact-action locked"><span>⭐ Recruit Archie</span><span class="contact-lock-reason">${gameState.contacts.archie.recruitThreshold - gameState.contacts.archie.relation} relation needed</span></div>`}
        </div>
      </div>
      ${jamesCard}
    </div>
  </div>`;
}

// ============================================================
// RENDER: SMS (ARCHIE — thread 1)
// ============================================================
function renderSmsArchie1Screen() {
  const step=gameState.smsStep, msgs=ARCHIE_SMS_1.slice(0,step), allShown=step>=ARCHIE_SMS_1.length;
  const bubbles=msgs.map(m=>`<div class="sms-bubble-wrap ${m.from==='player'?'sent':'received'}"><div class="sms-bubble">${m.text}</div></div>`).join('');
  const inputBar = !gameState.smsSentFirst
    ? `<div class="sms-input-bar"><input class="sms-input" type="text" value="You mentioned a bloke called James. When can we sort that?" readonly><button class="sms-send-btn" onclick="sendSms1()">↑</button></div>`
    : allShown
    ? `<div class="action-bar visible" style="background:#f2f2f7;border-top:1px solid #d1d1d6"><button class="btn btn-primary" onclick="completeSms1()">Head to the meeting →</button></div>`
    : `<div class="sms-input-bar"><input class="sms-input" type="text" placeholder="…" readonly><button class="sms-send-btn" disabled>↑</button></div>`;
  return `<div class="sms-screen screen-fade-enter"><div class="sms-header"><button class="sms-header-back" onclick="navigate('contacts')">‹</button><div class="sms-header-info"><div class="sms-contact-name">Archie</div><div class="sms-contact-sub">Mobile</div></div></div><div class="sms-body" id="smsBody"><div class="sms-time">Today</div>${bubbles}</div>${inputBar}</div>`;
}

// ============================================================
// RENDER: SMS (ARCHIE — thread 2: buyer lined up)
// ============================================================
function renderSmsArchie2Screen() {
  const step=gameState.smsStep2, msgs=ARCHIE_SMS_2.slice(0,step), allShown=step>=ARCHIE_SMS_2.length;
  const bubbles=msgs.map(m=>`<div class="sms-bubble-wrap ${m.from==='player'?'sent':'received'}"><div class="sms-bubble">${m.text}</div></div>`).join('');
  const inputBar = !gameState.smsSent2First
    ? `<div class="sms-input-bar"><input class="sms-input" type="text" value="Got some calc to move. You got a buyer?" readonly><button class="sms-send-btn" onclick="sendSms2()">↑</button></div>`
    : allShown
    ? `<div class="action-bar visible" style="background:#f2f2f7;border-top:1px solid #d1d1d6"><button class="btn btn-primary" onclick="completeSms2()">Head to Shoreditch →</button></div>`
    : `<div class="sms-input-bar"><input class="sms-input" type="text" placeholder="…" readonly><button class="sms-send-btn" disabled>↑</button></div>`;
  return `<div class="sms-screen screen-fade-enter"><div class="sms-header"><button class="sms-header-back" onclick="navigate('contacts')">‹</button><div class="sms-header-info"><div class="sms-contact-name">Archie</div><div class="sms-contact-sub">Mobile</div></div></div><div class="sms-body" id="smsBody"><div class="sms-time">Today</div>${bubbles}</div>${inputBar}</div>`;
}

// ============================================================
// RENDER: EVENT — JAMES MEETING
// ============================================================
function renderJamesEventScreen() {
  return makeEventScreen(`London — Day ${gameState.world.day}`, 'Bermondsey', JAMES_CARDS, gameState.jamesStep, JAMES_CARDS.length, 'advanceJames', 'completeJames', 'Head to the bench →', 'rewindJamesEvent');
}

// ============================================================
// RENDER: EVENT — BUYER
// ============================================================
function renderBuyerEventScreen() {
  return makeEventScreen(`London — Day ${gameState.world.day}`, 'Shoreditch', BUYER_CARDS, gameState.buyerStep, BUYER_CARDS.length, 'advanceBuyer', 'completeBuyer', 'Split the cash →', 'rewindBuyerEvent');
}

// ============================================================
// RENDER: EVENT — JAMES CRAFTING
// ============================================================
function renderJamesCraftEventScreen() {
  return makeEventScreen(`London — Day ${gameState.world.day}`, 'Bermondsey', JAMES_CRAFT_CARDS, gameState.jamesCraftStep, JAMES_CRAFT_CARDS.length, 'advanceJamesCraft', 'completeJamesCraft', 'Head to the bench →');
}

