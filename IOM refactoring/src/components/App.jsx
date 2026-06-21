import React, { useState, useReducer, useEffect, useRef } from 'react';
import { GameCtx, loadInitialState } from '@/components/layout/Context';
import { Toast } from '@/components/layout/Toast';
import { CharacterSelect } from '@/components/screens/CharacterSelect';
import { GameScreen } from '@/components/screens/GameScreen';
import { gameReducer } from '@/engine/reducer';
import { SAVE_KEY } from '@/data/constants';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, null, loadInitialState);
  const [combat, setCombat] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastRef = useRef(null);

  useEffect(()=>{
    if(state) { try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){} }
    else { try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
  },[state]);

  function toast(msg) {
    if(toastRef.current) clearTimeout(toastRef.current);
    setToastMsg(msg);
    toastRef.current=setTimeout(()=>setToastMsg(null),2400);
  }

  return (
    <GameCtx.Provider value={{ state, dispatch, toast, combat, setCombat }}>
      {state===null ? <CharacterSelect/> : <GameScreen/>}
      {toastMsg && <Toast msg={toastMsg}/>}
    </GameCtx.Provider>
  );
}
