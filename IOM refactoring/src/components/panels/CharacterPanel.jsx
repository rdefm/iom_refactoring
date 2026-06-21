import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { ESSENTIA_TYPES, SIGIL_SLOTS, SLOT_LABELS } from '@/data/constants';
import { SIGIL_REGISTRY, CRAFTABLE_SIGILS, LEARNABLE_SIGILS } from '@/data/sigils';
import { WEAPONS, BODY_ARMOUR } from '@/data/weapons';
import { affinityLabel, sigilCapacityCost, equippedCapacityUsed, sigilCraftChance, scanChance } from '@/engine/helpers';
import { ACT } from '@/engine/time';

export function CharacterPanel({ openModal }) {
  const { state, dispatch, toast } = useContext(GameCtx);
  const [craftOpen, setCraftOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const { competencies, affinities, essentia, essentiaLevel, health, maxHealth, money, favours } = state;

  const hpPct=Math.round((health/maxHealth)*100);
  const capUsed=equippedCapacityUsed(state);
  const capOver=capUsed>essentiaLevel;

  const essColor={ Light:"var(--light)", Matter:"var(--matter)", Life:"var(--life)", Kinetic:"var(--kinetic)", Primal:"var(--primal)" };

  // Affinity pip builder: 6 pips representing -2,-1,0,+1,+2,+3
  function AffinityRow({ type }) {
    const v = affinities[type]??0;
    const pips=[-2,-1,0,1,2,3];
    const valColor = v>0?"var(--good)":v<0?"var(--bad)":"var(--muted)";
    return (
      <div className="aff-row">
        <span className="aff-label"><span className={`dot ${type}`}/>{type}</span>
        <div className="aff-track">
          {pips.map(p=>(
            <div key={p} className={`aff-pip${(v>0&&p>0&&p<=v)?" pos":(v<0&&p<0&&p>=v)?" neg":""}`} title={p>=0?"+"+p:p+""}/>
          ))}
        </div>
        <span className="aff-val" style={{color:valColor}}>{v>0?"+":""}{v}</span>
      </div>
    );
  }

  // Sigil display
  function sigilDisplayName(inst) {
    const sig=SIGIL_REGISTRY[inst?.id]; if(!sig) return inst?.id||"Unknown";
    return inst.power!=null?`${sig.name} (+${inst.power}%)`:sig.name;
  }

  function SigilSlotRow({ slot }) {
    const key=state.equipped[slot];
    const inst=key?(state.sigils||[]).find(s=>s.key===key):null;
    const sig=inst?SIGIL_REGISTRY[inst.id]:null;

    if(!inst||!sig) return (
      <div className="sigil-slot" style={{marginBottom:7}}>
        <div className="info"><b>{SLOT_LABELS[slot]}</b><span>Empty</span></div>
      </div>
    );
    const cost=sigilCapacityCost(inst,affinities);
    const isMending=sig.passive==="mending";
    const isPassive=sig.triggeredOnly&&!isMending;
    const isOn=isPassive&&!!(state.activePassives||{})[inst.key];
    return (
      <div className="sigil-slot">
        <div className="info">
          <b>{SLOT_LABELS[slot]}</b>
          <span>{sigilDisplayName(inst)} <span style={{color:"var(--"+sig.type.toLowerCase()+")"}}>[{sig.type}]</span></span>
          <span style={{color:isMending?"var(--life)":isOn?"var(--good)":"var(--muted)"}}>
            {isMending?"Always-on · no capacity":isPassive?(isOn?"Active ✦ · Load "+cost:"Inactive · Load "+cost):sig.combatEffect?"Load "+cost+" at fire-time":"Load "+cost}
          </span>
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0}}>
          {isPassive&&<button className="small" style={{width:"auto",padding:"6px 10px"}} onClick={()=>dispatch({type:ACT.TOGGLE_PASSIVE,instanceKey:inst.key})}>{isOn?"Off":"On"}</button>}
          <button className="small" style={{width:"auto",padding:"6px 10px"}} onClick={()=>dispatch({type:ACT.UNEQUIP_SIGIL,slot})}>Remove</button>
        </div>
      </div>
    );
  }

  function SigilInventoryItem({ inst }) {
    const sig=SIGIL_REGISTRY[inst.id]; if(!sig) return null;
    const slotChoices=sig.slot==="hand"?["hand1","hand2"]:["neck"];
    const alreadyInSlot=SIGIL_SLOTS.some(sl=>state.equipped[sl]===inst.key);
    return (
      <div className="sigil-item">
        <b>{sigilDisplayName(inst)} <span style={{color:"var(--muted)",fontWeight:400}}>({sig.type})</span></b>
        <div className="desc">{sig.desc}</div>
        <div className="sigil-actions">
          {slotChoices.map(sl=>(
            <button key={sl} className="small" style={{width:"auto"}}
              disabled={state.equipped[sl]===inst.key}
              onClick={()=>dispatch({type:ACT.EQUIP_SIGIL,instanceKey:inst.key,slot:sl})}>
              {state.equipped[sl]===inst.key?"Equipped":"→ "+SLOT_LABELS[sl]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function SigilCraftItem({ recipe }) {
    const sig=SIGIL_REGISTRY[recipe.sigilId]; if(!sig) return null;
    const chance=sigilCraftChance(recipe.sigilId,competencies,affinities);
    const [craftAmt,setCraftAmt]=useState(recipe.scaling?recipe.scaling.min:null);

    if(recipe.scaling){
      const type=recipe.essentiaType; const have=essentia[type]||0;
      const unit=recipe.scaling.unit; const min=recipe.scaling.min;
      const maxUnits=Math.floor(have/unit); const haveEnough=have>=min;
      const options=haveEnough?Array.from({length:maxUnits},(_,i)=>(i+1)*unit):[];
      return (
        <div className="sigil-item">
          <b>{recipe.name} <span style={{color:"var(--muted)",fontWeight:400}}>({sig.type})</span></b>
          <div className="desc">{sig.desc}</div>
          <div className="desc" style={{color:"var(--warn)"}}>
            {type} available: {have} · Affinity: {affinityLabel(affinities[type]??0)} · Craft chance: {chance}%
          </div>
          {haveEnough&&<div style={{display:"flex",alignItems:"center",gap:8,margin:"6px 0"}}>
            <span style={{fontSize:".72rem",color:"var(--muted)"}}>Invest:</span>
            <select style={{flex:1}} value={craftAmt||min} onChange={e=>setCraftAmt(+e.target.value)}>
              {options.map(a=><option key={a} value={a}>{a} → +{(recipe.scaling.baseBonus||0)+(a/unit)*recipe.scaling.bonusPerUnit}%</option>)}
            </select>
          </div>}
          <button className="small" disabled={!haveEnough}
            onClick={()=>dispatch({type:ACT.CRAFT_SIGIL,sigilId:recipe.sigilId,essentiaAmount:craftAmt||min})}>
            {haveEnough?"Attempt Craft":"Need "+min+" "+type}
          </button>
        </div>
      );
    }

    const haveEnough=Object.entries(recipe.essentiaCost).every(([t,a])=>(essentia[t]||0)>=a);
    const costStr=Object.entries(recipe.essentiaCost).map(([t,a])=>`${a} ${t}`).join(", ");
    return (
      <div className="sigil-item">
        <b>{recipe.name} <span style={{color:"var(--muted)",fontWeight:400}}>({sig.type})</span></b>
        <div className="desc">{sig.desc}</div>
        <div className="desc" style={{color:"var(--warn)"}}>
          Cost: {costStr} · Craft chance: {chance}%
        </div>
        <button className="small" disabled={!haveEnough}
          onClick={()=>dispatch({type:ACT.CRAFT_SIGIL,sigilId:recipe.sigilId})}>
          {haveEnough?"Attempt Craft":"Not enough essentia"}
        </button>
      </div>
    );
  }

  const knownRecipes=Object.values(CRAFTABLE_SIGILS).filter(r=>(state.knownRecipes||[]).includes(r.sigilId));

  return (<>
    {/* Pocketbook */}
    <div className="panel">
      <h2>Pocketbook</h2>
      <div className="grid2" style={{marginBottom:10}}>
        <div className="stat-box">Money<span className="v" style={{color:"var(--gold)"}}>£{money.toLocaleString()}</span></div>
        <div className="stat-box">Favours<span className="v" style={{color:"var(--accent)"}}>{favours}</span></div>
      </div>
      <div className="row"><span className="label">Health</span><span style={{fontVariantNumeric:"tabular-nums"}}>{health} / {maxHealth}</span></div>
      <div className="bar-bg"><div className={`bar-fill${hpPct<35?" hp-low":""}`} style={{width:hpPct+"%"}}/></div>

      {/* Gear rows */}
      <div className="row" style={{marginTop:8}}>
        <span className="label">Weapons</span>
        <span style={{fontSize:".78rem",color:"var(--muted)"}}>
          {(state.ownedWeapons||[]).length>0
            ? (state.ownedWeapons||[]).map(id=>WEAPONS[id]?.name||id).join(", ")
            : "None"}
        </span>
      </div>
      <div className="row">
        <span className="label">Armour</span>
        <span style={{fontSize:".78rem",color:state.equippedArmour?"var(--good)":"var(--muted)"}}>
          {state.equippedArmour ? (BODY_ARMOUR[state.equippedArmour]?.name||state.equippedArmour)+" (equipped)" : "None"}
        </span>
      </div>

      <div style={{marginTop:10}}><span style={{color:"var(--muted)",fontSize:".72rem"}}>Essentia Reserves</span></div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
        {ESSENTIA_TYPES.map(t=>(
          <span key={t} className="essentia-chip">
            <span className={`dot ${t}`}/>{t}: {essentia[t]||0}
          </span>
        ))}
      </div>
      <div className="btn-row" style={{marginTop:10}}>
        <button className="small" onClick={()=>openModal&&openModal("sell")}>💱 Sell</button>
        <button className="small" onClick={()=>openModal&&openModal("buy")}>🛒 Buy</button>
        <button className="small" onClick={()=>openModal&&openModal("arms")}>⚔️ Arms Shop</button>
        <button className="small" onClick={()=>openModal&&openModal("ledger")}>📒 Ledger</button>
      </div>
    </div>

    {/* Competencies */}
    <div className="panel">
      <h2>Competencies</h2>
      <div className="grid3">
        {[["Combat","combat"],["Sigil-Making","sigil"],["Sensing","sensing"],
          ["Perception","perception"],["Persuasion","persuasion"],["Agility","agility"]].map(([label,key])=>(
          <div key={key} className="stat-box">{label}<span className="v">{competencies[key]??0}</span></div>
        ))}
      </div>
      <div className="grid2" style={{marginTop:6}}>
        <div className="stat-box" style={{borderColor:"var(--primal)"}}>
          Essentia Level<span className="v" style={{color:"var(--primal)"}}>{essentiaLevel.toFixed(1)}</span>
        </div>
        <div className="stat-box" style={{borderColor:capOver?"var(--bad)":"var(--primal)"}}>
          Sigil Load<span className="v" style={{color:capOver?"var(--bad)":"var(--text)"}}>{capUsed} / {essentiaLevel}</span>
        </div>
      </div>
      <div style={{fontSize:".7rem",color:"var(--muted)",marginTop:6}}>
        Scan chance: <b style={{color:"var(--accent)"}}>{scanChance(competencies.sensing||0)}%</b>
      </div>
    </div>

    {/* Affinities */}
    <div className="panel">
      <h2>Affinities</h2>
      {ESSENTIA_TYPES.map(t=><AffinityRow key={t} type={t}/>)}
    </div>

    {/* Sigil Slots */}
    <div className="panel">
      <h2>Sigil Equipment</h2>
      {SIGIL_SLOTS.map(sl=><SigilSlotRow key={sl} slot={sl}/>)}
    </div>

    {/* Sigil Inventory (collapsible) */}
    {(state.sigils||[]).length>0&&(
      <div className="panel">
        <button style={{textAlign:"left",background:"none",border:"none",color:"var(--accent)",padding:"0",fontFamily:"'Merriweather',serif",fontSize:".8rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"1.2px",minHeight:"unset",width:"auto"}}
          onClick={()=>setInvOpen(o=>!o)}>
          Sigil Inventory ({state.sigils.length}) {invOpen?"▲":"▼"}
        </button>
        {invOpen&&<div style={{marginTop:10}}>
          {state.sigils.map(inst=><SigilInventoryItem key={inst.key} inst={inst}/>)}
        </div>}
      </div>
    )}

    {/* Sigil Crafting (collapsible) */}
    <div className="panel">
      <button style={{textAlign:"left",background:"none",border:"none",color:"var(--accent)",padding:"0",fontFamily:"'Merriweather',serif",fontSize:".8rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"1.2px",minHeight:"unset",width:"auto"}}
        onClick={()=>setCraftOpen(o=>!o)}>
        Sigil-Making ({knownRecipes.length}/{LEARNABLE_SIGILS.length} recipes) {craftOpen?"▲":"▼"}
      </button>
      {craftOpen&&<div style={{marginTop:10}}>
        {knownRecipes.length===0
          ? <div className="empty-state">No recipes known. Experiment or find a teacher.</div>
          : knownRecipes.map(r=><SigilCraftItem key={r.sigilId} recipe={r}/>)}
      </div>}
    </div>
  </>);
}
