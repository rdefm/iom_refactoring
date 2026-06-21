import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { ESSENTIA_TYPES, ESSENTIA_BASE_PRICE } from '@/data/constants';
import { ESSENTIA_BUYERS } from '@/data/economy';
import { GANG_FIGHTERS } from '@/data/enemies';
import { initCombat } from '@/engine/combat';
import { ACT } from '@/engine/time';

export function BuyEssentiaModal({ onClose }) {
  const { state, dispatch, setCombat } = useContext(GameCtx);
  const [amounts, setAmounts] = useState(()=>ESSENTIA_TYPES.reduce((a,t)=>({...a,[t]:0}),{}));
  const [buyer, setBuyer] = useState("gangs");

  const linfordOk = state.linford_partner && !state.linford_suspended;
  const b = ESSENTIA_BUYERS[buyer];
  const multMap = { linford:1.15, gangs:1.30 };
  const mult = multMap[buyer]||1;

  function buy() {
    if(buyer==="linford"&&!linfordOk) return;
    const items=ESSENTIA_TYPES.filter(t=>(amounts[t]||0)>0);
    if(!items.length) return;

    if(buyer==="gangs" && Math.random()<0.30){
      // Ambush — pay first, then fight for the goods
      const moneyPaid = preview;
      items.forEach(t=>{
        if((amounts[t]||0)>0) dispatch({type:ACT.SELL_ESSENTIA, buyer:"gangs", amounts:{[t]:0}}); // deduct money only
      });
      // Quick money deduction via COMBAT_END context
      const gangTemplate = GANG_FIGHTERS[Math.floor(Math.random()*GANG_FIGHTERS.length)];
      // Pick the biggest item for context
      const biggestType = items.reduce((b,t)=>(amounts[t]||0)>(amounts[b]||0)?t:b, items[0]);
      const newCombat = initCombat(state, gangTemplate, {
        type:"gang_buy", essentiaType:biggestType, essentiaAmount:amounts[biggestType]||0, moneyPaid
      });
      dispatch({type:ACT.ADD_LOG, text:`Gang ambush during buy! Fight or lose the £${moneyPaid} you paid.`, logType:"danger"});
      onClose();
      setCombat(newCombat);
      return;
    }

    // Clean deal
    items.forEach(t=>{ if((amounts[t]||0)>0) dispatch({ type:ACT.BUY_ESSENTIA, buyer, essentiaType:t, amount:amounts[t] }); });
    onClose();
  }

  const preview=ESSENTIA_TYPES.reduce((s,t)=>s+Math.ceil(ESSENTIA_BASE_PRICE[t]*mult)*(amounts[t]||0),0);

  return(
    <div className="sheet-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="sheet">
        <h2>🛒 Buy Essentia</h2>
        <div className="sheet-sub">Balance: <b style={{color:"var(--gold)"}}>£{state.money.toLocaleString()}</b></div>

        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {Object.entries(ESSENTIA_BUYERS).map(([k,byr])=>(
            <button key={k} className={buyer===k?"primary":"small"} style={{flex:1,minHeight:36}}
              onClick={()=>setBuyer(k)} disabled={k==="linford"&&!linfordOk}>
              {byr.name}{k==="linford"&&!linfordOk?" (locked)":""}
            </button>
          ))}
        </div>
        <div className="sheet-sub" style={{marginBottom:10}}>{b.desc}</div>

        {ESSENTIA_TYPES.map(t=>{
          const unitPrice=Math.ceil(ESSENTIA_BASE_PRICE[t]*mult);
          return(
            <div key={t} className="ess-amount-row">
              <span className={`dot ${t}`}/>
              <span style={{flex:1,fontSize:".82rem"}}>{t} @ £{unitPrice}/unit</span>
              <input type="number" min="0" value={amounts[t]||0}
                onChange={e=>setAmounts(a=>({...a,[t]:Math.max(0,+e.target.value||0)}))}/>
            </div>
          );
        })}

        <div style={{marginTop:12,fontVariantNumeric:"tabular-nums",fontSize:".85rem",fontWeight:700,color:preview>state.money?"var(--bad)":"var(--text)"}}>
          Total: £{preview.toLocaleString()} {preview>state.money?"(insufficient funds)":""}
        </div>
        {buyer==="gangs"&&<div style={{fontSize:".72rem",color:"var(--warn)",marginTop:6}}>⚠️ 30% chance of ambush — you'll need to fight to keep what you paid for.</div>}
        <div className="btn-row">
          <button className="primary" disabled={preview===0||preview>state.money} onClick={buy}>Buy for £{preview.toLocaleString()}</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
