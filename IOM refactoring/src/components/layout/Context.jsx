import React, { createContext } from 'react';
import { SAVE_KEY } from '@/data/constants';
import { migrateState } from '@/engine/state';

export const GameCtx = createContext(null);

export function loadInitialState() {
  try { const r=localStorage.getItem(SAVE_KEY); if(r) return migrateState(JSON.parse(r)); } catch(e) {}
  return null;
}
