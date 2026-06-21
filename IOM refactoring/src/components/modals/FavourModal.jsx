import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { FAVOUR_OPTIONS } from '@/events/contactEvents';
import { ACT } from '@/engine/time';
import { relationLabel } from '@/engine/helpers';

export function FavourModal({ contactId, onClose }) {
  const { state, dispatch } = useContext(GameCtx);
  const contact = state.contacts.find(c=>c.id===contactId);
  if(!contact) return null;

  function callFavour(optionId) {
    dispatch({ type:ACT.CALL_FAVOUR, contactId, optionId });
    onClose();
  }

  return(
    <div className="sheet-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="sheet">
        <h2>🤝 Call a Favour — {contact.name}</h2>
        <div className="sheet-sub">Relation: <b style={{color:"var(--accent)"}}>{contact.relation>=0?"+":""}{contact.relation}</b> ({relationLabel(contact.relation)})</div>
        {FAVOUR_OPTIONS.map(opt=>{
          const enabled=typeof opt.requires!=="function"||opt.requires(contact,state);
          return(
            <div key={opt.id} className="shop-item">
              <div className="info">
                <b>{opt.label}</b>
                <div className="desc">{opt.desc}</div>
              </div>
              <button className="small buy-btn" disabled={!enabled} onClick={()=>callFavour(opt.id)}>Call</button>
            </div>
          );
        })}
        <button onClick={onClose} style={{marginTop:10}}>Cancel</button>
      </div>
    </div>
  );
}
