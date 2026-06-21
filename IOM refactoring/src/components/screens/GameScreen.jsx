import React, { useState, useContext } from 'react';
import { GameCtx } from '@/components/layout/Context';
import { SHIFTS } from '@/data/constants';
import { ACT } from '@/engine/time';
import { BottomNav } from '@/components/layout/BottomNav';
import { AnimationLayer } from '@/components/layout/AnimationLayer';
import { ActionPanel } from '@/components/panels/ActionPanel';
import { CharacterPanel } from '@/components/panels/CharacterPanel';
import { WellsPanel } from '@/components/panels/WellsPanel';
import { ContactsPanel } from '@/components/panels/ContactsPanel';
import { HomePanel } from '@/components/panels/HomePanel';
import { RandomEventModal } from '@/components/modals/RandomEventModal';
import { ContactEventModal } from '@/components/modals/ContactEventModal';
import { FavourModal } from '@/components/modals/FavourModal';
import { SellEssentiaModal } from '@/components/modals/SellEssentiaModal';
import { BuyEssentiaModal } from '@/components/modals/BuyEssentiaModal';
import { ProtectWellModal } from '@/components/modals/ProtectWellModal';
import { ArmsShopModal } from '@/components/modals/ArmsShopModal';
import { LedgerModal } from '@/components/modals/LedgerModal';
import { CombatModal } from '@/components/modals/CombatModal';
import { ExperimentModal } from '@/components/modals/ExperimentModal';
import { KaelenLearnModal } from '@/components/modals/KaelenLearnModal';
import { AndreaBuyWellModal } from '@/components/modals/AndreaBuyWellModal';

export function GameScreen() {
  const { state, dispatch, combat } = useContext(GameCtx);
  const [activeTab, setActiveTab] = useState("action");
  const [anim, setAnim]   = useState(null);   // { type, label, duration, onDone }
  const [modal, setModal] = useState(null);   // { type, ...props }

  const badges = {
    contacts: (state.pendingContactRequests||[]).length > 0,
    action:   (state.pendingRaidAlerts||[]).filter(a=>!a.resolved).length > 0 || !!state.pendingHomeRaid,
  };

  const ae = state.activeEvent;

  function openModal(type, props={}) { setModal({ type, ...props }); }
  function closeModal() { setModal(null); }

  function playAnim(type, label, duration, onDone) {
    setAnim({ type, label, duration, onDone });
  }
  function onAnimDone() {
    const cb = anim?.onDone;
    setAnim(null);
    if(cb) cb();
  }

  function renderTab() {
    switch(activeTab) {
      case "action":    return <ActionPanel onPlayAnim={playAnim} openModal={openModal}/>;
      case "character": return <CharacterPanel openModal={openModal}/>;
      case "wells":     return <WellsPanel openModal={openModal}/>;
      case "contacts":  return <ContactsPanel openModal={openModal}/>;
      case "home":      return <HomePanel openModal={openModal}/>;
      default:          return null;
    }
  }

  function handleEventResolved(resolvedState) {
    dispatch({ type: ACT.APPLY_RANDOM_EVENT, resolvedState });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="title">🜂 Inheritance of Magic</span>
        <span className="day-chip">Day {state.day} · {SHIFTS[state.shiftIndex]}</span>
      </header>
      <main className="tab-content" role="main">{renderTab()}</main>
      <BottomNav activeTab={activeTab} setTab={setActiveTab} badges={badges}/>

      {/* Combat overlay */}
      {!anim && combat && <CombatModal/>}

      {/* Animation layer */}
      {anim && <AnimationLayer anim={anim} onComplete={onAnimDone}/>}

      {/* Random event */}
      {!anim && !combat && state.pendingRandomEvent && (
        <RandomEventModal event={state.pendingRandomEvent} onResolve={handleEventResolved}/>
      )}

      {/* Contact event */}
      {!anim && !combat && ae && (
        <ContactEventModal
          eventId={ae.eventId} stateKey={ae.stateKey} ctx={ae.ctx}
          onClose={()=>dispatch({type:ACT.CLOSE_EVENT})}/>
      )}

      {/* Modal switcher */}
      {!anim && !combat && modal && (() => {
        switch(modal.type) {
          case "favour":  return <FavourModal contactId={modal.contactId} onClose={closeModal}/>;
          case "sell":    return <SellEssentiaModal onClose={closeModal}/>;
          case "buy":     return <BuyEssentiaModal onClose={closeModal}/>;
          case "protect": return <ProtectWellModal wellId={modal.wellId} onClose={closeModal}/>;
          case "arms":    return <ArmsShopModal onClose={closeModal}/>;
          case "ledger":  return <LedgerModal onClose={closeModal}/>;
          case "experiment": return <ExperimentModal onClose={closeModal}/>;
          case "kaelen_learn": return <KaelenLearnModal onClose={closeModal}/>;
          case "andrea_buy_well": return <AndreaBuyWellModal onClose={closeModal}/>;
          default:        return null;
        }
      })()}
    </div>
  );
}
