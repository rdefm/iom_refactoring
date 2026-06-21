import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { BACKGROUNDS } from '@/data/backgrounds';
import { ESSENTIA_TYPES } from '@/data/constants';
import { ACT } from '@/engine/time';
import { affinityLabel } from '@/engine/helpers';

function DebugConfig({ onStart }) {
  const [cfg, setCfg] = useState({
    money:5000, favours:5,
    competencies:{ combat:5, sigil:5, sensing:5, perception:5, persuasion:5, agility:5 },
    affinities:{ Light:0, Matter:0, Life:0, Kinetic:0, Primal:0 },
    essentiaLevel:3.0,
    essentia:{ Light:0, Matter:0, Life:0, Kinetic:0, Primal:0 },
  });
  const set=(key,val)=>setCfg(c=>({...c,[key]:val}));
  const setComp=(k,v)=>setCfg(c=>({...c,competencies:{...c.competencies,[k]:+v}}));
  const setAff=(k,v)=>setCfg(c=>({...c,affinities:{...c.affinities,[k]:+v}}));
  const setEss=(k,v)=>setCfg(c=>({...c,essentia:{...c.essentia,[k]:+v}}));

  return (
    <div className="debug-card">
      <h3>🛠️ Debug Mode</h3>
      <p style={{fontSize:".78rem",color:"var(--muted)",margin:"2px 0 12px"}}>Configure starting state manually.</p>
      <div className="grid2" style={{marginBottom:10}}>
        {[["Money (£)","money"],["Favours","favours"]].map(([lbl,k])=>(
          <div key={k}><label className="dbg-label">{lbl}</label>
          <input type="number" className="dbg-input" value={cfg[k]} min="0" onChange={e=>set(k,+e.target.value)}/></div>
        ))}
      </div>
      <div className="section-label" style={{marginTop:0}}>Competencies</div>
      <div className="grid3" style={{marginBottom:10}}>
        {[["Combat","combat"],["Sigil","sigil"],["Sensing","sensing"],["Perception","perception"],["Persuasion","persuasion"],["Agility","agility"]].map(([lbl,k])=>(
          <div key={k}><label className="dbg-label">{lbl}</label>
          <input type="number" className="dbg-input" value={cfg.competencies[k]} min="0" max="20" onChange={e=>setComp(k,e.target.value)}/></div>
        ))}
      </div>
      <div className="section-label" style={{marginTop:0}}>Essentia Level</div>
      <select className="dbg-input" value={cfg.essentiaLevel} style={{marginBottom:10}} onChange={e=>set("essentiaLevel",+e.target.value)}>
        {[1,1.5,2,2.5,3,3.5,4,4.5,5].map(v=><option key={v} value={v}>{v.toFixed(1)}</option>)}
      </select>
      <div className="section-label" style={{marginTop:0}}>Affinities</div>
      <div className="grid2" style={{marginBottom:10}}>
        {ESSENTIA_TYPES.map(t=>(
          <div key={t}><label className="dbg-label"><span className={`dot ${t}`} style={{marginRight:4}}/>{t}</label>
          <select className="dbg-input" value={cfg.affinities[t]} onChange={e=>setAff(t,e.target.value)}>
            {[-2,-1,0,1,2,3].map(v=><option key={v} value={v}>{v>=0?"+":""}{v} {affinityLabel(v)}</option>)}
          </select></div>
        ))}
      </div>
      <div className="section-label" style={{marginTop:0}}>Starting Essentia</div>
      <div className="grid2" style={{marginBottom:14}}>
        {ESSENTIA_TYPES.map(t=>(
          <div key={t}><label className="dbg-label"><span className={`dot ${t}`} style={{marginRight:4}}/>{t}</label>
          <input type="number" className="dbg-input" value={cfg.essentia[t]} min="0" onChange={e=>setEss(t,e.target.value)}/></div>
        ))}
      </div>
      <button className="primary" onClick={()=>onStart("debug",cfg)}>▶ Start Debug Game</button>
    </div>
  );
}

export function CharacterSelect() {
  const { dispatch, toast } = useContext(GameCtx);

  function startGame(bgKey, debugConfig=null) { dispatch({type:ACT.START_GAME,bgKey,debugConfig}); }
  function handleImport() {
    const inp=document.createElement("input"); inp.type="file"; inp.accept="application/json";
    inp.onchange=e=>{ const f=e.target.files[0]; if(!f) return;
      const r=new FileReader(); r.onload=ev=>{ try{ dispatch({type:ACT.IMPORT_SAVE,saveData:JSON.parse(ev.target.result)}); toast("Save loaded."); } catch{ toast("Invalid save."); } };
      r.readAsText(f); };
    inp.click();
  }

  return (
    <div className="select-screen">
      <div className="select-title">🜂 Inheritance of Magic</div>
      <div className="select-sub">A City of Hidden Wells</div>

      {Object.values(BACKGROUNDS).map(bg=>(
        <div key={bg.key} className="bg-card">
          <h3>{bg.name}</h3>
          <p className="bg-desc">{bg.desc}</p>
          <span className={`difficulty ${bg.difficulty}`}>{bg.difficulty}</span>
          <ul>{bg.perks.map((p,i)=><li key={i}>{p}</li>)}</ul>
          <button className="primary" onClick={()=>startGame(bg.key)}>▶ Play as {bg.name}</button>
        </div>
      ))}

      <div className="panel" style={{marginBottom:10}}>
        <h2>Load Save</h2>
        <button onClick={handleImport}>📂 Import Save File</button>
      </div>

      <DebugConfig onStart={startGame}/>
    </div>
  );
}
