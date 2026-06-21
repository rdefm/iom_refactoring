import React, { useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { SIGIL_REGISTRY, CRAFTABLE_SIGILS, LEARNABLE_SIGILS } from '@/data/sigils';
import { sigilLearnChance } from '@/engine/helpers';
import { ACT } from '@/engine/time';

export function ExperimentModal({ onClose }) {
  const { state, dispatch, toast } = useContext(GameCtx);

  const known = state.knownRecipes || [];
  const unknown = LEARNABLE_SIGILS.filter(id => !known.includes(id));

  function attempt(sigilId) {
    dispatch({ type: ACT.EXPERIMENT_SIGIL, sigilId });
    onClose();
  }

  if (unknown.length === 0) {
    return (
      <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sheet">
          <h2>🔬 Sigil Experimentation</h2>
          <p style={{ fontSize: ".78rem", color: "var(--muted)" }}>You already know every sigil recipe. Nothing left to experiment on.</p>
          <button onClick={onClose} style={{ marginTop: 10 }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <h2>🔬 Sigil Experimentation</h2>
        <p style={{ fontSize: ".78rem", color: "var(--muted)", margin: "0 0 4px" }}>
          Pick a sigil to experiment on. Success learns the recipe permanently. Failure still spends the shift — but nothing else is lost.
        </p>
        <p style={{ fontSize: ".78rem", color: "var(--muted)", margin: "0 0 10px" }}>
          Chance = (Sigil-Making × 10) + (Affinity × 10). Currently: Sigil-Making <b style={{ color: "var(--text)" }}>{state.competencies.sigil || 0}</b>.
        </p>
        {unknown.map(id => {
          const sig = SIGIL_REGISTRY[id];
          if (!sig) return null;
          const chance = sigilLearnChance(id, false, state.competencies, state.affinities);
          const recipe = CRAFTABLE_SIGILS[id];
          let costHint = "—";
          if (recipe && recipe.scaling) {
            costHint = `${recipe.essentiaType} essentia (scaling)`;
          } else if (recipe && recipe.essentiaCost) {
            costHint = Object.entries(recipe.essentiaCost).map(([t, a]) => `${a} ${t}`).join(", ");
          }
          return (
            <div key={id} className="protect-option">
              <div className="info">
                <b>{sig.name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({sig.type})</span></b>
                <span>Craft cost: {costHint} &nbsp;•&nbsp; Learn chance: <b style={{ color: "var(--accent)" }}>{chance}%</b></span>
                <span style={{ display: "block", fontSize: ".7rem", color: "var(--muted)", marginTop: 2 }}>{sig.desc}</span>
              </div>
              <button className="small" onClick={() => attempt(id)}>Experiment</button>
            </div>
          );
        })}
        <button onClick={onClose} style={{ marginTop: 10, width: "100%" }}>Cancel</button>
      </div>
    </div>
  );
}
