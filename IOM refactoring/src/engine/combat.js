import { SIGIL_SLOTS, ESSENTIA_TYPES } from '@/data/constants';
import { SIGIL_REGISTRY } from '@/data/sigils';
import { FIXED_PASSIVE_BONUS } from '@/data/enemies';

export function getPassiveBonus(passiveType, state) {
  let total = 0;
  SIGIL_SLOTS.forEach(slot => {
    const key = state.equipped[slot]; if(!key) return;
    const inst = (state.sigils||[]).find(s=>s.key===key); if(!inst) return;
    const sig = SIGIL_REGISTRY[inst.id]; if(!sig) return;
    if(sig.passive===passiveType && (state.activePassives||{})[inst.key]){
      total += inst.power || FIXED_PASSIVE_BONUS[passiveType] || 0;
    }
  });
  return total;
}

export function applyEnemyPassives(baseAtk, sigilIds) {
  const passiveIds = ["iron_fist","strength_sigil"];
  const count = sigilIds.filter(id=>passiveIds.includes(id)).length;
  if(count===0) return [...baseAtk];
  const mult = 1 + count * 0.10;
  return [Math.round(baseAtk[0]*mult), Math.round(baseAtk[1]*mult)];
}

export function buildTurnOrder(combatants) {
  const alive = combatants.filter(c=>c.hp>0);
  if(!alive.length) return [];
  const minAgi = Math.min(...alive.map(c=>c.agility||1));
  const remaining = alive.map(c=>({
    c, slots:Math.max(1,Math.floor((c.agility||1)/Math.max(1,minAgi))), used:0
  }));
  const total = remaining.reduce((s,x)=>s+x.slots, 0);
  const order = [];
  for(let i=0;i<total;i++){
    let best = null;
    for(const x of remaining){
      if(x.used>=x.slots) continue;
      const score = (x.slots-x.used)/x.slots;
      const bestScore = best ? (best.slots-best.used)/best.slots : -1;
      if(!best || score>bestScore || (score===bestScore && (x.c.agility||1)>(best.c.agility||1))) best=x;
    }
    if(!best) break;
    best.used++;
    order.push({ combatantId:best.c.id });
  }
  return order;
}

export function initCombat(state, templateOrTemplates, context, allyTemplates) {
  const templates = Array.isArray(templateOrTemplates)?templateOrTemplates:[templateOrTemplates];
  const agiBonus = getPassiveBonus("agility", state);
  const playerAgi = Math.round((state.competencies.agility||2)*(1+agiBonus/100));

  const combatants = [
    {
      id:"player", isPlayer:true, name:"You",
      hp:state.health, maxHp:state.maxHealth, agility:playerAgi,
      stunTurns:0, playerStunTurns:0,
      shieldActive:false, shadowActive:false, invisibilityActive:false,
      enemyMissBonus:0, playerFlashUses:0,
    },
    ...(allyTemplates||[]).map((ally,i)=>({
      id:"ally_"+i, isPlayer:true, isAlly:true,
      name:ally.name, hp:ally.hp, maxHp:ally.hp,
      atk:ally.atk||[5,10], combat:ally.combat||2, agility:ally.agility||2,
      sigils:ally.sigils||[], stunTurns:0, playerStunTurns:0,
    })),
    ...templates.map((t,i)=>({
      id:"enemy_"+i, isPlayer:false, name:t.name,
      hp:t.hp, maxHp:t.hp,
      atk:applyEnemyPassives(t.atk||[3,8], t.sigils||[]),
      combat:t.combat||1, agility:t.agility||2,
      sigils:t.sigils||[],
      hasLifeSigil:(t.sigils||[]).some(id=>["strength_sigil","mending_sigil"].includes(id)),
      stunTurns:0, enemyFlashUses:0, _template:t,
    })),
  ];

  const firstLog = templates.map(t=>{
    const base = `${t.name} confronts you!`;
    const sigilNote = (t.sigils||[]).length ? ` Carries: ${(t.sigils||[]).map(id=>SIGIL_REGISTRY[id]?.name||id).join(", ")}.` : "";
    return base+sigilNote;
  });

  return {
    combatants,
    turnOrder: buildTurnOrder(combatants),
    turnIndex:0, round:1,
    log: firstLog,
    menu:"main", over:false,
    result:null,        // "win"|"incapacitate"|"flee"|"lose"
    drainSucceeded:false,
    turnCount:0, backupArrived:false,
    context: context||null,
  };
}
