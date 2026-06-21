import React, { useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { EVENT_DEFINITIONS } from '@/events/contactEvents';
import { ACT } from '@/engine/time';

export function ContactEventModal({ eventId, stateKey, ctx, onClose }) {
  const { state, dispatch } = useContext(GameCtx);
  const def = EVENT_DEFINITIONS[eventId];
  if(!def) return null;
  const sd = def.states[stateKey];
  if(!sd) return null;

  const text = typeof sd.text==="function" ? sd.text(ctx) : sd.text;
  const contact = state.contacts.find(c=>c.id===def.contactId);

  function handleChoice(choice) {
    if(choice.onSelect) choice.onSelect(ctx, state);
    if(ctx.deferred || ctx.declined) { dispatch({ type:ACT.CLOSE_EVENT }); return; }
    const rawNext = typeof choice.next==="function" ? choice.next(ctx, state) : choice.next;
    if(rawNext===null) { dispatch({ type:ACT.CLOSE_EVENT }); return; }
    dispatch({ type:ACT.ADVANCE_EVENT, nextStateKey:rawNext, ctxPatch:{} });
  }

  function handleContinue() {
    if(sd.terminal) { dispatch({ type:ACT.CLOSE_EVENT }); return; }
  }

  return(
    <div className="sheet-overlay">
      <div className="sheet">
        <div className="ce-speaker">{sd.speaker || contact?.name || "—"}</div>
        <h2>{def.title}</h2>
        <div className="ce-text">{text}</div>
        {sd.terminal
          ? <button className="primary" onClick={handleContinue}>Continue</button>
          : <div className="ce-choices">
              {sd.choices.map((choice, i)=>{
                const label=typeof choice.label==="function"?choice.label(ctx):choice.label;
                const enabled=typeof choice.requires!=="function"||choice.requires(ctx,state);
                return<button key={i} disabled={!enabled} onClick={()=>handleChoice(choice)}>{label}</button>;
              })}
            </div>
        }
      </div>
    </div>
  );
}
