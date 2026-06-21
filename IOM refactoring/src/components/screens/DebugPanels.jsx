import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { DRAIN_ENEMIES, BACKUP_SQUADS, HOME_RAIDERS, GANG_FIGHTERS } from '@/data/enemies';
import { RANDOM_EVENT_DEFINITIONS } from '@/events/randomEvents';
import { initCombat } from '@/engine/combat';
import { ACT } from '@/engine/time';

export function DebugEventTrigger() {
  const { state, dispatch } = useContext(GameCtx);
  const [selectedId, setSelectedId] = useState(RANDOM_EVENT_DEFINITIONS[0]?.id || "");

  function fireEvent() {
    const def = RANDOM_EVENT_DEFINITIONS.find(d => d.id === selectedId);
    if(!def) return;
    const raw = typeof def.scenario === "function" ? def.scenario(state) : def.scenario;
    const scenarioText = typeof raw === "object" ? raw.text : raw;
    const ctx          = typeof raw === "object" ? raw      : {};
    dispatch({ type: ACT.DEBUG_SET_EVENT, pendingRandomEvent: { def, scenarioText, ctx } });
  }

  return (
    <div style={{marginTop:10}}>
      <div style={{fontSize:".68rem",color:"#a78bfa",textTransform:"uppercase",letterSpacing:"1px",fontWeight:700,marginBottom:6}}>Trigger Random Event</div>
      <div style={{display:"flex",gap:6}}>
        <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}
          style={{flex:1,background:"var(--bg)",color:"var(--text)",border:"1px solid #7c3aed",borderRadius:8,padding:"6px 8px",fontSize:".78rem",minHeight:36}}>
          {RANDOM_EVENT_DEFINITIONS.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <button className="small" style={{width:"auto",padding:"6px 14px",borderColor:"#7c3aed",color:"#a78bfa"}} onClick={fireEvent}>
          ▶ Fire
        </button>
      </div>
    </div>
  );
}

export function DebugEncounterPicker() {
  const { state, setCombat } = useContext(GameCtx);
  const ALL_ENEMIES = [
    ...Object.values(DRAIN_ENEMIES).flat(),
    ...Object.values(BACKUP_SQUADS).flat(),
    ...HOME_RAIDERS,
    ...GANG_FIGHTERS,
  ].filter((t,i,a)=>a.findIndex(x=>x.name===t.name)===i);
  const [selectedName, setSelectedName] = useState(ALL_ENEMIES[0]?.name||"");

  function fightEnemy() {
    const template = ALL_ENEMIES.find(t=>t.name===selectedName);
    if(!template) return;
    setCombat(initCombat(state, template, { type:"test" }));
  }

  return (
    <div style={{marginTop:10}}>
      <div style={{fontSize:".68rem",color:"#a78bfa",textTransform:"uppercase",letterSpacing:"1px",fontWeight:700,marginBottom:6}}>Test Encounter</div>
      <div style={{display:"flex",gap:6}}>
        <select value={selectedName} onChange={e=>setSelectedName(e.target.value)}
          style={{flex:1,background:"var(--bg)",color:"var(--text)",border:"1px solid #7c3aed",borderRadius:8,padding:"6px 8px",fontSize:".78rem",minHeight:36}}>
          {ALL_ENEMIES.map(t=><option key={t.name} value={t.name}>{t.name} (HP {t.hp}, Atk {t.atk[0]}–{t.atk[1]})</option>)}
        </select>
        <button className="small" style={{width:"auto",padding:"6px 14px",borderColor:"#7c3aed",color:"#a78bfa"}} onClick={fightEnemy}>
          ⚔️ Fight
        </button>
      </div>
    </div>
  );
}
