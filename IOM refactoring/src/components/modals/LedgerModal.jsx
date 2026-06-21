import React, { useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { ESSENTIA_TYPES, DAILY_LIVING_COST } from '@/data/constants';
import { HOME_TIERS } from '@/data/wells_protection';
import { PROTECTION_OPTIONS } from '@/data/wells_protection';
import { hasSigilAnywhere } from '@/engine/helpers';

export function LedgerModal({ onClose }) {
  const { state } = useContext(GameCtx);
  const ledger = (state.ledger||[]).slice().sort((a,b)=>a.day-b.day);
  const days = ledger.length;
  const avgIn  = days>0?Math.round(ledger.reduce((s,e)=>s+(e.moneyIn||0),0)/days):0;
  const avgOut = days>0?Math.round(ledger.reduce((s,e)=>s+(e.moneyOut||0),0)/days):0;
  const avgNet = avgIn-avgOut;
  const netCol = avgNet>=0?"var(--good)":"var(--bad)";

  // Tomorrow's expected costs
  const tier = HOME_TIERS[state.homeTier]||HOME_TIERS.flatshare;
  const mult = state.livingCostMultiplier||1.0;
  const sd   = hasSigilAnywhere("static_sigil",state)?0.95:1.0;
  const living= Math.round(DAILY_LIVING_COST*mult*sd);
  const rent  = tier.dailyCost>0?Math.round(tier.dailyCost*mult*sd):0;
  let guardCost=0;
  (state.wells||[]).forEach(w=>{
    const pg=w.security?.playerProtection?.guards;
    if(pg){ const o=PROTECTION_OPTIONS.guards.find(x=>x.id===pg); if(o&&o.dailyCost>0) guardCost+=o.dailyCost; }
  });
  const tomorrowTotal=living+rent+guardCost;

  return(
    <div className="sheet-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="sheet">
        <h2>📒 Ledger</h2>
        {days<7&&<div style={{fontSize:".72rem",color:"var(--warn)",marginBottom:10}}>⚠️ Only {days} day{days===1?"":"s"} of data — averages improve over time.</div>}

        <div className="ledger-sub-label">Last 7 Days — Daily Averages</div>
        <table className="ledger-table">
          <tbody>
            <tr><td style={{color:"var(--muted)"}}>💰 Income</td><td style={{textAlign:"right",color:"var(--good)",fontWeight:600}}>+£{avgIn.toLocaleString()}</td></tr>
            <tr><td style={{color:"var(--muted)"}}>💸 Expenses</td><td style={{textAlign:"right",color:"var(--bad)",fontWeight:600}}>−£{avgOut.toLocaleString()}</td></tr>
            <tr><td style={{fontWeight:700}}>Net/day</td><td style={{textAlign:"right",color:netCol,fontWeight:700}}>{avgNet>=0?"+":""}£{avgNet.toLocaleString()}</td></tr>
          </tbody>
        </table>

        <div className="ledger-sub-label">Tomorrow's Expected Expenses</div>
        <table className="ledger-table">
          <tbody>
            <tr><td style={{color:"var(--muted)"}}>Living costs{sd<1?" (Static −5%)":""}</td><td style={{textAlign:"right",color:"var(--bad)"}}>−£{living}</td></tr>
            {rent>0&&<tr><td style={{color:"var(--muted)"}}>{tier.name} rent</td><td style={{textAlign:"right",color:"var(--bad)"}}>−£{rent}</td></tr>}
            {guardCost>0&&<tr><td style={{color:"var(--muted)"}}>Well guards</td><td style={{textAlign:"right",color:"var(--bad)"}}>−£{guardCost}</td></tr>}
            <tr><td style={{fontWeight:700}}>Total</td><td style={{textAlign:"right",fontWeight:700,color:"var(--bad)"}}>−£{tomorrowTotal.toLocaleString()}</td></tr>
          </tbody>
        </table>

        {ledger.length>0&&(<>
          <div className="ledger-sub-label">Essentia (7-day avg/day)</div>
          {ESSENTIA_TYPES.map(t=>{
            const totIn =ledger.reduce((s,e)=>s+((e.essentia&&e.essentia[t]?.in)||0),0);
            const totOut=ledger.reduce((s,e)=>s+((e.essentia&&e.essentia[t]?.out)||0),0);
            const net=(totIn-totOut)/Math.max(days,1);
            const nc=net>0?"var(--good)":net<0?"var(--bad)":"var(--muted)";
            return<div key={t} className="row" style={{fontSize:".78rem"}}>
              <span><span className={`dot ${t}`} style={{marginRight:5}}/>{t}</span>
              <span style={{color:nc,fontVariantNumeric:"tabular-nums"}}>{net>=0?"+":""}{net.toFixed(1)}/day</span>
            </div>;
          })}
        </>)}

        <button onClick={onClose} style={{marginTop:14}}>Close</button>
      </div>
    </div>
  );
}
