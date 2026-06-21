import { ESSENTIA_TYPES, SIGIL_SLOTS, RANKS, RANK_ESSENTIA_YIELD, RANK_SELL_PRICE, FACTIONS, SECTORS, PLAYER_FACTION } from '@/data/constants';
import { SIGIL_REGISTRY, CRAFTABLE_SIGILS } from '@/data/sigils';
import { WEAPONS, BODY_ARMOUR } from '@/data/weapons';
import { ESSENTIA_BUYERS} from '@/data/economy'
import { ESSENTIA_BASE_PRICE } from '@/data/constants';
import { PROTECTION_OPTIONS, HOME_TIERS, BARRACKS_GUARD_TIERS, KENNEL_DOG_TIERS } from '@/data/wells_protection';
import { DRAIN_ENEMIES, RAIDER_SQUADS, HOME_RAIDERS, GANG_FIGHTERS, BACKUP_SQUADS } from '@/data/enemies';
import { BACKGROUNDS, TRAINING_CONFIG } from '@/data/backgrounds';
import { addLogEntry, ledgerAdd } from '@/engine/log';
import { trainingChance, sigilCraftChance, sigilLearnChance, hasSigilAnywhere, sigilCapacityCost, equippedCapacityUsed } from '@/engine/helpers';
import { defaultState, migrateState, applyDailyUpkeep, rollScanResult, applyEventEffects } from '@/engine/state';
import { ACT, rollContactRequests, rollNightContactRequests } from '@/engine/time';
import { rollRandomEvent } from '@/events/randomEvents';
import { EVENT_DEFINITIONS, FAVOUR_OPTIONS } from '@/events/contactEvents';

export function gameReducer(state, action) {
  switch(action.type) {
    case ACT.START_GAME:
      return defaultState(action.bgKey, action.debugConfig||null);

    case ACT.ADVANCE_TIME: {
      let s={ ...state, shiftIndex:state.shiftIndex+1 };
      if(s.shiftIndex>=3){
        s={ ...s, shiftIndex:0, day:s.day+1 };
        s=applyDailyUpkeep(s);
        s=rollContactRequests(s);
        s=addLogEntry(s,`Dawn breaks on Day ${s.day}.`,"info");
      } else if(s.shiftIndex===2) {
        s=rollNightContactRequests(s);
      }
      // Fire a random event (5% chance, one per day)
      if(!s.pendingRandomEvent) {
        const evt = rollRandomEvent(s);
        if(evt) {
          const flags = { ...(s.randomEventFlags||{}), [evt.def.id]:{ cooldownUntil: s.day+(evt.def.cooldown||30) } };
          s = { ...s, randomEventFiredToday:true, randomEventFlags:flags, pendingRandomEvent:{ def:evt.def, scenarioText:evt.scenarioText, ctx:evt.ctx } };
        }
      }
      return s;
    }

    case ACT.ADD_LOG:
      return addLogEntry(state, action.text, action.logType||"info");

    case ACT.SCAN_SECTOR: {
      const result=rollScanResult(state, action.sector);
      if(!result.success) return addLogEntry(state,`Scan of ${action.sector} found nothing. (Roll ${result.roll} > ${result.chance}%)`,"fail");
      const s={...state,wells:[...state.wells,result.well]};
      return addLogEntry(s,`Scan of ${action.sector} successful! Located a ${result.well.rank}-rank ${result.well.type} Well. (Roll ${result.roll} ≤ ${result.chance}%)`,"success");
    }

    case ACT.REST: {
      const mendingBonus = hasSigilAnywhere("mending_sigil",state)?20:0;
      const healAmt=Math.floor(15*(1+mendingBonus/100));
      const before=state.health;
      if(before>=state.maxHealth) return addLogEntry(state,"You rest — already in full health.","info");
      const health=Math.min(state.maxHealth,before+healAmt);
      return addLogEntry({...state,health},`You rest and recover. Health ${before} → ${health}.`,"success");
    }

    case ACT.TRAIN: {
      const { skillKey } = action;
      const cfg=TRAINING_CONFIG[skillKey];
      if(!cfg||cfg.trainable===false) return state;
      const current=state.competencies[skillKey]||0;
      const chance=trainingChance(current);
      const roll=Math.floor(Math.random()*100)+1;
      if(roll<=chance){
        const comp={...state.competencies,[skillKey]:current+1};
        return addLogEntry({...state,competencies:comp},`${cfg.flavor} Your efforts pay off — ${cfg.label} increases to ${current+1}! (Roll ${roll} ≤ ${chance}%)`,"success");
      }
      return addLogEntry(state,`${cfg.flavor} No real improvement this time. (Roll ${roll} > ${chance}%)`,"fail");
    }

    case ACT.SELL_WELL: {
      const w=state.wells.find(x=>x.id===action.wellId);
      if(!w) return state;
      const price=RANK_SELL_PRICE[w.rank]||0;
      const wells=state.wells.filter(x=>x.id!==action.wellId);
      const s=ledgerAdd({...state,wells},price,`Sold ${w.rank} ${w.type} Well`);
      return addLogEntry(s,`Sold the ${w.rank}-rank ${w.type} Well in ${w.sector} for £${price.toLocaleString()}.`,"success");
    }

    case ACT.REMOVE_WELL: {
      const wells=state.wells.filter(x=>x.id!==action.wellId);
      return { ...state, wells };
    }

    case ACT.CLAIM_WELL: {
      const wells = state.wells.map(w => {
        if(w.id !== action.wellId) return w;
        return {
          ...w,
          security: {
            ...w.security,
            tier:"none", claimable:false, playerOwned:true,
            playerProtection:{ cameras:null, alarms:null, guards:"guard_none" },
          },
          perceivedTier:"none",
          perceivedGuards:"No guards — your well.",
          perceivedDesc:"Claimed and under your control. No security installed.",
        };
      });
      const w = wells.find(x=>x.id===action.wellId);
      if(!w) return state;
      return addLogEntry({...state,wells},
        `Claimed the ${w.rank}-rank ${w.type} Well in ${w.sector}. It's yours now.`,"success");
    }

    case ACT.EQUIP_SIGIL: {
      const equipped={...state.equipped};
      SIGIL_SLOTS.forEach(sl=>{ if(equipped[sl]===action.instanceKey) equipped[sl]=null; });
      equipped[action.slot]=action.instanceKey;
      return { ...state, equipped };
    }

    case ACT.UNEQUIP_SIGIL: {
      const key=state.equipped[action.slot];
      const ap={...state.activePassives}; if(key) delete ap[key];
      return { ...state, equipped:{...state.equipped,[action.slot]:null}, activePassives:ap };
    }

    case ACT.TOGGLE_PASSIVE: {
      const ap={...state.activePassives};
      if(ap[action.instanceKey]) delete ap[action.instanceKey];
      else ap[action.instanceKey]=true;
      return { ...state, activePassives:ap };
    }

    case ACT.CRAFT_SIGIL: {
      const recipe=CRAFTABLE_SIGILS[action.sigilId]; if(!recipe) return state;
      let ess={...state.essentia};
      let powerBonus=null;
      if(recipe.scaling){
        const amt=action.essentiaAmount||recipe.scaling.min;
        ess[recipe.essentiaType]=(ess[recipe.essentiaType]||0)-amt;
        powerBonus=(recipe.scaling.baseBonus||0)+(amt/recipe.scaling.unit)*recipe.scaling.bonusPerUnit;
      } else {
        Object.entries(recipe.essentiaCost).forEach(([t,a])=>{ ess[t]=(ess[t]||0)-a; });
      }
      const chance=sigilCraftChance(action.sigilId,state.competencies,state.affinities);
      const roll=Math.floor(Math.random()*100)+1;
      if(roll<=chance){
        const key="sig_"+Date.now()+"_"+Math.floor(Math.random()*10000);
        const sigils=[...state.sigils,{key,id:action.sigilId,power:powerBonus}];
        const label=powerBonus!==null?`${recipe.name} (+${powerBonus}%)`:recipe.name;
        return addLogEntry({...state,essentia:ess,sigils},`Sigil-Making success! Crafted a ${label}. (Roll ${roll} ≤ ${chance}%)`,"success");
      }
      return addLogEntry({...state,essentia:ess},`Craft attempt failed — essentia consumed. (Roll ${roll} > ${chance}%)`,"fail");
    }

    case ACT.UNLOCK_CONTACT: {
      if(state.contacts.find(c=>c.id===action.contactData.id)) return state;
      return { ...state, contacts:[...state.contacts,{ requestChanceModifier:null,...action.contactData }] };
    }

    case ACT.UPDATE_CONTACT: {
      const contacts=state.contacts.map(c=>c.id===action.contactId?{...c,...action.changes}:c);
      return { ...state, contacts };
    }

    case ACT.APPLY_RANDOM_EVENT: {
      // action.resolvedState is the full new state returned by choice.resolve(state, ctx)
      // Strip the _eventResult UI key and clear pendingRandomEvent
      const { _eventResult, ...rest } = action.resolvedState;
      return { ...rest, pendingRandomEvent: null };
    }

    // ── Gear ──
    case ACT.BUY_WEAPON: {
      const w=WEAPONS[action.weaponId]; if(!w) return state;
      if(state.money<w.cost) return addLogEntry(state,`Not enough money to buy ${w.name}.`,"fail");
      if((state.ownedWeapons||[]).includes(w.id)) return addLogEntry(state,`You already own a ${w.name}.`,"info");
      const s=ledgerAdd({...state,ownedWeapons:[...(state.ownedWeapons||[]),w.id]},-w.cost,`Bought ${w.name}`);
      return addLogEntry(s,`Bought ${w.emoji} ${w.name} for £${w.cost}.`,"success");
    }
    case ACT.BUY_ARMOUR: {
      const a=BODY_ARMOUR[action.armourId]; if(!a) return state;
      if(state.money<a.cost) return addLogEntry(state,`Not enough money to buy ${a.name}.`,"fail");
      if((state.ownedArmour||[]).includes(a.id)) return addLogEntry(state,`You already own ${a.name}.`,"info");
      const s=ledgerAdd({...state,ownedArmour:[...(state.ownedArmour||[]),a.id]},-a.cost,`Bought ${a.name}`);
      return addLogEntry(s,`Bought ${a.emoji} ${a.name} for £${a.cost}.`,"success");
    }
    case ACT.EQUIP_ARMOUR:
      return addLogEntry({...state,equippedArmour:action.armourId},`Equipped ${BODY_ARMOUR[action.armourId]?.name||action.armourId}.`,"info");
    case ACT.UNEQUIP_ARMOUR:
      return addLogEntry({...state,equippedArmour:null},"Armour unequipped.","info");

    // ── Economy ──
    case ACT.SELL_ESSENTIA: {
      const {buyer:bk,amounts}=action;
      const buyer=ESSENTIA_BUYERS[bk]; if(!buyer) return state;
      let s={...state}; let total=0; const parts=[];
      for(const[t,qty] of Object.entries(amounts)){
        if(!qty||qty<=0) continue;
        if((s.essentia[t]||0)<qty) return addLogEntry(state,`Not enough ${t} essentia.`,"fail");
        const price=Math.floor(ESSENTIA_BASE_PRICE[t]*buyer.priceMultiplier)*qty;
        s={...s,essentia:{...s.essentia,[t]:(s.essentia[t]||0)-qty}};
        total+=price; parts.push(`${qty} ${t}`);
      }
      if(!parts.length) return state;
      s=ledgerAdd(s,total,`Sold essentia to ${buyer.name}`);
      return addLogEntry(s,`Sold ${parts.join(", ")} to ${buyer.name} for £${total.toLocaleString()}.`,"success");
    }
    case ACT.BUY_ESSENTIA: {
      const {buyer:bk, essentiaType:type, amount}=action;
      const buyer=ESSENTIA_BUYERS[bk]; if(!buyer) return state;
      const price=Math.ceil(ESSENTIA_BASE_PRICE[type]*(bk==="linford"?1.15:1.30));
      const total=price*amount;
      if(state.money<total) return addLogEntry(state,`Need £${total.toLocaleString()} to buy ${amount} ${type} essentia.`,"fail");
      const s=ledgerAdd({...state,essentia:{...state.essentia,[type]:(state.essentia[type]||0)+amount}},-total,`Bought ${amount} ${type} (${buyer.name})`);
      return addLogEntry(s,`Bought ${amount} ${type} essentia from ${buyer.name} for £${total.toLocaleString()}.`,"success");
    }

    // ── Well Protection ──
    case ACT.BUY_PROTECTION: {
      const{wellId,category,optionId,cost}=action;
      if(cost>0&&state.money<cost) return addLogEntry(state,"Not enough money for that option.","fail");
      const wells=state.wells.map(w=>{
        if(w.id!==wellId) return w;
        const pp={...(w.security.playerProtection||{cameras:null,alarms:null,guards:"guard_none"}),[category]:optionId};
        const gMap={guard_none:"none",guard_light:"light",guard_medium:"medium",guard_heavy:"heavy"};
        const gId=pp.guards||"guard_none"; let nt=gMap[gId]||"none";
        if(nt==="none"&&(pp.cameras||pp.alarms)) nt="light";
        return{...w,security:{...w.security,tier:nt,playerOwned:true,playerProtection:pp},perceivedTier:nt,perceivedDesc:"Protected under your arrangements.",perceivedGuards:PROTECTION_OPTIONS.guards.find(g=>g.id===gId)?.label||"No guards"};
      });
      const opt=(PROTECTION_OPTIONS[category]||[]).find(o=>o.id===optionId);
      let s=cost>0?ledgerAdd({...state,wells},-cost,`Well protection: ${opt?.label||optionId}`):{...state,wells};
      return addLogEntry(s,`Arranged ${opt?.label||optionId} for a well.`,"success");
    }

    // ── Contacts & Events ──
    case ACT.CALL_FAVOUR: {
      const{contactId,optionId}=action;
      const contact=state.contacts.find(c=>c.id===contactId); if(!contact) return state;
      const option=FAVOUR_OPTIONS.find(f=>f.id===optionId); if(!option) return state;
      const result=option.resolve(contact,state);
      let s={...state};
      if(result.money) s=ledgerAdd(s,result.money,`Favour (${contact.name})`);
      if(result.relationCost){
        const contacts=s.contacts.map(c=>c.id===contactId?{...c,relation:Math.max(-100,c.relation-result.relationCost)}:c);
        s={...s,contacts};
      }
      return addLogEntry(s,result.logEntry||`Called a favour from ${contact.name}.`,result.type||"info");
    }
    case ACT.RECRUIT_CONTACT: {
      const contact=state.contacts.find(c=>c.id===action.contactId); if(!contact) return state;
      if(contact.relation<50) return addLogEntry(state,`${contact.name} doesn't trust you enough yet (need 50, have ${contact.relation}).`,"fail");
      const chance=Math.max(20,Math.min(95,30+(contact.relation-50)));
      const roll=Math.floor(Math.random()*100)+1;
      if(roll<=chance){
        const contacts=state.contacts.map(c=>c.id===action.contactId?{...c,affiliation:PLAYER_FACTION}:c);
        return addLogEntry({...state,contacts},`${contact.name} agrees to join your operation. (Roll ${roll} ≤ ${chance}%)`,"success");
      }
      return addLogEntry(state,`${contact.name} isn't ready to commit yet. (Roll ${roll} > ${chance}%)`,"fail");
    }
    case ACT.OPEN_EVENT: {
      const def=EVENT_DEFINITIONS[action.eventId]; if(!def) return state;
      const sk=action.stateKey||def.start||"start";
      const ctx=action.ctx||{};
      const sd=def.states[sk]; if(!sd) return state;
      let s={...state,activeEvent:{eventId:action.eventId,stateKey:sk,ctx}};
      if(sd.onEnter) sd.onEnter(ctx,s);
      if(sd.onEnterEffect){ s=applyEventEffects(s,sd.onEnterEffect(ctx,s)); }
      return s;
    }
    case ACT.ADVANCE_EVENT: {
      if(!state.activeEvent) return state;
      const{eventId,ctx:pc}=state.activeEvent;
      const def=EVENT_DEFINITIONS[eventId]; if(!def) return state;
      const rawNext=action.nextStateKey;
      const sk=typeof rawNext==="function"?rawNext(pc):rawNext;
      const newCtx={...pc,...(action.ctxPatch||{})};
      if(!sk){
        const pend=(state.pendingContactRequests||[]).filter(r=>!(r.eventId===eventId&&r.contactId===def.contactId));
        return{...state,activeEvent:null,pendingContactRequests:pend};
      }
      const sd=def.states[sk]; if(!sd) return{...state,activeEvent:null};
      let s={...state,activeEvent:{eventId,stateKey:sk,ctx:newCtx}};
      if(sd.onEnter) sd.onEnter(newCtx,s);
      if(sd.onEnterEffect){ s=applyEventEffects(s,sd.onEnterEffect(newCtx,s)); }
      if(sd.terminal){
        const pend=(s.pendingContactRequests||[]).filter(r=>!(r.eventId===eventId&&r.contactId===def.contactId));
        s={...s,activeEvent:null,pendingContactRequests:pend};
      }
      return s;
    }
    case ACT.CLOSE_EVENT: {
      const ae=state.activeEvent;
      if(!ae) return{...state,activeEvent:null};
      const pend=(state.pendingContactRequests||[]).filter(r=>!(r.eventId===ae.eventId));
      return{...state,activeEvent:null,pendingContactRequests:pend};
    }

    // ── Home ──
    case ACT.MOVE_HOME: {
      const tier=HOME_TIERS[action.tierId]; if(!tier) return state;
      if(state.money<tier.movingCost) return addLogEntry(state,`Need £${tier.movingCost.toLocaleString()} to move.`,"fail");
      let s=tier.movingCost>0?ledgerAdd(state,-tier.movingCost,"Moving costs"):state;
      s={...s,homeTier:action.tierId,homeSecurityUpgrades:[],homeRenovations:[]};
      return addLogEntry(s,`Moved into a ${tier.name}. Previous upgrades don't transfer.`,"success");
    }
    case ACT.BUY_HOME_UPGRADE: {
      const tier=HOME_TIERS[state.homeTier]; if(!tier) return state;
      const upg=tier.securityUpgrades.find(u=>u.id===action.upgradeId); if(!upg) return state;
      if(state.money<upg.cost) return addLogEntry(state,`Need £${upg.cost.toLocaleString()} for ${upg.label}.`,"fail");
      if((state.homeSecurityUpgrades||[]).includes(upg.id)) return addLogEntry(state,`${upg.label} already installed.`,"info");
      const s=ledgerAdd({...state,homeSecurityUpgrades:[...(state.homeSecurityUpgrades||[]),upg.id]},-upg.cost,`Home upgrade: ${upg.label}`);
      return addLogEntry(s,`Installed ${upg.label}.`,"success");
    }
    case ACT.RENOVATE_ROOM: {
      const tier=HOME_TIERS[state.homeTier]; if(!tier) return state;
      const room=tier.rooms.find(r=>r.id===action.roomId); if(!room) return state;
      const renos=state.homeRenovations||[];
      if(renos.length>=tier.maxRooms) return addLogEntry(state,"No more room slots available.","fail");
      if(state.money<room.cost) return addLogEntry(state,`Need £${room.cost.toLocaleString()} to build ${room.label}.`,"fail");
      const reno={slotId:`slot_${renos.length}`,roomId:room.id,label:room.label,type:room.type,skill:room.skill||null,bonusPct:room.bonusPct||null,guardTier:room.type==="barracks"?"none":null,dogTier:room.type==="kennel"?"none":null,assignedContact:null,essentiaFloor:room.type==="locator"?{}:null,unlockedDogTiers:room.type==="kennel"?["none","guard_dogs","hellhounds"]:null};
      const s=ledgerAdd({...state,homeRenovations:[...renos,reno]},-room.cost,`Built ${room.label}`);
      return addLogEntry(s,`Built ${room.label} for £${room.cost.toLocaleString()}.`,"success");
    }
    case ACT.SET_BARRACKS_TIER: {
      const renos=(state.homeRenovations||[]).map((r,i)=>i===action.idx?{...r,guardTier:action.tierId}:r);
      const gt=BARRACKS_GUARD_TIERS.find(t=>t.id===action.tierId);
      return addLogEntry({...state,homeRenovations:renos},`Barracks set to: ${gt?.label||action.tierId}.`,"info");
    }
    case ACT.SET_KENNEL_TIER: {
      const renos=(state.homeRenovations||[]).map((r,i)=>i===action.idx?{...r,dogTier:action.tierId}:r);
      const dt=KENNEL_DOG_TIERS.find(t=>t.id===action.tierId);
      return addLogEntry({...state,homeRenovations:renos},`Kennel set to: ${dt?.label||action.tierId}.`,"info");
    }

    // ── Combat post-processing ──
    case ACT.COMBAT_END: {
      const { result, combatCtx, finalPlayerHp, loot } = action;
      let s = { ...state };

      // Apply final HP
      s = { ...s, health: Math.max(1, Math.min(s.maxHealth, finalPlayerHp??s.health)) };

      if(result==="win"||result==="incapacitate") {
        const money = loot||0;
        if(money>0) s = ledgerAdd(s, money, "Combat loot");
        const verb = result==="incapacitate"?"Incapacitated":"Defeated";
        s = addLogEntry(s, `${verb} enemy${money>0?` and looted £${money}`:"."}.`, "success");
      } else if(result==="flee") {
        s = addLogEntry(s, "Fled from combat.", "info");
      } else { // lose
        s = { ...s, health:1 };
        s = addLogEntry(s, "Beaten and left for dead. You barely survive.", "danger");
      }

      // Context resolution
      if(combatCtx?.type==="drain") {
        if(result==="win"||result==="incapacitate") {
          const dw = s.wells.find(x=>x.id===combatCtx.wellId);
          if(dw) {
            const gained = Math.floor(dw.currentEssentia||0);
            if(gained>0) {
              const wells = s.wells.map(x=>x.id===dw.id?{...x,currentEssentia:0}:x);
              s = { ...s, wells, essentia:{...s.essentia,[dw.type]:(s.essentia[dw.type]||0)+gained} };
              s = addLogEntry(s, `Drained ${gained} ${dw.type} essentia from the ${dw.rank} Well in ${dw.sector}.`, "success");
            } else {
              s = addLogEntry(s, "You reach the well — but it's already empty.", "info");
            }
          }
        } else {
          s = addLogEntry(s, "Failed to reach the well.", "fail");
        }
      }
      if(combatCtx?.type==="raid_defense") {
        const w = s.wells.find(x=>x.id===combatCtx.wellId);
        if(w) {
          if(result==="win"||result==="incapacitate") {
            s = addLogEntry(s, `Drove off the raiders — your ${w.type} Well in ${w.sector} is safe.`, "success");
          } else {
            const stolen = Math.min(w.currentEssentia||0, +(Math.random()*3+1).toFixed(1));
            const wells = s.wells.map(x=>x.id===w.id?{...x,currentEssentia:Math.max(0,+(x.currentEssentia||0)-stolen)}:x);
            s = { ...s, wells };
            s = addLogEntry(s, `Raiders escaped with ${stolen.toFixed(1)} essentia from your ${w.type} Well in ${w.sector}.`, "danger");
          }
        }
        // Clear resolved raid alert
        const pra = (s.pendingRaidAlerts||[]).map(a=>a.wellId===combatCtx.wellId&&!a.resolved?{...a,resolved:true}:a);
        s = { ...s, pendingRaidAlerts:pra };
      }
      if(combatCtx?.type==="home_raid") {
        if(result==="win"||result==="incapacitate") {
          s = { ...s, pendingHomeRaid:null };
          s = addLogEntry(s, "You fought off the raider — your home is safe.", "success");
        } else {
          const essentiaOwned = ESSENTIA_TYPES.filter(t=>(s.essentia[t]||0)>0);
          if(essentiaOwned.length>0) {
            const t = essentiaOwned[Math.floor(Math.random()*essentiaOwned.length)];
            const stolen = Math.min(s.essentia[t]||0, Math.floor(Math.random()*3)+1);
            s = { ...s, essentia:{...s.essentia,[t]:(s.essentia[t]||0)-stolen}, pendingHomeRaid:null };
            s = addLogEntry(s, `You were overpowered — the raider took ${stolen} ${t} essentia and fled.`, "danger");
          } else {
            s = { ...s, pendingHomeRaid:null };
            s = addLogEntry(s, "Raider broke in but found nothing worth taking.", "info");
          }
        }
      }
      if(combatCtx?.type==="gang_buy") {
        if(result==="win"||result==="incapacitate") {
          const { essentiaType, essentiaAmount } = combatCtx;
          s = { ...s, essentia:{...s.essentia,[essentiaType]:(s.essentia[essentiaType]||0)+essentiaAmount} };
          s = addLogEntry(s, `Fought off the gang and took ${essentiaAmount} ${essentiaType} essentia.`, "success");
        } else {
          s = addLogEntry(s, `Gang overpowered you — money lost, essentia not received.`, "danger");
        }
      }
      if(combatCtx?.type==="gang_sale" && result==="lose") {
        s = addLogEntry(s, "Beaten during the deal — essentia taken.", "danger");
      }
      // Event context: advance event state (component calls ADVANCE_EVENT after this)
      return s;
    }

    case ACT.RESET: return null;
    case ACT.IMPORT_SAVE: return migrateState(action.saveData);

    case ACT.DEBUG_ADD_MONEY:
      return addLogEntry(ledgerAdd(state,10000,"[Debug]"),"+£10,000 (debug)","info");
    case ACT.DEBUG_ADD_ESSENTIA: {
      const e={}; ESSENTIA_TYPES.forEach(t=>{ e[t]=(state.essentia[t]||0)+10; });
      return addLogEntry({...state,essentia:e},"+10 all essentia (debug)","info");
    }
    case ACT.DEBUG_ADVANCE_DAY: {
      let s={...state,shiftIndex:0,day:state.day+1};
      s=applyDailyUpkeep(s);
      s=rollContactRequests(s);
      s=addLogEntry(s,`[Debug] Skipped to Day ${s.day}.`,"info");
      return s;
    }
    case ACT.DEBUG_MAX_STATS: {
      const comp={}; Object.keys(state.competencies).forEach(k=>{ comp[k]=10; });
      return addLogEntry({...state,competencies:comp},"All competencies set to 10 (debug)","info");
    }
    case ACT.DEBUG_SET_EVENT:
      return { ...state, pendingRandomEvent: action.pendingRandomEvent };
    case ACT.UPDATE_BAROMETER:
    case ACT.FACTION_RELATION_CHANGE:
      return state;
    /* ── Phase 7: Experiment ── */
    case "EXPERIMENT_SIGIL": {
      const sig = SIGIL_REGISTRY[action.sigilId]; if(!sig) return state;
      const chance = sigilLearnChance(action.sigilId, false, state.competencies, state.affinities);
      const roll = Math.floor(Math.random()*100)+1;
      let s = { ...state };
      if(roll <= chance) {
        s = { ...s, knownRecipes: [...(s.knownRecipes||[]), action.sigilId] };
        s = addLogEntry(s, `After hours of experimentation, you crack the design for the ${sig.name}! Recipe learned. (Roll ${roll} ≤ ${chance}%)`, "success");
      } else {
        s = addLogEntry(s, `You spend the shift experimenting with the ${sig.name} design, but don't quite crack it. (Roll ${roll} > ${chance}%)`, "fail");
      }
      return advanceTimeInReducer(s);
    }

    /* ── Phase 7: Kaelen teach ── */
    case "KAELEN_TEACH": {
      if(state.money < action.cost) return state;
      const sig = SIGIL_REGISTRY[action.sigilId]; if(!sig) return state;
      const chance = sigilLearnChance(action.sigilId, true, state.competencies, state.affinities);
      const roll = Math.floor(Math.random()*100)+1;
      let s = { ...state, money: state.money - action.cost };
      s = addLogEntry(s, `You pay Kaelen £${action.cost} for a lesson on the ${sig.name}.`, "info");
      if(roll <= chance) {
        s = { ...s, knownRecipes: [...(s.knownRecipes||[]), action.sigilId] };
        s = addLogEntry(s, `Kaelen's teaching clicks — you've learned the ${sig.name} recipe! (Roll ${roll} ≤ ${chance}%)`, "success");
      } else {
        s = addLogEntry(s, `A solid session with Kaelen, but the design doesn't fully click yet. (Roll ${roll} > ${chance}%)`, "fail");
      }
      return advanceTimeInReducer(s);
    }

    /* ── Phase 7: Andrea — complete onboarding ── */
    case "ANDREA_ONBOARD": {
      if(state.linford_partner || !state.linford_contract_pending) return state;
      const fee = state.skippedEquipmentFee ? 2000 : 3200;
      if(state.money < fee) return state;
      let s = { ...state, money: state.money - fee, linford_partner: true, linford_contract_pending: false };
      const msg = state.skippedEquipmentFee
        ? `You call Andrea back and transfer £2,000. "Thank you. Your account is active," she says.`
        : `You call Andrea back and transfer £3,200. "Excellent. Your equipment kit will be couriered out tomorrow. Welcome to Linford's."`;
      return addLogEntry(s, msg, "success");
    }

    /* ── Phase 7: Andrea — buy compliance kit ── */
    case "ANDREA_BUY_KIT": {
      if(!state.skippedEquipmentFee || state.money < 1200) return state;
      let s = { ...state, money: state.money - 1200, skippedEquipmentFee: false, skippedEquipmentFeeAgain: false };
      s = addLogEntry(s, `Purchased Linford's proprietary tracking kit for £1,200. Account now compliant.`, "success");
      if(s.linford_suspended) { s = { ...s, linford_suspended: false }; s = addLogEntry(s, `Andrea lifts the account suspension. "Your account is active again."`, "success"); }
      return s;
    }

    /* ── Phase 7: Andrea — reinstate account ── */
    case "ANDREA_REINSTATE": {
      if(!state.linford_suspended || state.money < 1200) return state;
      let s = { ...state, money: state.money - 1200, linford_suspended: false, skippedEquipmentFee: false, skippedEquipmentFeeAgain: false };
      return addLogEntry(s, `Paid £1,200 to reinstate your Linford's account. Andrea: "Wise decision. Try to stick to the rules from now on."`, "success");
    }

    /* ── Phase 7: Andrea — buy well ── */
    case "ANDREA_BUY_WELL": {
      const ANDREA_PRICES = {"D-":5000,"D":15000,"D+":50000,"C-":100000,"C":200000,"C+":500000,"B-":1500000,"B":5000000,"B+":10000000};
      const base = ANDREA_PRICES[action.grade] || 0;
      const price = Math.round(base * (["Matter","Life"].includes(action.wellType) ? 1.2 : 1.0));
      if(state.money < price) return state;
      const well = {
        id: "well_"+Date.now()+"_"+Math.floor(Math.random()*1000),
        sector: SECTORS[Math.floor(Math.random()*SECTORS.length)],
        type: action.wellType, rank: action.grade,
        security:{ tier:"none", guards:"No guards on site.", desc:"Transferred by Linford's. Unprotected.", responseMins:[0,0], cameras:false, playerOwned:true, playerProtection:{cameras:null,alarms:null,guards:"guard_none"}, claimable:false },
        perceivedTier:"none", perceivedGuards:"No guards on site.", perceivedDesc:"Your well, transferred from Linford's. No security installed.",
        currentEssentia: RANK_ESSENTIA_YIELD[action.grade]||1
      };
      const fmt = n => n>=1000000?`£${(n/1000000).toFixed(1)}m`:n>=1000?`£${(n/1000).toFixed(1)}k`:`£${n}`;
      let s = { ...state, money: state.money - price, wells: [...state.wells, well] };
      return addLogEntry(s, `Purchased a ${action.grade}-rank ${action.wellType} well from Linford's for ${fmt(price)}. No security installed.`, "success");
    }
    /* ── Kaelen hands-on training session (deducts cost + trains sigil + advances time) ── */
    case "KAELEN_TRAIN_SESSION": {
      const cost = action.cost||0;
      if(cost>0 && state.money<cost) return addLogEntry(state,`Not enough money for Kaelen's session (need £${cost}).`,"fail");
      let s = cost>0 ? ledgerAdd(state,-cost,"Kaelen training session") : {...state};
      if(cost>0) s = addLogEntry(s,`Paid £${cost} for a hands-on training session with Kaelen.`,"info");
      const current = s.competencies.sigil||0;
      const chance = trainingChance(current);
      const roll = Math.floor(Math.random()*100)+1;
      const cfg = TRAINING_CONFIG["sigil"];
      if(roll<=chance){
        const comp = {...s.competencies, sigil:current+1};
        s = addLogEntry({...s,competencies:comp},`${cfg.flavor} Kaelen's guidance pays off — Sigil-Making increases to ${current+1}! (Roll ${roll} ≤ ${chance}%)`,"success");
      } else {
        s = addLogEntry(s,`${cfg.flavor} A good session, but no breakthrough today. (Roll ${roll} > ${chance}%)`,"fail");
      }
      return advanceTimeInReducer(s);
    }

    /* ── Drain a well (free — no guards, no combat) ── */
    case ACT.DRAIN_WELL: {
      const dw = state.wells.find(x=>x.id===action.wellId);
      if(!dw) return state;
      const gained = Math.floor(dw.currentEssentia||0);
      if(gained<=0) return addLogEntry(state, "The well is empty — nothing to drain.", "info");
      const wells = state.wells.map(x=>x.id===dw.id?{...x,currentEssentia:0}:x);
      const s = { ...state, wells, essentia:{...state.essentia,[dw.type]:(state.essentia[dw.type]||0)+gained} };
      return addLogEntry(s, `Drained ${gained} ${dw.type} essentia from the ${dw.rank} Well in ${dw.sector} (no guards).`, "success");
    }

    /* ── Essentia deduction (combat channel cost, no money exchange) ── */
    case ACT.DEDUCT_ESSENTIA: {
      const { essentiaType, amount } = action;
      if(!essentiaType||!(amount>0)) return state;
      const current = state.essentia[essentiaType]||0;
      const deduct = Math.min(current, amount);
      if(deduct<=0) return state;
      const s = { ...state, essentia:{...state.essentia,[essentiaType]:current-deduct} };
      return addLogEntry(s, `Combat: used ${deduct} ${essentiaType} essentia.`, "info");
    }

    /* ── Resolve (dismiss) a well raid alert ── */
    case ACT.RESOLVE_RAID_ALERT: {
      const pra = (state.pendingRaidAlerts||[]).map(a=>
        a.wellId===action.wellId&&!a.resolved ? {...a,resolved:true} : a
      );
      return { ...state, pendingRaidAlerts:pra };
    }

    /* ── Clear pending home raid (hide & wait outcome) ── */
    case "CLEAR_HOME_RAID":
      return { ...state, pendingHomeRaid:null };

    default: return state;
  }
}

/* ── Helper: advance time within a pure reducer context ── */
function advanceTimeInReducer(state) {
  let s = { ...state, shiftIndex: state.shiftIndex + 1 };
  if(s.shiftIndex >= 3) {
    s = { ...s, shiftIndex: 0, day: s.day + 1 };
    s = applyDailyUpkeep(s);
    s = rollContactRequests(s);
    s = addLogEntry(s, `Dawn breaks on Day ${s.day}.`, "info");
  }
  if(s.shiftIndex === 2) s = rollNightContactRequests(s);
  if(!s.pendingRandomEvent) {
    const evt = rollRandomEvent(s);
    if(evt) {
      const flags = { ...(s.randomEventFlags||{}), [evt.def.id]:{ cooldownUntil: s.day+(evt.def.cooldown||30) } };
      s = { ...s, randomEventFiredToday:true, randomEventFlags:flags, pendingRandomEvent:{ def:evt.def, scenarioText:evt.scenarioText, ctx:evt.ctx } };
    }
  }
  return s;
}
