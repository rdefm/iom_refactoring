import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { ESSENTIA_TYPES, ESSENTIA_BASE_PRICE } from '@/data/constants';
import { ESSENTIA_BUYERS } from '@/data/economy';
import { GANG_FIGHTERS } from '@/data/enemies';
import { initCombat } from '@/engine/combat';
import { ACT } from '@/engine/time';

export function SellEssentiaModal({ onClose }) {
  const { state, dispatch, setCombat } = useContext(GameCtx);
  const [amounts, setAmounts] = useState(()=>ESSENTIA_TYPES.reduce((a,t)=>({...a,[t]:0}),{}));
  const [buyer, setBuyer] = useState("linford");

  const linfordOk = state.linford_partner && !state.linford_suspended;

  function sell() {
    if(buyer==="linford"&&!linfordOk){ return; }
    const b=ESSENTIA_BUYERS[buyer];
    const total=ESSENTIA_TYPES.reduce((s,t)=>s+Math.floor(ESSENTIA_BASE_PRICE[t]*b.priceMultiplier)*(amounts[t]||0),0);
    if(total===0) return;

    // Gang sell: 30% chance of ambush — dispatch sale first (money paid, essentia deducted),
    // then initiate combat; losing triggers gang_sale log in COMBAT_END.
    if(buyer==="gangs" && Math.random()<(b.riskChance||0)){
      dispatch({ type:ACT.SELL_ESSENTIA, buyer, amounts });
      // Pick the biggest type being sold for combat context label
      const biggestType = ESSENTIA_TYPES.reduce((best,t)=>(amounts[t]||0)>(amounts[best]||0)?t:best, ESSENTIA_TYPES[0]);
      const tmpl = GANG_FIGHTERS[Math.floor(Math.random()*GANG_FIGHTERS.length)];
      setCombat(initCombat(state, tmpl, { type:"gang_sale", essentiaAmounts:{...amounts}, moneyReceived:total }));
      onClose();
      return;
    }

    dispatch({ type:ACT.SELL_ESSENTIA, buyer, amounts });
    onClose();
  }

  const b=ESSENTIA_BUYERS[buyer];
  const preview=ESSENTIA_TYPES.reduce((s,t)=>s+Math.floor(ESSENTIA_BASE_PRICE[t]*b.priceMultiplier)*(amounts[t]||0),0);

  return(
    <div className="sheet-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="sheet">
        <h2>💱 Sell Essentia</h2>
        <div className="sheet-sub">Your reserves: {ESSENTIA_TYPES.map(t=>`${t}: ${state.essentia[t]||0}`).join(" · ")}</div>

        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {Object.entries(ESSENTIA_BUYERS).map(([k,byr])=>(
            <button key={k} className={buyer===k?"primary":"small"} style={{flex:1,minHeight:36}}
              onClick={()=>setBuyer(k)} disabled={k==="linford"&&!linfordOk}>
              {byr.name}{k==="linford"&&!linfordOk?" (locked)":""}
            </button>
          ))}
        </div>
        <div className="sheet-sub" style={{marginBottom:10}}>{b.desc}</div>
        {buyer==="gangs"&&<div style={{fontSize:".72rem",color:"var(--warn)",marginBottom:8}}>⚠️ 30% chance of ambush — they may turn on you after the deal.</div>}

        {ESSENTIA_TYPES.map(t=>(
          <div key={t} className="ess-amount-row">
            <span className={`dot ${t}`}/>
            <span style={{flex:1,fontSize:".82rem"}}>{t} (have {state.essentia[t]||0}) @ £{Math.floor(ESSENTIA_BASE_PRICE[t]*b.priceMultiplier)}/unit</span>
            <input type="number" min="0" max={state.essentia[t]||0} value={amounts[t]||0}
              onChange={e=>setAmounts(a=>({...a,[t]:Math.min(state.essentia[t]||0,Math.max(0,+e.target.value||0))}))}/>
          </div>
        ))}

        <div style={{marginTop:12,fontVariantNumeric:"tabular-nums",fontSize:".85rem",fontWeight:700,color:"var(--good)"}}>
          Total: £{preview.toLocaleString()}
        </div>
        <div className="btn-row">
          <button className="primary" disabled={preview===0} onClick={sell}>Sell for £{preview.toLocaleString()}</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
