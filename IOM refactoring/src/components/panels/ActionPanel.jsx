import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { SECTORS, SHIFTS, ESSENTIA_TYPES } from '@/data/constants';
import { RAIDER_SQUADS, HOME_RAIDERS } from '@/data/enemies';
import { BARRACKS_GUARD_TIERS } from '@/data/wells_protection';
import { scanChance, hasSigilAnywhere, trainingChance } from '@/engine/helpers';
import { initCombat } from '@/engine/combat';
import { ACT } from '@/engine/time';
import { DebugEventTrigger, DebugEncounterPicker } from '@/components/screens/DebugPanels';

export function ActionPanel({ onPlayAnim, openModal }) {
  const{state,dispatch,toast,setCombat}=useContext(GameCtx);
  const[sector,setSector]=useState("Docks");
  const shiftLabels=["☀️ Morning","🌤️ Afternoon","🌙 Night"];

  function doAdvance(){dispatch({type:ACT.ADVANCE_TIME});}

  function doScan(){
    dispatch({type:ACT.SCAN_SECTOR,sector:sector});
    dispatch({type:ACT.ADVANCE_TIME});
  }

  function doRest(){
    dispatch({type:ACT.REST});
    dispatch({type:ACT.ADVANCE_TIME});
  }

  function doTrain(skillKey){
    if(skillKey==="sensing" && onPlayAnim){
      onPlayAnim("meditation","Meditating…",4000,()=>{
        dispatch({type:ACT.TRAIN,skillKey});
        dispatch({type:ACT.ADVANCE_TIME});
      });
    } else {
      dispatch({type:ACT.TRAIN,skillKey});
      dispatch({type:ACT.ADVANCE_TIME});
    }
  }

  function exportSave() {
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`iom_save_day${state.day}.json`; a.click();
    toast("Save exported.");
  }
  function importSave() {
    const inp=document.createElement("input"); inp.type="file"; inp.accept="application/json";
    inp.onchange=e=>{ const f=e.target.files[0]; if(!f) return;
      const r=new FileReader(); r.onload=ev=>{ try{
        dispatch({type:ACT.IMPORT_SAVE,saveData:JSON.parse(ev.target.result)}); toast("Save imported.");
      } catch{ toast("Invalid save file."); } };
      r.readAsText(f); };
    inp.click();
  }

  const comp = state.competencies;
  const sc   = scanChance(comp.sensing||0);
  const raidAlerts = (state.pendingRaidAlerts||[]).filter(a=>!a.resolved);

  return (<>
    {/* Well raid alerts */}
    {raidAlerts.length > 0 && (
      <div style={{border:"1px solid var(--bad)",borderRadius:10,padding:12,marginBottom:10,background:"rgba(252,165,165,.07)"}}>
        <div style={{color:"var(--bad)",fontWeight:700,fontFamily:"'Merriweather',serif",fontSize:".82rem",marginBottom:6}}>
          🚨 Raid Alert{raidAlerts.length>1?"s":""}
        </div>
        {raidAlerts.map((a,i)=>(
          <div key={i} style={{fontSize:".8rem",marginBottom:6}}>
            <span>{a.wellDesc||"A well is under attack."}</span>
            <div className="btn-row" style={{marginTop:4}}>
              <button className="small" style={{background:"linear-gradient(135deg,#b91c1c,#991b1b)",borderColor:"#7f1d1d",color:"#fff"}}
                onClick={()=>{
                  const tier=a.tier||"light";
                  const pool=RAIDER_SQUADS[tier]||RAIDER_SQUADS.light;
                  const tmpl=a.raiderTemplate||pool[Math.floor(Math.random()*pool.length)];
                  const allies=(state.homeRenovations||[]).filter(r=>r.type==="barracks"&&r.guardTier&&r.guardTier!=="none").flatMap(r=>{const gt=BARRACKS_GUARD_TIERS.find(t=>t.id===r.guardTier);return gt?gt.combatants:[];});
                  dispatch({type:ACT.ADD_LOG,text:`You rush to defend your well!`,logType:"danger"});
                  setCombat(initCombat(state,tmpl,{type:"raid_defense",wellId:a.wellId},allies));
                }}>⚔️ Defend</button>
              <button className="small"
                onClick={()=>{
                  dispatch({type:ACT.RESOLVE_RAID_ALERT,wellId:a.wellId});
                  dispatch({type:ACT.ADD_LOG,text:"You ignored the raid — the well was looted.",logType:"danger"});
                }}>Ignore</button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Home raid alert */}
    {state.pendingHomeRaid && (
      <div style={{border:"1px solid var(--bad)",borderRadius:10,padding:12,marginBottom:10,background:"rgba(252,165,165,.07)"}}>
        <div style={{color:"var(--bad)",fontWeight:700,fontFamily:"'Merriweather',serif",fontSize:".82rem",marginBottom:6}}>
          🚨 Home Intruder
        </div>
        <div style={{fontSize:".8rem",marginBottom:6}}>Someone has broken into your home and is after your essentia.</div>
        <div className="btn-row" style={{marginTop:4}}>
          <button className="small" style={{background:"linear-gradient(135deg,#b91c1c,#991b1b)",borderColor:"#7f1d1d",color:"#fff"}}
            onClick={()=>{
              const tmpl=state.pendingHomeRaid.raiderTemplate||HOME_RAIDERS[0];
              dispatch({type:ACT.ADD_LOG,text:"You confront the intruder!",logType:"danger"});
              setCombat(initCombat(state,tmpl,{type:"home_raid"}));
            }}>⚔️ Confront</button>
          <button className="small"
            onClick={()=>{
              dispatch({type:ACT.ADD_LOG,text:"You hid and waited — the intruder ransacked your essentia stores.",logType:"danger"});
              // Steal some essentia
              const essentiaOwned=ESSENTIA_TYPES.filter(t=>(state.essentia[t]||0)>0);
              if(essentiaOwned.length>0){
                const t=essentiaOwned[Math.floor(Math.random()*essentiaOwned.length)];
                const stolen=Math.min(state.essentia[t]||0,Math.floor(Math.random()*3)+1);
                dispatch({type:ACT.DEDUCT_ESSENTIA,essentiaType:t,amount:stolen});
              }
              dispatch({type:"CLEAR_HOME_RAID"});
            }}>Hide &amp; Wait</button>
        </div>
      </div>
    )}

    {/* Time strip */}
    <div className="panel">
      <div className="row">
        <span style={{fontWeight:700,fontVariantNumeric:"tabular-nums"}}>Day {state.day}</span>
        <span style={{fontSize:".73rem",color:"var(--muted)"}}>{SHIFTS[state.shiftIndex]}</span>
      </div>
      <div className="time-strip">
        {shiftLabels.map((n,i)=>(
          <div key={i} className={`shift${i===state.shiftIndex?" active":i<state.shiftIndex?" done":""}`}>{n}</div>
        ))}
      </div>
      <div className="btn-row">
        <button className="primary" onClick={doAdvance}>⏩ Advance Time</button>
      </div>
    </div>

    {/* Activity log */}
    <div className="panel">
      <h2>Activity Log</h2>
      <div className="log">
        {state.log.length===0
          ? <div className="empty-state">Nothing yet.</div>
          : state.log.map((e,i)=>(
            <div key={i} className={`log-entry ${e.type||""}`}>
              <span className="log-ts">D{e.day} {(e.shift||"").slice(0,3)}</span>{e.text}
            </div>
          ))}
      </div>
    </div>

    {/* Actions */}
    <div className="panel">
      <h2>Actions</h2>

      <div className="section-label">Scan Sector</div>
      <p style={{fontSize:".72rem",color:"var(--muted)",margin:"0 0 8px"}}>
        Sensing {comp.sensing||0} → <b style={{color:"var(--accent)"}}>{sc}%</b> success · Perception {comp.perception||0} → security read accuracy
      </p>
      <select value={sector} onChange={e=>setSector(e.target.value)} style={{marginBottom:8}}>
        {SECTORS.map(s=><option key={s}>{s}</option>)}
      </select>
      <button className="primary" onClick={doScan}>🔍 Scan Sector</button>

      <div className="section-label">Rest</div>
      <p style={{fontSize:".72rem",color:"var(--muted)",margin:"0 0 8px"}}>
        Recover 15 HP{hasSigilAnywhere("mending_sigil",state)?" (+20% from Mending Sigil)":""}
      </p>
      <button className="rest-btn" onClick={doRest}>🛏️ Rest &amp; Recover</button>
    </div>

    {/* Training */}
    <div className="panel">
      <h2>Training</h2>
      <p style={{fontSize:".72rem",color:"var(--muted)",margin:"0 0 10px",lineHeight:1.4}}>
        Spend a shift training. Each point makes the next harder to earn.
      </p>
      <div className="btn-row">
        <button className="small" onClick={()=>doTrain("combat")}>
          🥊 Combat
          <span style={{display:"block",fontSize:".68rem",color:"var(--muted)",fontWeight:400}}>{trainingChance(comp.combat||0)}% chance</span>
        </button>
        <button className="small" onClick={()=>doTrain("sensing")}>
          🧘 Sensing
          <span style={{display:"block",fontSize:".68rem",color:"var(--muted)",fontWeight:400}}>{trainingChance(comp.sensing||0)}% chance</span>
        </button>
      </div>
      <div className="btn-row">
        <button className="small" onClick={()=>doTrain("sigil")}>
          ✏️ Sigil-Making
          <span style={{display:"block",fontSize:".68rem",color:"var(--muted)",fontWeight:400}}>{trainingChance(comp.sigil||0)}% chance</span>
        </button>
        <button className="small" onClick={()=>doTrain("persuasion")}>
          🗣️ Persuasion
          <span style={{display:"block",fontSize:".68rem",color:"var(--muted)",fontWeight:400}}>{trainingChance(comp.persuasion||0)}% chance</span>
        </button>
      </div>
      <div className="btn-row" style={{marginTop:8}}>
        <button className="small" style={{flex:1,borderColor:"var(--primal)",color:"var(--primal)"}}
          onClick={()=>openModal&&openModal("experiment")}>
          🔬 Experiment (Sigil Design)
        </button>
      </div>
    </div>

    {/* Debug panel — debug background only */}
    {state.background==="debug" && (
      <div style={{border:"1px solid #7c3aed",borderRadius:10,padding:14,marginBottom:10,background:"var(--panel)"}}>
        <h2 style={{color:"#a78bfa",fontFamily:"'Merriweather',serif"}}>🛠️ Debug</h2>
        <div className="btn-row" style={{flexWrap:"wrap",gap:6}}>
          <button className="small" style={{borderColor:"#7c3aed",color:"#a78bfa"}} onClick={()=>dispatch({type:ACT.DEBUG_ADD_MONEY})}>+£10,000</button>
          <button className="small" style={{borderColor:"#7c3aed",color:"#a78bfa"}} onClick={()=>dispatch({type:ACT.DEBUG_ADD_ESSENTIA})}>+10 Essentia</button>
          <button className="small" style={{borderColor:"#7c3aed",color:"#a78bfa"}} onClick={()=>dispatch({type:ACT.DEBUG_ADVANCE_DAY})}>Skip Day</button>
          <button className="small" style={{borderColor:"#7c3aed",color:"#a78bfa"}} onClick={()=>dispatch({type:ACT.DEBUG_MAX_STATS})}>Max Stats</button>
        </div>
        <DebugEventTrigger/>
        <DebugEncounterPicker/>
      </div>
    )}

    {/* Save data */}
    <div className="panel">
      <h2>Save Data</h2>
      <div className="btn-row">
        <button className="small" onClick={exportSave}>⬇️ Export</button>
        <button className="small" onClick={importSave}>⬆️ Import</button>
        <button className="small" style={{background:"#3f1d1d",borderColor:"#7f1d1d"}}
          onClick={()=>{ if(confirm("Erase all progress and return to character select?")) dispatch({type:ACT.RESET}); }}>🗑️ Reset</button>
      </div>
    </div>
  </>);
}
