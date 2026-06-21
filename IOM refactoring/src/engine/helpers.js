import { ESSENTIA_TYPES, RANKS, RANK_WEIGHTS, SIGIL_SLOTS, FACTIONS } from '@/data/constants';
import { SIGIL_REGISTRY, SECURITY_BY_RANK } from '@/data/sigils';

export function rollAffinities() {
  const pool = [-2,-1,0,1,2,3];
  const shuffle = a => [...a].sort(() => Math.random()-.5);
  let vals;
  do { vals = shuffle(pool).slice(0,5); }
  while (!vals.some(v=>v>=2) || !vals.some(v=>v<=-1));
  const types = shuffle([...ESSENTIA_TYPES]);
  const r = {};
  types.forEach((t,i) => r[t]=vals[i]);
  return r;
}

export function rollEssentiaLevel() {
  const r1 = 1+Math.random()*4, r2 = 1+Math.random()*4;
  const biased = 1+((r1+r2)/2-1)*0.6;
  return Math.round(Math.min(5,Math.max(1,biased))*2)/2;
}

export function weightedRank() {
  const total = RANK_WEIGHTS.reduce((a,b)=>a+b,0);
  let r = Math.random()*total;
  for(let i=0;i<RANKS.length;i++) { if(r<RANK_WEIGHTS[i]) return RANKS[i]; r-=RANK_WEIGHTS[i]; }
  return RANKS[RANKS.length-1];
}

export function generateSecurity(rank) {
  if(["D-","D","D+"].includes(rank) && Math.random()<0.5) {
    return { tier:"none", cameras:false, guards:"No guards on site.", desc:"This well sits unclaimed...", responseMins:[0,0], playerOwned:false, playerProtection:null, claimable:true };
  }
  const base = SECURITY_BY_RANK[rank] || SECURITY_BY_RANK["D-"];
  const sec = { ...base, playerOwned:false, playerProtection:null, claimable:false };
  if(sec.tier!=="none") sec.ownerFaction = FACTIONS[Math.floor(Math.random()*FACTIONS.length)];
  return sec;
}

export function perceiveWellSecurity(security, perception) {
  const chance = Math.min(95, 30+perception*10);
  if(Math.floor(Math.random()*100)+1 <= chance) return { tier:security.tier, guards:security.guards, desc:security.desc, accurate:true };
  const tiers=["none","light","medium","heavy"];
  const trueIdx = tiers.indexOf(security.tier);
  const fakeIdx = Math.max(0, trueIdx-(1+Math.floor(Math.random()*2)));
  const fakeDescs={ none:"Looks clear.", light:"Lightly watched — maybe a camera.", medium:"Some security presence.", heavy:"Hard to tell, but something feels guarded." };
  return { tier:tiers[fakeIdx], guards:"Unclear from here.", desc:fakeDescs[tiers[fakeIdx]], accurate:false };
}

export function affinityLabel(v) {
  if(v>=3) return "Very Strong"; if(v>=2) return "Strong"; if(v>=1) return "Positive";
  if(v===0) return "Neutral"; if(v>=-1) return "Weak"; return "Very Weak";
}

export function relationLabel(v) {
  if(v<=-61) return "Enemy"; if(v<=-21) return "Hostile"; if(v<=-1) return "Cold";
  if(v<=20) return "Neutral"; if(v<=50) return "Warm"; if(v<=80) return "Friendly"; return "Devoted";
}

export function sigilIsCapacityFree(sig) { return sig && sig.passive==="mending"; }

export function sigilCapacityCost(instance, affinities={}) {
  const sig = instance ? SIGIL_REGISTRY[instance.id] : null;
  if(!sig) return 1;
  const base = sig.capacityCost||1;
  const aff = affinities[sig.type]??0;
  return Math.max(0.1, Math.round(base*(1-aff*0.1)*100)/100);
}

export function equippedCapacityUsed(state) {
  let total=0;
  SIGIL_SLOTS.forEach(slot => {
    const key=state.equipped[slot]; if(!key) return;
    const inst=(state.sigils||[]).find(s=>s.key===key); if(!inst) return;
    const sig=SIGIL_REGISTRY[inst.id]; if(!sig) return;
    if(sigilIsCapacityFree(sig)) return;
    if(sig.triggeredOnly && (state.activePassives||{})[inst.key]) total+=sigilCapacityCost(inst,state.affinities);
  });
  return Math.round(total*100)/100;
}

export function sigilCraftChance(sigilId, competencies, affinities) {
  const sig=SIGIL_REGISTRY[sigilId]; if(!sig) return 0;
  return Math.max(0, Math.min(100, 20+(competencies.sigil||0)*5+(affinities[sig.type]??0)*3));
}

export function sigilLearnChance(sigilId, withTeacher, competencies, affinities) {
  const sig=SIGIL_REGISTRY[sigilId]; if(!sig) return 5;
  const base=Math.max(5,Math.min(95,(competencies.sigil||0)*10+(affinities[sig.type]??0)*10));
  return withTeacher?Math.min(95,base+30):base;
}

export function trainingChance(current) { return Math.min(95,Math.max(3,25-current*3)); }
export function scanChance(sensing) { return Math.min(100,15+sensing*7); }

export function hasSigilAnywhere(id, state) {
  return (state.sigils||[]).some(s=>s.id===id);
}
