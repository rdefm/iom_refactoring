import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';

export function RandomEventModal({ event, onResolve }) {
  const { state } = useContext(GameCtx);
  const [result, setResult] = useState(null);   // { text, type } after a choice is made
  const { def, scenarioText, ctx } = event;

  function handleChoice(choice) {
    const resolvedState = choice.resolve(state, ctx || {});
    // Capture the UI result text before dispatching
    setResult(resolvedState._eventResult || { text:"Done.", type:"info" });
    // Tell parent to apply state change (clears pendingRandomEvent)
    onResolve(resolvedState);
  }

  const resultBorderColor = result
    ? ({ success:"var(--good)", danger:"var(--bad)", fail:"var(--muted)", info:"var(--accent)" }[result.type] || "var(--accent)")
    : null;

  return (
    <div className="event-overlay">
      <div className="event-sheet">

        <div className="event-eyebrow">Random Event</div>
        <h2>{def.title}</h2>

        {result ? (
          <>
            <div className={`event-result ${result.type}`}
                 style={{ borderLeftColor: resultBorderColor }}>
              {result.text}
            </div>
            <div className="event-choices">
              <button className="primary" onClick={() => setResult(null)}>
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
