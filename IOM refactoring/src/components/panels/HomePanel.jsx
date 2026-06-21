import React, { useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { ESSENTIA_TYPES } from '@/data/constants';
import { HOME_TIERS, HOME_TIER_ORDER, BARRACKS_GUARD_TIERS, KENNEL_DOG_TIERS } from '@/data/wells_protection';
import { ACT } from '@/engine/time';

export function HomePanel({ openModal }) {
  const { state, dispatch, toast } = useContext(GameCtx);
  const tier = HOME_TIERS[state.homeTier] || HOME_TIERS.flatshare;
  const upgrades = state.homeSecurityUpgrades||[];
  const renos = state.homeRenovations||[];

  // Raid chance calculation
  const totalEss = ESSENTIA_TYPES.reduce((s,t)=>s+(state.essentia[t]||0),0);
  const baseRaid = 0.02+Math.floor(totalEss/10)*0.02;
  const hwRed = (tier.securityUpgrades||[]).filter(u=>upgrades.includes(u.id)).reduce((s,u)=>s+(u.raidReduction||0),0);
  const grdRed = renos.filter(r=>r.type==="barracks"&&r.guardTier&&r.guardTier!=="none").reduce((s,r)=>{ const gt=BARRACKS_GUARD_TIERS.find(t=>t.id===r.guardTier); return s+(gt?.raidReduction||0); },0);
  const kenRed = renos.filter(r=>r.type==="kennel"&&r.dogTier&&r.dogTier!=="none").reduce((s,r)=>{ const dt=KENNEL_DOG_TIERS.find(t=>t.id===r.dogTier); return s+(dt?.raidReduction||0); },0);
  const effRaid = Math.max(0,baseRaid-hwRed-grdRed-kenRed);
  const raidCol = effRaid>0.05?"var(--bad)":effRaid>0.02?"var(--warn)":"var(--good)";
  const cameraAlert = (tier.securityUpgrades||[]).some(u=>upgrades.includes(u.id)&&u.alertsRaid);

  return (<>
    {/* Current home summary */}
    <div className="panel">
      <h2>Home — {tier.name}</h2>
      <div className="row">
        <span className="label">Daily rent</span>
        <span style={{fontVariantNumeric:"tabular-nums"}}>{tier.dailyCost>0?`+£${tier.dailyCost}/day`:"Free"}</span>
      </div>
      <p style={{fontSize:".78rem",color:"var(--muted)",margin:"6px 0 8px",lineHeight:1.4}}>{tier.desc}</p>
      <div style={{fontSize:".72rem",color:"var(--muted)"}}>
        Raid chance: <b style={{color:raidCol}}>{(effRaid*100).toFixed(1)}% daily</b>
        {cameraAlert&&<span style={{color:"var(--good)",marginLeft:8}}>📷 Alert active</span>}
      </div>
      <div style={{fontSize:".72rem",color:"var(--muted)",marginTop:3}}>
        Base: {(baseRaid*100).toFixed(1)}%
        {hwRed>0&&<span style={{color:"var(--good)"}}> · Hardware −{(hwRed*100).toFixed(1)}%</span>}
        {grdRed>0&&<span style={{color:"var(--good)"}}> · Guards −{(grdRed*100).toFixed(1)}%</span>}
        {kenRed>0&&<span style={{color:"var(--good)"}}> · Kennel −{(kenRed*100).toFixed(1)}%</span>}
      </div>
    </div>

    {/* Move home */}
    <div className="panel">
      <h2>Move Home</h2>
      {HOME_TIER_ORDER.filter(k=>k!==state.homeTier).map(k=>{
        const t=HOME_TIERS[k];
        return(
          <div key={k} className="shop-item" style={{marginBottom:8}}>
            <div className="info">
              <b>{t.name}</b>
              <div className="desc">{t.desc}</div>
              <div className="stats">£{t.movingCost.toLocaleString()} moving cost · {t.dailyCost>0?`+£${t.dailyCost}/day rent`:"No extra rent"}</div>
            </div>
            <button className="small buy-btn" disabled={state.money<t.movingCost} onClick={()=>{ if(confirm(`Move to ${t.name}? Upgrades and rooms won't transfer.`)) dispatch({type:ACT.MOVE_HOME,tierId:k}); }}>
              Move
            </button>
          </div>
        );
      })}
    </div>

    {/* Security upgrades */}
    {tier.securityUpgrades.length>0&&(
      <div className="panel">
        <h2>Security Upgrades</h2>
        {tier.securityUpgrades.map(u=>{
          const owned=upgrades.includes(u.id);
          return(
            <div key={u.id} className="shop-item">
              <div className="info">
                <b>{u.label} {owned&&<span style={{color:"var(--good)",fontWeight:400,fontSize:".78rem"}}>✓ Installed</span>}</b>
                <div className="desc">{u.desc}</div>
                {!owned&&<div className="stats">£{u.cost.toLocaleString()} one-time</div>}
              </div>
              {!owned&&<button className="small buy-btn" disabled={state.money<u.cost} onClick={()=>dispatch({type:ACT.BUY_HOME_UPGRADE,upgradeId:u.id})}>
                {state.money>=u.cost?`£${u.cost.toLocaleString()}`:`Need £${u.cost.toLocaleString()}`}
              </button>}
            </div>
          );
        })}
      </div>
    )}

    {/* Rooms */}
    {tier.maxRooms>0&&(
      <div className="panel">
        <h2>Rooms ({renos.length}/{tier.maxRooms})</h2>

        {/* Existing rooms */}
        {renos.map((r,i)=>(
          <div key={r.slotId} className="sigil-item" style={{marginBottom:8}}>
            <b>{r.label}</b>
            {r.type==="training"&&<div className="desc">+{r.bonusPct}% {r.skill} training chance</div>}
            {r.type==="barracks"&&(
              <div style={{marginTop:6}}>
                <select value={r.guardTier||"none"} onChange={e=>dispatch({type:ACT.SET_BARRACKS_TIER,idx:i,tierId:e.target.value})}
                  style={{fontSize:".78rem",padding:"5px 8px",minHeight:36}}>
                  {BARRACKS_GUARD_TIERS.map(gt=><option key={gt.id} value={gt.id}>{gt.label}{gt.dailyCost>0?` (+£${gt.dailyCost}/day)`:""}</option>)}
                </select>
                {r.guardTier&&r.guardTier!=="none"&&<div className="desc" style={{marginTop:4}}>{BARRACKS_GUARD_TIERS.find(t=>t.id===r.guardTier)?.desc}</div>}
              </div>
            )}
            {r.type==="kennel"&&(
              <div style={{marginTop:6}}>
                <select value={r.dogTier||"none"} onChange={e=>dispatch({type:ACT.SET_KENNEL_TIER,idx:i,tierId:e.target.value})}
                  style={{fontSize:".78rem",padding:"5px 8px",minHeight:36}}>
                  {KENNEL_DOG_TIERS.map(dt=><option key={dt.id} value={dt.id}>{dt.label}{dt.dailyCost>0?` (+£${dt.dailyCost}/day)`:""}</option>)}
                </select>
                {r.dogTier&&r.dogTier!=="none"&&<div className="desc" style={{marginTop:4}}>{KENNEL_DOG_TIERS.find(t=>t.id===r.dogTier)?.desc}</div>}
              </div>
            )}
            {(r.type==="wellmanager"||r.type==="locator")&&<div className="desc">Assign contact — Phase 6.</div>}
          </div>
        ))}

        {/* Build new room */}
        {renos.length<tier.maxRooms&&(
          <div>
            <div style={{fontSize:".72rem",color:"var(--muted)",marginBottom:6}}>Build a new room:</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {tier.rooms.filter(room=>!renos.some(r=>r.roomId===room.id)).map(room=>(
                <div key={room.id} className="shop-item">
                  <div className="info">
                    <b>{room.label}</b>
                    <div className="desc">{room.desc}</div>
                    <div className="stats">£{room.cost.toLocaleString()} one-time</div>
                  </div>
                  <button className="small buy-btn" disabled={state.money<room.cost} onClick={()=>dispatch({type:ACT.RENOVATE_ROOM,roomId:room.id})}>
                    {state.money>=room.cost?`£${room.cost.toLocaleString()}`:`Need £${(room.cost-state.money).toLocaleString()} more`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
  </>);
}
