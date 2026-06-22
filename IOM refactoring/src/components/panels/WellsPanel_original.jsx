import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { ESSENTIA_TYPES, RANK_ESSENTIA_YIELD, RANK_SELL_PRICE, WELL_REGEN_RATE } from '@/data/constants';
import { DRAIN_ENEMIES } from '@/data/enemies';
import { initCombat } from '@/engine/combat';
import { ACT } from '@/engine/time';

export function WellsPanel({ openModal }) {
  const { state, dispatch, toast, setCombat } = useContext(GameCtx);
  const [filter, setFilter] = useState({ owner:"all", security:"all", type:"all" });

  let wells = state.wells||[];
  if(filter.owner==="mine")    wells = wells.filter(w=>w.security.playerOwned);
  if(filter.owner==="unowned") wells = wells.filter(w=>!w.security.playerOwned);
  if(filter.security!=="all")  wells = wells.filter(w=>w.perceivedTier===filter.security);
  if(filter.type!=="all")      wells = wells.filter(w=>w.type===filter.type);

  const secBadgeClass = t => ({none:"none",light:"light",medium:"medium",heavy:"heavy"}[t]||"unknown");
  const secLabel      = t => ({none:"No Security",light:"Light",medium:"Medium",heavy:"Heavy",unknown:"Unknown"}[t]||"Unknown");

  return (<>
    <div className="panel" style={{paddingBottom:6}}>
      <h2>Well Catalogue ({state.wells.length})</h2>
      <div className="grid3" style={{gap:5}}>
        <select value={filter.owner} onChange={e=>setFilter(f=>({...f,owner:e.target.value}))} style={{fontSize:".72rem",padding:"6px 8px",minHeight:36}}>
          <option value="all">All Wells</option>
          <option value="mine">Mine</option>
          <option value="unowned">Unowned</option>
        </select>
        <select value={filter.security} onChange={e=>setFilter(f=>({...f,security:e.target.value}))} style={{fontSize:".72rem",padding:"6px 8px",minHeight:36}}>
          <option value="all">Any Security</option>
          <option value="none">None</option>
          <option value="light">Light</option>
          <option value="medium">Medium</option>
          <option value="heavy">Heavy</option>
        </select>
        <select value={filter.type} onChange={e=>setFilter(f=>({...f,type:e.target.value}))} style={{fontSize:".72rem",padding:"6px 8px",minHeight:36}}>
          <option value="all">All Types</option>
          {ESSENTIA_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>
    </div>

    {wells.length===0
      ? <div className="panel"><div className="empty-state">
          {state.wells.length===0
            ? "No wells yet. Use Scan Sector on the Action tab to locate one."
            : "No wells match the current filter."}
        </div></div>
      : wells.map(w=>{
        const cap       = RANK_ESSENTIA_YIELD[w.rank]||1;
        const fillPct   = Math.round(((w.currentEssentia||0)/cap)*100);
        const isOwned   = w.security.playerOwned;
        const claimable = w.security.claimable && !isOwned;
        // A well is sellable if it genuinely has no security and isn't claimable/owned
        const sellable  = !isOwned && !claimable && w.security.tier==="none";
        const essCl     = `var(--${w.type.toLowerCase()})`;
        const sellPrice = RANK_SELL_PRICE[w.rank]||0;
        return (
          <div key={w.id} className="well-card">
            <div className="top">
              <span>
                <span className={`dot ${w.type}`} style={{marginRight:5}}/>
                {w.type} Well
                <span className="rank-badge" style={{marginLeft:6}}>{w.rank}</span>
                {isOwned && <span style={{marginLeft:5,fontSize:".67rem",color:"var(--good)"}}>✓ Owned</span>}
                {claimable && <span style={{marginLeft:5,fontSize:".67rem",color:"var(--accent)"}}>◈ Claimable</span>}
              </span>
              <span className={`sec-badge ${secBadgeClass(w.perceivedTier)}`}>
                {secLabel(w.perceivedTier)}
              </span>
            </div>

            <div className="loc">{w.sector} · {w.perceivedGuards}</div>

            {w.perceivedDesc && (
              <div style={{fontSize:".72rem",color:"var(--muted)",marginTop:3,lineHeight:1.4}}>
                {w.perceivedDesc}
              </div>
            )}

            {/* Essentia fill bar */}
            <div className="well-fill-bar">
              <div className="well-fill-inner" style={{width:fillPct+"%",background:essCl}}/>
            </div>
            <div style={{fontSize:".68rem",color:"var(--muted)",marginTop:4,fontVariantNumeric:"tabular-nums"}}>
              {Math.floor(w.currentEssentia||0)} / {cap} essentia ({fillPct}%)
              {" · "}+{Math.round(cap * WELL_REGEN_RATE * 10)/10}/day regen
            </div>

            {/* Action buttons */}
            <div className="well-actions">
              {isOwned && (
                <button className="small" style={{borderColor:"var(--kinetic)",color:"var(--kinetic)"}}
                  disabled={(w.currentEssentia||0)<1}
                  onClick={()=>{
                    const tier = w.security.tier||"none";
                    if(tier==="none"){
                      // No guards — drain directly (no combat)
                      const gained = Math.floor(w.currentEssentia||0);
                      if(gained<=0){
                        toast("Nothing to drain — the well is empty.");
                        return;
                      }
                      dispatch({ type:ACT.DRAIN_WELL, wellId:w.id });
                      return;
                    }
                    const pool = DRAIN_ENEMIES[tier]||DRAIN_ENEMIES.light;
                    const template = pool[Math.floor(Math.random()*pool.length)];
                    const newCombat = initCombat(state, template, { type:"drain", wellId:w.id, securityTier:tier });
                    setCombat(newCombat);
                  }}>
                  ⚡ {(w.currentEssentia||0)<1?"Empty":"Drain"}
                </button>
              )}
              {(isOwned || (w.security.tier==="none"&&!claimable&&!sellable)) && openModal && (
                <button className="small" style={{borderColor:"var(--accent)"}}
                  onClick={()=>openModal("protect",{wellId:w.id})}>
                  🛡️ {w.security.playerProtection?"Manage":"Add"} Protection
                </button>
              )}
              {claimable && (
                <button className="small" style={{borderColor:"var(--accent)"}}
                  onClick={()=>{
                    if(confirm(`Claim this ${w.rank}-rank ${w.type} Well in ${w.sector}?`))
                      dispatch({type:ACT.CLAIM_WELL, wellId:w.id});
                  }}>
                  📋 Claim
                </button>
              )}
              {sellable && (
                <button className="small" style={{borderColor:"var(--gold)",color:"var(--gold)"}}
                  onClick={()=>{
                    if(confirm(`Sell for £${sellPrice.toLocaleString()}?`))
                      dispatch({type:ACT.SELL_WELL, wellId:w.id});
                  }}>
                  💰 Sell £{sellPrice.toLocaleString()}
                </button>
              )}
              <button className="small" style={{color:"var(--muted)",borderColor:"var(--border)"}}
                onClick={()=>{
                  if(confirm("Remove this well from your catalogue? This can't be undone."))
                    dispatch({type:ACT.REMOVE_WELL, wellId:w.id});
                }}>
                ✕ Remove
              </button>
            </div>
          </div>
        );
      })
    }
  </>);
}
