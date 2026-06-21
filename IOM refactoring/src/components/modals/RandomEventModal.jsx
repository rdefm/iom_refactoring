import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';

// Map event IDs to their image paths.
// Add a new entry here whenever you add an image to public/events/.
const EVENT_IMAGES = {
  event_con_01: '/events/event_con_01.jpg',
  event_bill_01: '/events/event_bill_01.jpg',
  event_fox_01:  '/events/event_fox_01.jpg',
  event_pawn_01: '/events/event_pawn_01.jpg',
  event_commute_01: '/events/event_commute_01.jpg',
};

export function RandomEventModal({ event, onResolve }) {
  const { state } = useContext(GameCtx);
  const [result, setResult] = useState(null);   // { text, type, resolvedState }
  const { def, scenarioText, ctx } = event;

  const imageSrc = EVENT_IMAGES[def.id] || null;

  function handleChoice(choice) {
    const resolvedState = choice.resolve(state, ctx || {});
    // Show the result text; stash resolvedState for when Continue is clicked
    setResult({
      ...(resolvedState._eventResult || { text: "Done.", type: "info" }),
      resolvedState,
    });
    // Do NOT call onResolve here — the modal must stay mounted so the result is readable
  }

  function handleContinue() {
    // Now dispatch — this clears pendingRandomEvent and unmounts the modal
    onResolve(result.resolvedState);
  }

  const resultBorderColor = result
    ? ({ success:"var(--good)", danger:"var(--bad)", fail:"var(--muted)", info:"var(--accent)" }[result.type] || "var(--accent)")
    : null;

  return (
    <div className="event-overlay">
      <div className="event-sheet">

        {imageSrc && (
          <div className="event-image-wrap">
            <img src={imageSrc} alt="" className="event-image" aria-hidden="true" />
          </div>
        )}

        <div className="event-eyebrow">Random Event</div>
        <h2>{def.title}</h2>

        {result ? (
          <>
            <div
              className={`event-result ${result.type}`}
              style={{ borderLeftColor: resultBorderColor }}
            >
              {result.text}
            </div>
            <div className="event-choices">
              <button className="primary" onClick={handleContinue}>
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="event-body">{scenarioText}</div>
            <div className="event-choices">
              {def.choices.map((choice, i) => {
                const enabled = typeof choice.requires !== "function" || choice.requires(state);
                return (
                  <button key={i} disabled={!enabled} onClick={() => handleChoice(choice)}>
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
