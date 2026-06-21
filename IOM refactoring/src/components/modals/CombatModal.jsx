import React, { useState, useEffect, useRef, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { ESSENTIA_TYPES, SIGIL_SLOTS } from '@/data/constants';
import { SIGIL_REGISTRY } from '@/data/sigils';
import { WEAPONS, BODY_ARMOUR } from '@/data/weapons';
import { BACKUP_SQUADS, RAIDER_SQUADS } from '@/data/enemies';
import { equippedCapacityUsed, sigilCapacityCost } from '@/engine/helpers';
import { buildTurnOrder, initCombat, getPassiveBonus, applyEnemyPassives } from '@/engine/combat';
import { ACT } from '@/engine/time';

export function CombatModal() {
  const { state, dispatch, combat, setCombat } = useContext(GameCtx);
  const logRef = useRef(null);
  const [, forceUpdate] = useState(0); // trigger re-render after mutating combat

  // Auto-scroll log to bottom on each new entry
  useEffect(()=>{
    if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  });

  if(!combat) return null;

  // ── Helpers ──────────────────────────────────
  function getCombatant(id) {
    return combat.combatants.find(c=>c.id===id)||null;
  }
  function cLog(text, cls="") {
    combat.log.push({ text, cls });
    if(combat.log.length>60) combat.log.shift();
  }
  function currentActor() {
    if(!combat.turnOrder.length) return null;
    const entry = combat.turnOrder[combat.turnIndex];
    return entry ? getCombatant(entry.combatantId) : null;
  }
  function advanceTurn() {
    combat.turnIndex++;
    if(combat.turnIndex>=combat.turnOrder.length){
      combat.round++;
      combat.turnOrder = buildTurnOrder(combat.combatants.filter(c=>c.hp>0));
      combat.turnIndex = 0;
    }
    // Skip dead
    let guard=0;
    while(guard++<20){
      const entry = combat.turnOrder[combat.turnIndex]; if(!entry) break;
      const c = getCombatant(entry.combatantId); if(c&&c.hp>0) break;
      combat.turnIndex++;
      if(combat.turnIndex>=combat.turnOrder.length){
        combat.round++;
        combat.turnOrder = buildTurnOrder(combat.combatants.filter(c2=>c2.hp>0));
        combat.turnIndex = 0;
      }
    }
  }

  // ── Win/loss check ──
  function checkEnd(winType) {
    const aliveE = combat.combatants.filter(c=>!c.isPlayer&&c.hp>0);
    const player = getCombatant("player");
    if(player&&player.hp<=0){ triggerEnd("lose"); return true; }
    if(aliveE.length===0){ triggerEnd(winType||"win"); return true; }
    return false;
  }
  function triggerEnd(result) {
    combat.over = true; combat.result = result;
    const player = getCombatant("player");
    const loot = (result==="win"||result==="incapacitate") ? Math.floor(10+Math.random()*40) : 0;
    if(loot>0) cLog(`You search the area and find £${loot}.`, "player");
    dispatch({
      type: ACT.COMBAT_END,
      result, loot, finalPlayerHp: player?.hp||1,
      combatCtx: combat.context,
    });
    forceUpdate(n=>n+1);
  }

  // ── Enemy turn (called from runLoop) ──
  function doEnemyTurn(enemy) {
    if(enemy.stunTurns>0){
      enemy.stunTurns--;
      cLog(`${enemy.name} is stunned and can't act! (${enemy.stunTurns} left)`);
      advanceTurn(); runLoop(); return;
    }
    combat.turnCount++;

    // Backup: drain context, after round 3, once only
    if(combat.context?.type==="drain" && !combat.backupArrived && combat.round>3){
      const tier = combat.context.securityTier||"light";
      const pool = BACKUP_SQUADS[tier]||BACKUP_SQUADS.light;
      const squad = pool[Math.floor(Math.random()*pool.length)];
      combat.backupArrived = true;
      const sigils = squad.sigils?[...squad.sigils]:[];
      combat.combatants.push({
        id:"enemy_backup", isPlayer:false, name:squad.name,
        hp:squad.hp, maxHp:squad.hp,
        atk:applyEnemyPassives(squad.atk, sigils),
        combat:squad.combat||1, agility:squad.agility||2,
        sigils, hasLifeSigil:sigils.some(id=>["strength_sigil","mending_sigil"].includes(id)),
        stunTurns:0, enemyFlashUses:0, _template:squad,
      });
      cLog(`You're taking too long — ${squad.name} arrives as backup!`, "crit");
      combat.turnOrder = buildTurnOrder(combat.combatants.filter(c=>c.hp>0));
      combat.turnIndex = 0;
      runLoop(); return;
    }

    // Enemy sigil (30%)
    const activeSigils = (enemy.sigils||[]).filter(id=>["light_sigil","slam_sigil","haywire_sigil","air_blades"].includes(id));
    if(activeSigils.length && Math.random()<0.30){
      if(doEnemySigil(enemy, activeSigils[Math.floor(Math.random()*activeSigils.length)])) return;
    }

    // Physical attack
    const player = getCombatant("player");
    const dodgeChance = Math.min(40,(state.competencies.combat||0)*4)+(player.enemyMissBonus||0);
    if(Math.random()*100<dodgeChance){ cLog(`You dodge ${enemy.name}'s attack!`,"player"); advanceTurn(); runLoop(); return; }

    // Shield intercept for gun enemies
    const enemyHasGun = enemy._template?.ranged||enemy._template?.gun;
    if(enemyHasGun && (player.shieldActive||hasEquippedShield())){
      const blocked = tryShieldIntercept(enemy,"gun");
      if(blocked){ advanceTurn(); runLoop(); return; }
    }

    let dmg = Math.floor((enemy.atk[0])+Math.random()*(enemy.atk[1]-enemy.atk[0]+1));
    const armour = state.equippedArmour?BODY_ARMOUR[state.equippedArmour]:null;
    if(armour){ const b=Math.floor(dmg*armour.damageReduction); dmg=Math.max(1,dmg-b); cLog(`${enemy.name} hits you for ${dmg} damage. (Armour blocks ${b})`,"crit"); }
    else { cLog(`${enemy.name} hits you for ${dmg} damage.`,"crit"); }
    player.hp = Math.max(0,player.hp-dmg);
    if(player.hp<=0){ cLog("You collapse!","crit"); triggerEnd("lose"); return; }
    advanceTurn(); runLoop();
  }

  function doEnemySigil(enemy, sigilId) {
    const player = getCombatant("player");
    if(sigilId==="light_sigil"){
      const uses = enemy.enemyFlashUses||0;
      const chance = uses===0?100:Math.max(10,70-(uses-1)*30);
      enemy.enemyFlashUses = uses+1;
      if(Math.floor(Math.random()*100)+1<=chance){
        cLog(`${enemy.name} triggers Light Sigil — a blinding flash!`,"crit");
        player.playerStunTurns = (player.playerStunTurns||0)+2;
        cLog(`You are stunned for 2 turns.`);
      } else { cLog(`${enemy.name} tries Light Sigil — you were ready for it.`); }
      advanceTurn(); runLoop(); return true;
    }
    if(sigilId==="slam_sigil"){
      const dmg = Math.max(2,Math.floor(5+(enemy.combat||1)*3+Math.random()*8));
      player.hp = Math.max(0,player.hp-dmg);
      cLog(`${enemy.name} unleashes Slam — ${dmg} damage!`,"crit");
      if(player.hp<=0){ cLog("You collapse!","crit"); triggerEnd("lose"); return true; }
      advanceTurn(); runLoop(); return true;
    }
    if(sigilId==="haywire_sigil"){
      const ownsLife = SIGIL_SLOTS.some(sl=>{ const k=state.equipped[sl];if(!k)return false;const inst=(state.sigils||[]).find(s=>s.key===k);if(!inst)return false;const sig=SIGIL_REGISTRY[inst.id];return sig&&sig.type==="Life"&&sig.passive; });
      const dmg = ownsLife?Math.max(15,Math.floor(player.maxHp*0.5+Math.random()*12)):Math.max(3,Math.floor(6+(enemy.combat||1)*2+Math.random()*6));
      player.hp = Math.max(0,player.hp-dmg);
      cLog(`${enemy.name} triggers Haywire — ${dmg} damage${ownsLife?" (Life sigil exploited)":""}!`,"crit");
      if(player.hp<=0){ cLog("You collapse!","crit"); triggerEnd("lose"); return true; }
      advanceTurn(); runLoop(); return true;
    }
    if(sigilId==="air_blades"){
      cLog(`${enemy.name} fires Air Blades!`,"crit");
      if(player.shieldActive||hasEquippedShield()){
        const blocked = tryShieldIntercept(enemy,"air_blades");
        if(blocked){ advanceTurn(); runLoop(); return true; }
      }
      const dmg = Math.max(3,Math.floor(4+(enemy.combat||1)*3+Math.random()*10));
      player.hp = Math.max(0,player.hp-dmg);
      cLog(`Air Blades cut through for ${dmg} damage.`,"crit");
      if(player.hp<=0){ cLog("You collapse!","crit"); triggerEnd("lose"); return true; }
      advanceTurn(); runLoop(); return true;
    }
    return false;
  }

  function hasEquippedShield() {
    return SIGIL_SLOTS.some(sl=>{ const k=state.equipped[sl];if(!k)return false;const inst=(state.sigils||[]).find(s=>s.key===k);if(!inst)return false;return SIGIL_REGISTRY[inst.id]?.shieldSigil; });
  }
  function tryShieldIntercept(enemy, attackType) {
    const player = getCombatant("player");
    if(player.shieldActive){
      const label=attackType==="gun"?"gunfire":"Air Blades";
      cLog(`Your Shield deflects ${enemy.name}'s ${label} completely!`,"player");
      // Award +1 Kinetic (side effect — dispatch after combat for purity, note it in log)
      cLog(`The Shield absorbs kinetic energy.`);
      return true;
    }
    // Reactive raise — agility check DC 10
    const shieldKey = SIGIL_SLOTS.map(sl=>{ const k=state.equipped[sl];if(!k)return null;const inst=(state.sigils||[]).find(s=>s.key===k);if(!inst)return null;return SIGIL_REGISTRY[inst.id]?.shieldSigil?inst:null; }).find(Boolean);
    if(!shieldKey) return false;
    const agiBonus = getPassiveBonus("agility",state);
    const agi = Math.round((state.competencies.agility||2)*(1+agiBonus/100));
    const roll = 1+Math.floor(Math.random()*20);
    const total = roll+agi;
    if(total<10){ cLog(`Shield reactive raise — Agility check failed (${total} vs DC 10).`); return false; }
    const cost = sigilCapacityCost(shieldKey, state.affinities);
    if(equippedCapacityUsed(state)+cost>state.essentiaLevel){ cLog(`Shield — capacity full, can't raise!`); return false; }
    player.shieldActive = true;
    cLog(`Shield — Agility check passed (${total})! Raised just in time — attack deflected!`,"player");
    return true;
  }

  // ── Ally turn ──
  function doAllyTurn(ally) {
    if(ally.playerStunTurns>0){ ally.playerStunTurns--; cLog(`${ally.name} is stunned!`); advanceTurn(); runLoop(); return; }
    const aliveE = combat.combatants.filter(c=>!c.isPlayer&&c.hp>0);
    if(!aliveE.length){ advanceTurn(); runLoop(); return; }
    const target = aliveE[Math.floor(Math.random()*aliveE.length)];
    const dmg = Math.floor(ally.atk[0]+Math.random()*(ally.atk[1]-ally.atk[0]+1));
    target.hp = Math.max(0,target.hp-dmg);
    cLog(`${ally.name} attacks ${target.name} for ${dmg} damage!${target.hp<=0?" "+target.name+" goes down!":""}`, "player");
    advanceTurn(); runLoop();
  }

  // ── Main loop ── called after each action to auto-advance non-player turns
  function runLoop() {
    if(combat.over){ forceUpdate(n=>n+1); return; }
    const aliveE = combat.combatants.filter(c=>!c.isPlayer&&c.hp>0);
    const player = getCombatant("player");
    if(!player||player.hp<=0){ triggerEnd("lose"); return; }
    if(!aliveE.length){ triggerEnd("win"); return; }
    const actor = currentActor();
    if(!actor){ forceUpdate(n=>n+1); return; }
    if(actor.isAlly){ doAllyTurn(actor); return; }
    if(actor.isPlayer){
      if((actor.playerStunTurns||0)>0){
        actor.playerStunTurns--;
        cLog(`You're stunned — can't act! (${actor.playerStunTurns} left)`);
        advanceTurn(); runLoop(); return;
      }
      combat.menu = "main";
      forceUpdate(n=>n+1); return;
    }
    // Enemy
    if(actor.hp<=0){ advanceTurn(); runLoop(); return; }
    doEnemyTurn(actor);
  }

  // ── Player actions ──
  function playerAttack(weaponId) {
    const aliveE = combat.combatants.filter(c=>!c.isPlayer&&c.hp>0);
    const target = aliveE[0]; if(!target) return;
    const cs = state.competencies.combat||0;
    const passivePct = getPassiveBonus("strength",state)+getPassiveBonus("iron_fist",state);
    const w = weaponId?WEAPONS[weaponId]:null;
    let dmg;
    if(w?.nonlethal){
      const base = Math.max(1,Math.floor(3+cs*2.5+Math.random()*6));
      dmg = Math.floor(base*w.dmgMultiplier);
      if(passivePct>0) dmg=Math.floor(dmg*(1+passivePct/100));
      cLog(`You bludgeon ${target.name} with the ${w.name} for ${dmg} damage.`,"player");
    } else if(w){
      const finalAcc = Math.min(97, w.accuracy+cs*(w.ranged?2:1));
      if(Math.random()*100>finalAcc){ cLog(`You ${w.ranged?"fire at":"swing at"} ${target.name} — miss!`); advanceTurn(); runLoop(); return; }
      const cb = cs*2;
      dmg = Math.floor((w.dmgMin+cb)+Math.random()*(w.dmgMax-w.dmgMin+1));
      if(passivePct>0) dmg=Math.floor(dmg*(1+passivePct/100));
      cLog(`You ${w.ranged?"shoot":"slash"} ${target.name} with the ${w.name}${w.burst?" (burst)":""} for ${dmg} damage.`,"player");
    } else {
      dmg = Math.max(1,Math.floor(3+cs*2.5+Math.random()*6));
      if(passivePct>0) dmg=Math.floor(dmg*(1+passivePct/100));
      cLog(`You strike ${target.name} for ${dmg} damage.`,"player");
    }
    target.hp = Math.max(0,target.hp-dmg);
    if(target.hp<=0){ cLog(`${target.name} is defeated!`,"system"); if(checkEnd("win")) return; }
    advanceTurn(); runLoop();
  }

  function playerUseSigil(key) {
    const inst = (state.sigils||[]).find(s=>s.key===key); if(!inst) return;
    const sig = SIGIL_REGISTRY[inst.id]; if(!sig) return;
    const player = getCombatant("player");
    const aliveE = combat.combatants.filter(c=>!c.isPlayer&&c.hp>0);
    const target = aliveE[0];

    if(sig.combatEffect==="incapacitate"){
      if(!target) return;
      cLog(`You trigger ${sig.name} — a focused beam drops ${target.name} instantly!`,"player");
      target.hp=0; cLog(`${target.name} is incapacitated!`,"system");
      if(checkEnd("incapacitate")) return;
      advanceTurn(); runLoop(); return;
    }
    if(sig.combatEffect==="blind_stun"){
      if(!target) return;
      const uses=player.playerFlashUses||0;
      const chance=uses===0?100:Math.max(10,70-(uses-1)*30);
      player.playerFlashUses=(player.playerFlashUses||0)+1;
      if(Math.floor(Math.random()*100)+1<=chance){
        cLog(`You trigger ${sig.name} — ${target.name} is blinded!`,"player");
        target.stunTurns=2; cLog(`${target.name} stunned for 2 turns.`,"system");
      } else { cLog(`You trigger ${sig.name} again — ${target.name} was ready. No effect.`); }
      advanceTurn(); runLoop(); return;
    }
    if(sig.combatEffect==="slam"){
      if(!target) return;
      const dmg=Math.max(2,Math.floor(5+(state.competencies.sigil||0)*3+Math.random()*8));
      target.hp=Math.max(0,target.hp-dmg);
      cLog(`You unleash Slam — ${target.name} takes ${dmg} damage!`,"player");
      if(target.hp<=0){ cLog(`${target.name} is defeated!`,"system"); if(checkEnd()) return; }
      advanceTurn(); runLoop(); return;
    }
    if(sig.combatEffect==="haywire"){
      if(!target) return;
      if(target.hasLifeSigil){
        const dmg=Math.max(20,Math.floor(target.maxHp*0.6+Math.random()*15));
        target.hp=Math.max(0,target.hp-dmg); target.hasLifeSigil=false;
        cLog(`Haywire surges through ${target.name}'s Life sigil — ${dmg} damage!`,"player");
      } else {
        const dmg=Math.max(3,Math.floor(6+(state.competencies.sigil||0)*2+Math.random()*6));
        target.hp=Math.max(0,target.hp-dmg);
        cLog(`You trigger Haywire — ${target.name} takes ${dmg} damage.`,"player");
      }
      if(target.hp<=0){ cLog(`${target.name} is defeated!`,"system"); if(checkEnd()) return; }
      advanceTurn(); runLoop(); return;
    }
    if(sig.combatEffect==="shadow"){
      if(player.shadowActive){ cLog(`You're already shrouded in shadow.`); combat.menu="main"; forceUpdate(n=>n+1); return; }
      player.shadowActive=true;
      const lowLevel = aliveE.every(e=>(e.combat||1)<=4);
      if(lowLevel&&Math.random()<0.60){ cLog(`Shadow billows around you — the enemies bolt!`,"player"); triggerEnd("flee"); return; }
      cLog(`Shadow billows around you — enemies are unsettled.`,"player");
      player.enemyMissBonus=(player.enemyMissBonus||0)+15;
      advanceTurn(); runLoop(); return;
    }
    if(sig.combatEffect==="invisibility"){
      if(player.invisibilityActive){ cLog(`You're still invisible.`); combat.menu="main"; forceUpdate(n=>n+1); return; }
      player.invisibilityActive=true;
      if(Math.random()<0.75){ cLog(`You vanish — enemies completely lose track of you!`,"player"); triggerEnd("flee"); return; }
      cLog(`You fade from sight, but they're keeping too close.`,"player");
      player.enemyMissBonus=(player.enemyMissBonus||0)+25;
      advanceTurn(); runLoop(); return;
    }
    if(sig.combatEffect==="static_shock"){
      if(!target) return;
      const ps=state.competencies.sigil||0; const ec=target.combat||1;
      const pr=Math.floor(Math.random()*100)+1; const er=Math.floor(Math.random()*100)+1;
      const margin=(pr+ps*3)-(er+ec*3);
      cLog(`You discharge Static into ${target.name}! (Sigil ${ps}[${pr}] vs Combat ${ec}[${er}])`,"player");
      if(margin>=30){ target.hp=0; cLog(`Massive shock — ${target.name} drops!`,"player"); if(checkEnd("incapacitate")) return; advanceTurn(); runLoop(); }
      else if(margin>0){ target.stunTurns=3; cLog(`${target.name} is stunned for 3 turns.`,"system"); advanceTurn(); runLoop(); }
      else { cLog(`${target.name} shrugs off the shock.`); advanceTurn(); runLoop(); }
      return;
    }
    if(sig.combatEffect==="air_blades"){
      if(!target) return;
      const dmg=Math.max(3,Math.floor(4+(state.competencies.sigil||0)*3+Math.random()*10));
      target.hp=Math.max(0,target.hp-dmg);
      cLog(`You fire Air Blades — ${target.name} takes ${dmg} damage!`,"player");
      if(target.hp<=0){ cLog(`${target.name} is defeated!`,"system"); if(checkEnd()) return; }
      advanceTurn(); runLoop(); return;
    }
    if(sig.combatEffect==="shield_raise"){
      if(player.shieldActive){ cLog(`Shield is already raised.`); combat.menu="main"; forceUpdate(n=>n+1); return; }
      player.shieldActive=true;
      cLog(`You raise the Shield — kinetic bubble active. All incoming gunfire and Air Blades will be deflected.`,"player");
      advanceTurn(); runLoop(); return;
    }
    cLog(`You activate ${sig.name}.`); combat.menu="main"; forceUpdate(n=>n+1);
  }

  function playerChannelEssentia() {
    const bestType = ESSENTIA_TYPES.reduce((b,t)=>(state.essentia[t]||0)>(state.essentia[b]||0)?t:b, ESSENTIA_TYPES[0]);
    if((state.essentia[bestType]||0)<=0){ cLog(`No essentia to channel.`); combat.menu="main"; forceUpdate(n=>n+1); return; }
    const aliveE = combat.combatants.filter(c=>!c.isPlayer&&c.hp>0);
    const target = aliveE[0]; if(!target) return;
    // Quick channel: burn 1 unit, deal scaled damage — no dispatch needed (state.essentia not mutated here;
    // we log it and note it; actual deduction done on COMBAT_END via side-effect note)
    const dmg=Math.max(2,Math.floor(6+(state.competencies.sigil||0)*4+Math.random()*8));
    target.hp=Math.max(0,target.hp-dmg);
    combat._essentiaChanneled = (combat._essentiaChanneled||0)+1;
    combat._essentiaType = bestType;
    cLog(`You channel 1 ${bestType} essentia — ${target.name} takes ${dmg} damage!`,"player");
    if(target.hp<=0){ cLog(`${target.name} is defeated!`,"system"); if(checkEnd()) return; }
    advanceTurn(); runLoop();
  }

  function playerRun() {
    const chance=Math.min(90,50+(state.competencies.combat||0)*5);
    const roll=Math.floor(Math.random()*100)+1;
    if(roll<=chance){ cLog(`You break away and escape!`,"player"); triggerEnd("flee"); }
    else { cLog(`You try to flee — blocked!`); advanceTurn(); runLoop(); }
  }
  function playerLowerShield() {
    const player=getCombatant("player");
    if(!player?.shieldActive){ cLog(`Shield is already down.`); combat.menu="main"; forceUpdate(n=>n+1); return; }
    player.shieldActive=false;
    cLog(`You lower the Shield — you're free to act.`,"player");
    combat.menu="main"; forceUpdate(n=>n+1);
  }

  function closeCombat() {
    // Handle event context resume
    const ctx = combat.context;
    const result = combat.result;
    const channeled = combat._essentiaChanneled||0;
    const essType = combat._essentiaType;
    setCombat(null);
    if(ctx?.type==="event" && state.activeEvent){
      // Advance event with combat result
      dispatch({ type:ACT.ADVANCE_EVENT, nextStateKey:ctx.returnState, ctxPatch:{ combatSucceeded: result==="win"||result==="incapacitate" } });
    }
    // Deduct channeled essentia (clean deduction — no money exchange)
    if(channeled>0 && essType){
      dispatch({ type:ACT.DEDUCT_ESSENTIA, essentiaType:essType, amount:channeled });
    }
    dispatch({ type:ACT.ADVANCE_TIME });
  }

  // ── Render ──────────────────────────────────
  const player   = getCombatant("player");
  const actor    = currentActor();
  const aliveE   = combat.combatants.filter(c=>!c.isPlayer&&c.hp>0);
  const cs       = state.competencies.combat||0;
  const sigilLoad = equippedCapacityUsed(state);

  // Turn-order strip
  const strip = combat.turnOrder.map((entry,i)=>{
    const c = getCombatant(entry.combatantId); if(!c) return null;
    const isDone = i<combat.turnIndex;
    const isCur  = i===combat.turnIndex && !combat.over;
    const label  = c.isAlly?"ALLY":c.isPlayer?"YOU":c.name.split(" ")[0].substring(0,4).toUpperCase();
    const cls    = `turn-pip${c.isAlly?" pip-ally":c.isPlayer?" pip-player":" pip-enemy"}${isCur?" pip-current":""}${isDone?" pip-done":""}`;
    return <div key={i} className={cls} title={c.name}>{label}</div>;
  });

  // Combatant cards
  const cards = combat.combatants.map(c=>{
    const pct = Math.max(0,Math.min(100,(c.hp/c.maxHp)*100));
    const isCur = !combat.over && actor?.id===c.id;
    const isDead = c.hp<=0;
    const barCol = c.isPlayer?"var(--good)":c.isAlly?"var(--kinetic)":"#f87171";
    return(
      <div key={c.id} className={`combatant-card${c.isPlayer?" is-player":c.isAlly?"":" is-enemy"}${isCur?" active-turn":""}${isDead?" is-dead":""}`}>
        <div className="combatant-name">{c.name}</div>
        {c.isPlayer&&c.shieldActive&&<div className="combatant-tag" style={{color:"var(--kinetic)"}}>🛡️ Shield ✦</div>}
        {c.isPlayer&&(c.shadowActive||c.invisibilityActive)&&<div className="combatant-tag" style={{color:"var(--primal)"}}>👤 Concealed</div>}
        {(c.stunTurns>0||(c.playerStunTurns||0)>0)&&<div className="combatant-tag">😵 Stunned {c.stunTurns||(c.playerStunTurns||0)}t</div>}
        <div className="combatant-tag">AGI {c.agility||1}{isCur?" · ACTING":""}</div>
        <div className="bar-bg" style={{marginTop:4}}>
          <div className="bar-fill" style={{width:pct+"%",background:isDead?"#555":barCol,transition:"width .3s"}}/>
        </div>
        <div className="combatant-hp">{isDead?"✕ Defeated":`${c.hp} / ${c.maxHp}`}</div>
      </div>
    );
  });

  // ── Action menus ──
  let actions;
  if(combat.over){
    actions=(
      <div className="combat-actions">
        <button className="primary" onClick={closeCombat}>Continue</button>
      </div>
    );
  } else if(combat.menu==="main"){
    actions=(
      <div className="combat-actions">
        <div className="combat-actions-grid">
          <button onClick={()=>{ combat.menu="fight"; forceUpdate(n=>n+1); }}>⚔️ Fight</button>
          <button onClick={()=>{ combat.menu="sigil"; forceUpdate(n=>n+1); }}>🔮 Sigil</button>
          <button onClick={playerRun}>🏃 Run</button>
          <button onClick={()=>{ combat.menu="info"; forceUpdate(n=>n+1); }}>📋 Info</button>
        </div>
      </div>
    );
  } else if(combat.menu==="fight"){
    const bareMin=Math.max(1,3+Math.floor(cs*2.5));
    const bareMax=bareMin+6;
    actions=(
      <div className="combat-actions">
        <div style={{fontSize:".72rem",color:"var(--muted)",marginBottom:6}}>Choose your attack:</div>
        <button onClick={()=>playerAttack(null)}>
          👊 Bare hands — Dmg {bareMin}–{bareMax}, always hits
        </button>
        {(state.ownedWeapons||[]).map(wid=>{
          const w=WEAPONS[wid]; if(!w) return null;
          if(w.nonlethal){
            const wMin=Math.floor(bareMin*w.dmgMultiplier); const wMax=Math.floor(bareMax*w.dmgMultiplier);
            return<button key={wid} onClick={()=>playerAttack(wid)}>{w.emoji} {w.name} — Dmg {wMin}–{wMax}, always hits</button>;
          }
          const cb=cs*2; const acc=Math.min(97,Math.round(w.accuracy+cs*(w.ranged?2:1)));
          const pierce=w.armorPiercing?", pierces armour":""; const burst=w.burst?", burst":"";
          return<button key={wid} onClick={()=>playerAttack(wid)}>{w.emoji} {w.name} — Dmg {w.dmgMin+cb}–{w.dmgMax+cb}, {acc}% acc{pierce}{burst}</button>;
        })}
        <div className="combat-back-row"><button onClick={()=>{ combat.menu="main"; forceUpdate(n=>n+1); }}>⬅ Back</button></div>
      </div>
    );
  } else if(combat.menu==="sigil"){
    const bestType = ESSENTIA_TYPES.reduce((b,t)=>(state.essentia[t]||0)>(state.essentia[b]||0)?t:b, ESSENTIA_TYPES[0]);
    const equipped = SIGIL_SLOTS
      .map(sl=>{ const k=state.equipped[sl]; if(!k) return null; const inst=(state.sigils||[]).find(s=>s.key===k); return inst?{slot:sl,inst}:null; })
      .filter(Boolean)
      .filter((x,i,a)=>a.findIndex(y=>y.inst.key===x.inst.key)===i); // dedup

    actions=(
      <div className="combat-actions">
        <div style={{fontSize:".72rem",color:"var(--muted)",marginBottom:4}}>
          Sigil load: {sigilLoad} / {state.essentiaLevel} — passives toggle; active-use fires on turn.
        </div>
        {equipped.map(({inst})=>{
          const sig=SIGIL_REGISTRY[inst.id]; if(!sig) return null;
          const isMending=sig.passive==="mending";
          const isPassive=sig.triggeredOnly&&!isMending;
          const isOn=isPassive&&!!(state.activePassives||{})[inst.key];
          const isShield=!!sig.shieldSigil;
          const shieldUp=!!(player?.shieldActive);
          if(isMending) return<button key={inst.key} disabled>🌿 {SIGIL_REGISTRY[inst.id]?.name} (Rest only)</button>;
          if(isPassive){
            return<button key={inst.key} onClick={()=>{ dispatch({type:ACT.TOGGLE_PASSIVE,instanceKey:inst.key}); forceUpdate(n=>n+1); }}>
              {inst.id==="strength_sigil"?"💪":inst.id==="iron_fist"?"🥊":inst.id.includes("invisib")||inst.id.includes("matter_inv")?"👤":inst.id==="lightfoot"||inst.id==="stutter"?"🌪️":inst.id==="reflex"?"⚡":"✦"}{" "}
              {SIGIL_REGISTRY[inst.id]?.name} — {isOn?"Active ✦ — Deactivate":"Inactive — Activate"}
            </button>;
          }
          if(isShield) return<button key={inst.key} onClick={shieldUp?playerLowerShield:()=>playerUseSigil(inst.key)}>
            🛡️ Shield — {shieldUp?"Lower (free move)":"Raise Shield (costs turn)"}
          </button>;
          return<button key={inst.key} onClick={()=>playerUseSigil(inst.key)}>
            🔮 {SIGIL_REGISTRY[inst.id]?.name} — Fire
          </button>;
        })}
        <button onClick={playerChannelEssentia}>
          ⚡ Channel {bestType} essentia ({state.essentia[bestType]||0} available)
        </button>
        <div className="combat-back-row"><button onClick={()=>{ combat.menu="main"; forceUpdate(n=>n+1); }}>⬅ Back</button></div>
      </div>
    );
  } else if(combat.menu==="info"){
    const carried=(state.ownedWeapons||[]).map(id=>WEAPONS[id]).filter(Boolean);
    const armour=state.equippedArmour?BODY_ARMOUR[state.equippedArmour]:null;
    actions=(
      <div className="combat-actions">
        <div style={{fontSize:".78rem",color:"var(--muted)",lineHeight:1.5}}>
          <div><b style={{color:"var(--text)"}}>Weapons:</b> {carried.length?carried.map(w=>w.name).join(", "):"None"}</div>
          <div><b style={{color:"var(--text)"}}>Armour:</b> {armour?`${armour.name} (−${Math.round(armour.damageReduction*100)}% phys)`:"None"}</div>
          <div><b style={{color:"var(--text)"}}>Dodge:</b> {Math.min(40,cs*4)}% + miss bonuses</div>
          <div><b style={{color:"var(--text)"}}>Flee chance:</b> {Math.min(90,50+cs*5)}%</div>
        </div>
        <div className="combat-back-row"><button onClick={()=>{ combat.menu="main"; forceUpdate(n=>n+1); }}>⬅ Back</button></div>
      </div>
    );
  }

  const roundLabel = combat.over ? `Combat Over — ${combat.result==="lose"?"Defeated":combat.result==="flee"?"Escaped":"Victory"}` : `Round ${combat.round}`;

  return(
    <div className="combat-overlay">
      <div className="combat-header">
        <h2>⚔️ Encounter</h2>
        <span className="combat-round-label">{roundLabel}</span>
      </div>
      <div className="turn-strip">{strip}</div>
      <div className="combat-arena">{cards}</div>
      <div className="combat-log" ref={logRef}>
        {combat.log.map((entry,i)=>(
          <div key={i} className={`combat-log-entry${entry.cls?" "+entry.cls:""}`}>{entry.text}</div>
        ))}
      </div>
      {actions}
    </div>
  );
}
