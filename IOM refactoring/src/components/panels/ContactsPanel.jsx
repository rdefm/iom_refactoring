import React, { useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { PLAYER_FACTION } from '@/data/constants';
import { relationLabel } from '@/engine/helpers';
import { ACT } from '@/engine/time';
import { CONTACT_SPECIAL_ACTIONS } from '@/events/contactEvents';

export function ContactsPanel({ openModal }) {
  const { state, dispatch, toast } = useContext(GameCtx);
  const contacts=state.contacts||[];
  if(contacts.length===0) return <div className="panel"><div className="empty-state">No contacts yet.<br/>Complete events to meet people.</div></div>;

  function openEvent(pending) {
    if(!pending) return;
    dispatch({ type:ACT.OPEN_EVENT, eventId:pending.eventId, ctx:{} });
    openModal && openModal("contactEvent", { eventId:pending.eventId });
  }

  function recruit(contactId) {
    dispatch({ type:ACT.RECRUIT_CONTACT, contactId });
  }

  return (<>{contacts.map(c=>{
    const relPct=((c.relation+100)/200)*100;
    const pending=(state.pendingContactRequests||[]).find(r=>r.contactId===c.id);
    const isAllied=c.affiliation===PLAYER_FACTION;
    const canRecruit=!isAllied&&c.relation>=50;
    return (
      <div key={c.id} className="contact-card">
        <div className="top">
          <span>
            {c.name}
            {isAllied&&<span style={{marginLeft:6,fontSize:".67rem",color:"var(--good)"}}>◈ Allied</span>}
            {pending&&<span className="sec-badge" style={{marginLeft:6,borderColor:"var(--accent)",color:"var(--accent)"}}>💬 Request</span>}
          </span>
          <span style={{fontSize:".72rem",color:"var(--muted)",fontVariantNumeric:"tabular-nums"}}>{relationLabel(c.relation)} ({c.relation>=0?"+":""}{c.relation})</span>
        </div>
        <div className="affil">{c.affiliation}</div>
        <div className="desc">{c.desc}</div>
        <div className="bar-bg" style={{margin:"5px 0"}}>
          <div className="bar-fill" style={{width:relPct+"%",background:"var(--accent)"}}/>
        </div>
        <div className="contact-actions">
          <button className="small" onClick={()=>openModal&&openModal("favour",{contactId:c.id})}>🤝 Favour</button>
          <button className="small" disabled={!pending} onClick={()=>openEvent(pending)}>
            💬 {pending?"Request ●":"Request"}
          </button>
          {!isAllied&&(
            <button className="small" disabled={!canRecruit}
              onClick={()=>recruit(c.id)}
              title={!canRecruit?`Need relation 50 (currently ${c.relation})`:"Ask to join your operation"}>
              🎯 Recruit
            </button>
          )}
        </div>
        {(CONTACT_SPECIAL_ACTIONS[c.id]||[]).map(opt=>{
          const enabled=typeof opt.requires!=="function"||opt.requires(c,state);
          const sub=typeof opt.sublabel==="function"?opt.sublabel(c,state):opt.sublabel||"";
          return(
            <div key={opt.id} className="shop-item" style={{marginTop:6,padding:"8px 10px"}}>
              <div className="info">
                <b style={{fontSize:".82rem"}}>{opt.label}</b>
                {sub&&<div className="desc" style={{fontSize:".72rem"}}>{sub}</div>}
              </div>
              <button className="small buy-btn" disabled={!enabled}
                onClick={()=>enabled&&opt.action(c,dispatch,toast,openModal,state)}>
                Go
              </button>
            </div>
          );
        })}
      </div>
    );
  })}</>);
}
