import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { ESSENTIA_TYPES, SECTORS, RANK_ESSENTIA_YIELD } from '@/data/constants';
import { ACT } from '@/engine/time';

const ANDREA_WELL_GRADES = ["D-","D","D+","C-","C","C+","B-","B","B+"];
const ANDREA_WELL_BASE_PRICES = {
  "D-":5000,"D":15000,"D+":50000,
  "C-":100000,"C":200000,"C+":500000,
  "B-":1500000,"B":5000000,"B+":10000000
};
const ANDREA_WELL_PREMIUM_TYPES = ["Matter","Life"];

function andreaWellPrice(type, grade) {
  const base = ANDREA_WELL_BASE_PRICES[grade] || 0;
  const premium = ANDREA_WELL_PREMIUM_TYPES.includes(type) ? 1.2 : 1.0;
  return Math.round(base * premium);
}

function fmtMoney(n) {
  if (n >= 1000000) return `£${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}m`;
  if (n >= 1000) return `£${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `£${n}`;
}

export function AndreaBuyWellModal({ onClose }) {
  const { state, dispatch, toast } = useContext(GameCtx);
  const [type, setType] = useState(ESSENTIA_TYPES[0]);
  const [grade, setGrade] = useState("D-");

  const price = andreaWellPrice(type, grade);
  const canAfford = state.money >= price;

  if (state.linford_suspended) {
    return (
      <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sheet">
          <h2>🏗️ Buy Well — Linford's</h2>
          <p style={{ fontSize: ".78rem", color: "var(--danger)" }}>Your Linford's account is suspended. Reinstate it via Andrea's favour menu first.</p>
          <button onClick={onClose} style={{ marginTop: 10 }}>Close</button>
        </div>
      </div>
    );
  }

  if (!state.linford_partner) {
    return (
      <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sheet">
          <h2>🏗️ Buy Well — Linford's</h2>
          <p style={{ fontSize: ".78rem", color: "var(--muted)" }}>You aren't onboarded with Linford's yet. Complete setup via Andrea's favour menu.</p>
          <button onClick={onClose} style={{ marginTop: 10 }}>Close</button>
        </div>
      </div>
    );
  }

  function confirmPurchase() {
    if (!canAfford) { toast("Not enough funds."); return; }
    dispatch({ type: ACT.ANDREA_BUY_WELL, wellType: type, grade });
    onClose();
  }

  const hasPremium = ANDREA_WELL_PREMIUM_TYPES.includes(type);

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <h2>🏗️ Buy Well — Linford's</h2>
        <p style={{ fontSize: ".78rem", color: "var(--muted)", margin: "0 0 12px" }}>
          Andrea can source and transfer ownership of a well directly to you. It will arrive unprotected — security is your responsibility.
          Matter and Life wells carry a 20% premium.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: 4 }}>Essentia Type</div>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={{ width: "100%", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px", fontSize: ".85rem" }}
            >
              {ESSENTIA_TYPES.map(t => (
                <option key={t} value={t}>{t}{ANDREA_WELL_PREMIUM_TYPES.includes(t) ? " (+20%)" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: ".72rem", color: "var(--muted)", marginBottom: 4 }}>Grade</div>
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              style={{ width: "100%", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px", fontSize: ".85rem" }}
            >
              {ANDREA_WELL_GRADES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ background: "var(--panel)", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: ".82rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--muted)" }}>Price</span>
            <span style={{ color: "var(--gold)", fontWeight: 700 }}>{fmtMoney(price)}</span>
          </div>
          {hasPremium && (
            <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: 3 }}>Includes 20% premium for {type} type.</div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "var(--muted)" }}>Your funds</span>
            <span style={{ color: canAfford ? "var(--gold)" : "var(--danger)", fontWeight: 700 }}>£{state.money.toLocaleString()}</span>
          </div>
        </div>

        <button className="primary" disabled={!canAfford} onClick={confirmPurchase} style={{ width: "100%" }}>
          Purchase Well
        </button>
        <button onClick={onClose} style={{ marginTop: 8, width: "100%" }}>Cancel</button>
      </div>
    </div>
  );
}
