import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { PROTECTION_OPTIONS } from '@/data/wells_protection';
import { ACT } from '@/engine/time';

export function ProtectWellModal({ wellId, onClose }) {
  const { state, dispatch } = useContext(GameCtx);
  const well = state.wells.find(w=>w.id===wellId);
  if(!well) return null;
  const prot = well.security.playerProtection || { cameras:null, alarms:null, guards:"guard_none" };

  function buy(category, optionId, cost) {
    dispatch({ type:ACT.BUY_PROTECTION, wellId, category, optionId, cost });
  }

  return(
    <div className="sheet-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="sheet">
        <h2>🛡️ Protect Well — {well.type} {well.rank}</h2>
        <div className="sheet-sub">{well.sector} · Balance: £{state.money.toLocaleString()}</div>

        {["cameras","alarms","guards"].map(cat=>(
          <div key={cat}>
            <div className="section-label" style={{fontFamily:"'Merriweather',serif",fontSize:".68rem",color:"var(--accent)",textTransform:"uppercase",letterSpacing:"1.2px",fontWeight:700,margin:"12px 0 6px",borderBottom:"1px solid var(--border)",paddingBottom:4}}>
              {cat.charAt(0).toUpperCase()+cat.slice(1)}
            </div>
            {PROTECTION_OPTIONS[cat].map(opt=>{
              const owned=prot[cat]===opt.id;
              const canAfford=!opt.cost||state.money>=opt.cost;
              const cost=opt.cost||0;
              return(
                <div key={opt.id} className="shop-item">
                  <div className="info">
                    <b>{opt.label} {owned&&<span style={{color:"var(--good)",fontWeight:400,fontSize:".78rem"}}>✓ Active</span>}</b>
                    <div className="desc">{opt.desc}</div>
                    {cost>0&&<div className="stats">£{cost.toLocaleString()}{opt.dailyCost?` + £${opt.dailyCost}/day`:""}</div>}
                    {opt.dailyCost&&!opt.cost&&<div className="stats">£{opt.dailyCost}/day</div>}
                  </div>
                  <button className="small buy-btn" disabled={owned||(!canAfford&&cost>0)}
                    onClick={()=>buy(cat,opt.id,cost)}>
                    {owned?"Active":cost>0?`£${cost.toLocaleString()}`:"Set"}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
        <button onClick={onClose} style={{marginTop:12}}>Done</button>
      </div>
    </div>
  );
}
