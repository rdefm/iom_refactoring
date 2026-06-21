import { ESSENTIA_TYPES, SHIFTS } from '@/data/constants';

export function addLogEntry(state, text, type="info") {
  const entry={ text, type, day:state.day, shift:SHIFTS[state.shiftIndex]||"morning" };
  return { ...state, log:[entry,...state.log].slice(0,100) };
}

export function ledgerAdd(state, amount, label) {
  const ledger=[...(state.ledger||[])];
  let day=ledger.find(e=>e.day===state.day);
  if(!day){ day={day:state.day,moneyIn:0,moneyOut:0,moneyItems:[],essentia:{}}; ESSENTIA_TYPES.forEach(t=>{day.essentia[t]={in:0,out:0};}); ledger.push(day); }
  if(amount>=0) day.moneyIn+=amount; else day.moneyOut+=Math.abs(amount);
  day.moneyItems.push({ label, amount });
  const sorted=ledger.sort((a,b)=>a.day-b.day);
  return { ...state, ledger: sorted.slice(-7), money: state.money+amount };
}
