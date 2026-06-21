import { addLogEntry } from '@/engine/log';

export const ACT = {
  START_GAME:"START_GAME", ADVANCE_TIME:"ADVANCE_TIME", ADD_LOG:"ADD_LOG",
  SCAN_SECTOR:"SCAN_SECTOR", REST:"REST", TRAIN:"TRAIN",
  SELL_WELL:"SELL_WELL", REMOVE_WELL:"REMOVE_WELL", CLAIM_WELL:"CLAIM_WELL",
  EQUIP_SIGIL:"EQUIP_SIGIL", UNEQUIP_SIGIL:"UNEQUIP_SIGIL",
  TOGGLE_PASSIVE:"TOGGLE_PASSIVE", CRAFT_SIGIL:"CRAFT_SIGIL",
  UNLOCK_CONTACT:"UNLOCK_CONTACT", UPDATE_CONTACT:"UPDATE_CONTACT",
  APPLY_RANDOM_EVENT:"APPLY_RANDOM_EVENT",
  // Phase 4
  BUY_WEAPON:"BUY_WEAPON", BUY_ARMOUR:"BUY_ARMOUR", EQUIP_ARMOUR:"EQUIP_ARMOUR", UNEQUIP_ARMOUR:"UNEQUIP_ARMOUR",
  SELL_ESSENTIA:"SELL_ESSENTIA", BUY_ESSENTIA:"BUY_ESSENTIA",
  BUY_PROTECTION:"BUY_PROTECTION",
  CALL_FAVOUR:"CALL_FAVOUR",
  RECRUIT_CONTACT:"RECRUIT_CONTACT",
  OPEN_EVENT:"OPEN_EVENT", ADVANCE_EVENT:"ADVANCE_EVENT", CLOSE_EVENT:"CLOSE_EVENT",
  MOVE_HOME:"MOVE_HOME", BUY_HOME_UPGRADE:"BUY_HOME_UPGRADE", RENOVATE_ROOM:"RENOVATE_ROOM",
  SET_BARRACKS_TIER:"SET_BARRACKS_TIER", SET_KENNEL_TIER:"SET_KENNEL_TIER",
  // Phase 5 — combat post-processing
  COMBAT_END:"COMBAT_END",
  RESET:"RESET", IMPORT_SAVE:"IMPORT_SAVE",
  DEBUG_ADD_MONEY:"DEBUG_ADD_MONEY", DEBUG_ADD_ESSENTIA:"DEBUG_ADD_ESSENTIA",
  DEBUG_ADVANCE_DAY:"DEBUG_ADVANCE_DAY", DEBUG_MAX_STATS:"DEBUG_MAX_STATS",
  DEBUG_SET_EVENT:"DEBUG_SET_EVENT",
  UPDATE_BAROMETER:"UPDATE_BAROMETER", FACTION_RELATION_CHANGE:"FACTION_RELATION_CHANGE",
  // Phase 7
  EXPERIMENT_SIGIL:"EXPERIMENT_SIGIL",
  KAELEN_TEACH:"KAELEN_TEACH",
  ANDREA_ONBOARD:"ANDREA_ONBOARD",
  ANDREA_BUY_KIT:"ANDREA_BUY_KIT",
  ANDREA_REINSTATE:"ANDREA_REINSTATE",
  ANDREA_BUY_WELL:"ANDREA_BUY_WELL",
  DEDUCT_ESSENTIA:"DEDUCT_ESSENTIA",
  RESOLVE_RAID_ALERT:"RESOLVE_RAID_ALERT",
  DRAIN_WELL:"DRAIN_WELL",
};

/* ── Contact-request rolls (pure — called from reducer) ── */
const CONTACT_EVENT_POOL       = { felix:["req_felix_01","req_felix_04","req_felix_05"], kaelen:["req_kaelen_01","req_kaelen_02"] };
const CONTACT_NIGHT_EVENT_POOL = { felix:["req_felix_07"] };

export function rollContactRequests(state) {
  let s = { ...state };
  const pending = [...(s.pendingContactRequests||[])];
  (s.contacts||[]).forEach(c => {
    if(pending.some(r=>r.contactId===c.id)) return;
    if(c.eventCooldownUntil && s.day < c.eventCooldownUntil) return;
    const pool = (CONTACT_EVENT_POOL[c.id]||[])
      .filter(evId => !(s.completedOneShotEvents||[]).includes(evId));
    if(!pool.length) return;
    const mult = (c.requestChanceModifier?.daysLeft > 0) ? c.requestChanceModifier.multiplier : 1;
    if(Math.random() < 0.15 * mult) {
      pending.push({ contactId:c.id, eventId:pool[Math.floor(Math.random()*pool.length)] });
      s = addLogEntry(s, `${c.name} has something they want to discuss with you.`, "info");
    }
  });
  // Decay temporary chance modifiers
  const contacts = (s.contacts||[]).map(c => {
    if(!c.requestChanceModifier || c.requestChanceModifier.daysLeft<=0) return c;
    const daysLeft = c.requestChanceModifier.daysLeft - 1;
    return { ...c, requestChanceModifier: daysLeft<=0 ? null : { ...c.requestChanceModifier, daysLeft } };
  });
  return { ...s, pendingContactRequests:pending, contacts };
}

export function rollNightContactRequests(state) {
  let s = { ...state };
  const pending = [...(s.pendingContactRequests||[])];
  (s.contacts||[]).forEach(c => {
    if(pending.some(r=>r.contactId===c.id)) return;
    if(c.eventCooldownUntil && s.day < c.eventCooldownUntil) return;
    const pool = CONTACT_NIGHT_EVENT_POOL[c.id]||[];
    if(!pool.length) return;
    const mult = (c.requestChanceModifier?.daysLeft > 0) ? c.requestChanceModifier.multiplier : 1;
    if(Math.random() < 0.15 * mult) {
      pending.push({ contactId:c.id, eventId:pool[Math.floor(Math.random()*pool.length)] });
      s = addLogEntry(s, `${c.name} wants a word — tonight only.`, "info");
    }
  });
  return { ...s, pendingContactRequests:pending };
}
