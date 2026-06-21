import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { WEAPONS, BODY_ARMOUR } from '@/data/weapons';
import { ACT } from '@/engine/time';

export function ArmsShopModal({ onClose }) {
  const { state, dispatch } = useContext(GameCtx);
  const [tab, setTab] = useState("weapons");
  const comp = state.competencies;
  const ownedW = state.ownedWeapons||[];
  const ownedA = state.ownedArmour||[];

  function weaponStats(w) {
    if(w.nonlethal){
      const bareMin=Math.max(1,3+Math.floor(comp.combat*2.5));
      const bareMax=bareMin+6;
      return `Dmg: ${Math.floor(bareMin*w.dmgMultiplier)}–${Math.floor(bareMax*w.dmgMultiplier)} · Always hits`;
    }
    const cb=comp.combat*2;
    const acc=Math.min(97,Math.round(w.accuracy+(w.ranged?comp.combat*2:comp.combat)));
    return `Dmg: ${w.dmgMin+cb}–${w.dmgMax+cb} · Acc: ~${acc}%${w.armorPiercing?" · Pierces armour":""}`;
  }

  const tierWeps = Object.values(WEAPONS).filter(w=>w.tier<=2);

  return(
    <div className="sheet-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="sheet">
        <h2>⚔️ Arms Shop</h2>
        <div className="sheet-sub">Balance: <b style={{color:"var(--gold)"}}>£{state.money.toLocaleString()}</b> · Tier 3 weapons available via Philip (relation ≥ 40).</div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {["weapons","armour"].map(t=><button key={t} className={tab===t?"primary":"small"} style={{flex:1,minHeight:36}} onClick={()=>setTab(t)}>{t==="weapons"?"Weapons":"Body Armour"}</button>)}
        </div>
        {tab==="weapons"&&tierWeps.map(w=>{
          const owned=ownedW.includes(w.id);
          return(
            <div key={w.id} className="shop-item">
              <div className="info">
                <b>{w.emoji} {w.name} <span className={`weapon-tag ${w.tag}`}>{w.tag}</span>{w.burst&&<span className="weapon-tag gun">burst</span>}</b>
                <div className="desc">{w.desc}</div>
                <div className="stats">{weaponStats(w)}</div>
              </div>
              <button className="small buy-btn" disabled={owned||state.money<w.cost}
                onClick={()=>dispatch({type:ACT.BUY_WEAPON,weaponId:w.id})}>
                {owned?"Owned":`£${w.cost}`}
              </button>
            </div>
          );
        })}
        {tab==="armour"&&Object.values(BODY_ARMOUR).map(a=>{
          const owned=ownedA.includes(a.id);
          const equipped=state.equippedArmour===a.id;
          return(
            <div key={a.id} className="shop-item">
              <div className="info">
                <b>{a.emoji} {a.name} {equipped&&<span style={{color:"var(--good)",fontWeight:400,fontSize:".78rem"}}>✓ Equipped</span>}</b>
                <div className="desc">{a.desc}</div>
                <div className="stats">−{Math.round(a.damageReduction*100)}% gun/blade damage</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                {!owned&&<button className="small buy-btn" disabled={state.money<a.cost} onClick={()=>dispatch({type:ACT.BUY_ARMOUR,armourId:a.id})}>£{a.cost.toLocaleString()}</button>}
                {owned&&!equipped&&<button className="small buy-btn" onClick={()=>dispatch({type:ACT.EQUIP_ARMOUR,armourId:a.id})}>Equip</button>}
                {equipped&&<button className="small buy-btn" onClick={()=>dispatch({type:ACT.UNEQUIP_ARMOUR})}>Remove</button>}
              </div>
            </div>
          );
        })}
        <button onClick={onClose} style={{marginTop:10}}>Close</button>
      </div>
    </div>
  );
}
