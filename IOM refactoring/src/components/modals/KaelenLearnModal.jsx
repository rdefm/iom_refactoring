import React, { useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { SIGIL_REGISTRY, CRAFTABLE_SIGILS, TEACHER_SIGIL_POOL } from '@/data/sigils';
import { sigilLearnChance } from '@/engine/helpers';
import { ACT } from '@/engine/time';

function kaelenLessonCost(relation) {
  return Math.max(0, Math.round(2000 * (1 - Math.floor(Math.max(0, relation) / 10) * 0.10)));
}

export function KaelenLearnModal({ onClose }) {
  const { state, dispatch, toast } = useContext(GameCtx);

  const kaelen = (state.contacts || []).find(c => c.id === "kaelen");
  if (!kaelen) return null;

  const cost = kaelenLessonCost(kaelen.relation);
  const known = state.knownRecipes || [];
  const teachable = (TEACHER_SIGIL_POOL.kaelen || []).filter(id => !known.includes(id));

  function attemptLesson(sigilId) {
    if (state.money < cost) {
      toast(`You need £${cost} for Kaelen's lesson.`);
      return;
    }
    dispatch({ type: ACT.KAELEN_TEACH, sigilId, cost });
    onClose();
  }

  if (teachable.length === 0) {
    return (
      <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sheet">
          <h2>📚 Learn a Sigil — Kaelen</h2>
          <p style={{ fontSize: ".78rem", color: "var(--muted)" }}>Kaelen has nothing left to teach you — you already know all his recipes.</p>
          <button onClick={onClose} style={{ marginTop: 10 }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <h2>📚 Learn a Sigil — Kaelen</h2>
        <p style={{ fontSize: ".78rem", color: "var(--muted)", margin: "0 0 4px" }}>
          Kaelen teaches you the principles behind a chosen sigil. Each lesson costs{" "}
          <b style={{ color: "var(--gold)" }}>£{cost}</b> (discounted from £2,000 by your relation).
        </p>
        <p style={{ fontSize: ".78rem", color: "var(--muted)", margin: "0 0 10px" }}>
          Teaching bonus: +30% to your learn chance. Budget:{" "}
          <b style={{ color: state.money >= cost ? "var(--gold)" : "var(--danger)" }}>£{state.money}</b>.
        </p>
        {teachable.map(id => {
          const sig = SIGIL_REGISTRY[id];
          if (!sig) return null;
          const chance = sigilLearnChance(id, true, state.competencies, state.affinities);
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
                <span>Craft cost: {costHint} &nbsp;•&nbsp; Learn chance with teaching: <b style={{ color: "var(--good)" }}>{chance}%</b></span>
                <span style={{ display: "block", fontSize: ".7rem", color: "var(--muted)", marginTop: 2 }}>{sig.desc}</span>
              </div>
              <button className="small" disabled={state.money < cost} onClick={() => attemptLesson(id)}>
                Learn
              </button>
            </div>
          );
        })}
        <button onClick={onClose} style={{ marginTop: 10, width: "100%" }}>Cancel</button>
      </div>
    </div>
  );
}
