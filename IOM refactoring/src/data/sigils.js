export const SECURITY_BY_RANK = {
  "D-":{ tier:"none",   guards:"No guards on site.",responseMins:[0,0],desc:"Nothing. Not even a sign.",cameras:false },
  "D": { tier:"none",   guards:"No guards on site.",responseMins:[0,0],desc:"Unwatched and unmarked.",cameras:false },
  "D+":{ tier:"light",  guards:"A single bored watchman.",responseMins:[20,35],desc:"A lone guard, more interested in his phone than the well.",cameras:false },
  "C-":{ tier:"light",  guards:"A camera and a single guard.",responseMins:[15,30],desc:"One camera covers the approach, with a single guard nearby.",cameras:true },
  "C": { tier:"light",  guards:"Cameras and alarm wired to a guard post.",responseMins:[15,30],desc:"Cameras and a basic alarm. If triggered, a single guard responds.",cameras:true },
  "C+":{ tier:"light",  guards:"Cameras, alarm, one armed guard.",responseMins:[15,25],desc:"A wired alarm and cameras, with one armed guard stationed nearby.",cameras:true },
  "B-":{ tier:"medium", guards:"Light security team (2–3 lightly armed).",responseMins:[10,20],desc:"Cameras, alarms, and a small lightly-armed security presence.",cameras:true },
  "B": { tier:"medium", guards:"Security team of 3, armed, rotating patrol.",responseMins:[10,20],desc:"A rotating patrol of armed security, backed by alarms and cameras.",cameras:true },
  "B+":{ tier:"medium", guards:"Security team of 4, armed, with a response vehicle.",responseMins:[8,15],desc:"A proper security detail with a vehicle on standby.",cameras:true },
  "A-":{ tier:"heavy",  guards:"Squad of professional armed soldiers.",responseMins:[5,12],desc:"A professional armed squad guards this site directly.",cameras:true },
  "A": { tier:"heavy",  guards:"Squad of professional armed soldiers, reinforced.",responseMins:[5,10],desc:"A reinforced squad of professional soldiers.",cameras:true },
  "A+":{ tier:"heavy",  guards:"Elite squad, on-site, full overwatch.",responseMins:[3,8],desc:"An elite squad maintains permanent overwatch.",cameras:true }
};

export const SIGIL_REGISTRY = {
  light_sigil:{ id:"light_sigil", name:"Light Sigil", type:"Light", slot:"hand", capacityCost:1, combatEffect:"blind_stun", desc:"A Light sigil worn on the arm. Discharges a blinding flash that can stun enemies." },
  nod_laser:{ id:"nod_laser", name:"NOD Laser", type:"Light", slot:"hand", capacityCost:1, combatEffect:"incapacitate", desc:"A precision Light sigil. Fires a focused beam capable of incapacitating a target entirely." },
  shadow_man:{ id:"shadow_man", name:"Shadow Man", type:"Light", slot:"neck", capacityCost:1, combatEffect:"shadow", stealth:true, triggeredOnly:true, desc:"Shrouds you in living shadow. Enemies may flee; conceals your identity." },
  invisibility_sigil:{ id:"invisibility_sigil", name:"Invisibility Sigil", type:"Light", slot:"neck", capacityCost:1, combatEffect:"invisibility", stealth:true, triggeredOnly:true, desc:"Bends light around your body — renders you almost invisible." },
  strength_sigil:{ id:"strength_sigil", name:"Strength Sigil", type:"Life", slot:"neck", capacityCost:1, passive:"strength", triggeredOnly:true, desc:"Augments your physical power. While active, increases melee damage." },
  mending_sigil:{ id:"mending_sigil", name:"Mending Sigil", type:"Life", slot:"neck", capacityCost:0, passive:"mending", desc:"Always-on healing sigil — activates on Rest. Never counts toward capacity." },
  reflex_sigil:{ id:"reflex_sigil", name:"Reflex Sigil", type:"Life", slot:"neck", capacityCost:1, passive:"agility", triggeredOnly:true, desc:"Sharpens your nervous system. Increases effective Agility while active." },
  slam_sigil:{ id:"slam_sigil", name:"Slam", type:"Kinetic", slot:"hand", capacityCost:1, combatEffect:"slam", desc:"A Kinetic sigil worn on the arm. Fires a concussive wave — devastating at close range." },
  shield_sigil:{ id:"shield_sigil", name:"Shield", type:"Kinetic", slot:"hand", capacityCost:1, combatEffect:"shield_raise", shieldSigil:true, desc:"Creates an invisible kinetic bubble — stops bullets and Air Blades." },
  air_blades:{ id:"air_blades", name:"Air Blades", type:"Kinetic", slot:"hand", capacityCost:1, combatEffect:"air_blades", rangedSigil:true, desc:"Forces compressed air at range, cutting like thrown knives." },
  iron_fist:{ id:"iron_fist", name:"Iron Fist", type:"Matter", slot:"hand", capacityCost:1, passive:"iron_fist", triggeredOnly:true, desc:"Hardens your strikes with a Matter field — increases melee damage." },
  lightfoot:{ id:"lightfoot", name:"Lightfoot", type:"Matter", slot:"neck", capacityCost:1, passive:"agility", triggeredOnly:true, desc:"Decreases your mass — you move faster and react quicker." },
  static_sigil:{ id:"static_sigil", name:"Static", type:"Matter", slot:"hand", capacityCost:1, combatEffect:"static_shock", desc:"Collects ambient electricity. Discharge like a taser. Also reduces daily costs by 5%." },
  stutter_sigil:{ id:"stutter_sigil", name:"Stutter", type:"Matter", slot:"neck", capacityCost:1, passive:"agility", triggeredOnly:true, desc:"You move so fast you seem to stutter. Higher agility bonus than Lightfoot." },
  matter_invisibility_sigil:{ id:"matter_invisibility_sigil", name:"Adaptive Camouflage", type:"Matter", slot:"neck", capacityCost:1, combatEffect:"invisibility", stealth:true, triggeredOnly:true, desc:"Reshapes your skin and clothes to blend into surroundings." },
  haywire_sigil:{ id:"haywire_sigil", name:"Haywire", type:"Primal", slot:"hand", capacityCost:1, combatEffect:"haywire", desc:"A volatile Primal sigil. Devastating against targets with active Life sigils." },
};

export const CRAFTABLE_SIGILS = {
  light_sigil:{ sigilId:"light_sigil", name:"Light Sigil", essentiaCost:{ Light:10 } },
  nod_laser:{ sigilId:"nod_laser", name:"NOD Laser", essentiaCost:{ Light:50 } },
  strength_sigil:{ sigilId:"strength_sigil", name:"Strength Sigil", essentiaType:"Life", scaling:{ unit:10, bonusPerUnit:10, min:10 } },
  mending_sigil:{ sigilId:"mending_sigil", name:"Mending Sigil", essentiaCost:{ Life:15 } },
  slam_sigil:{ sigilId:"slam_sigil", name:"Slam", essentiaCost:{ Kinetic:15 } },
  iron_fist:{ sigilId:"iron_fist", name:"Iron Fist", essentiaType:"Matter", scaling:{ unit:10, bonusPerUnit:10, min:10 } },
  haywire_sigil:{ sigilId:"haywire_sigil", name:"Haywire", essentiaCost:{ Primal:25 } },
  shadow_man:{ sigilId:"shadow_man", name:"Shadow Man", essentiaCost:{ Light:25 } },
  invisibility_sigil:{ sigilId:"invisibility_sigil", name:"Invisibility Sigil", essentiaCost:{ Light:40 } },
  matter_invisibility_sigil:{ sigilId:"matter_invisibility_sigil", name:"Adaptive Camouflage", essentiaCost:{ Matter:40 } },
  lightfoot:{ sigilId:"lightfoot", name:"Lightfoot", essentiaType:"Matter", scaling:{ unit:10, bonusPerUnit:10, min:10 } },
  static_sigil:{ sigilId:"static_sigil", name:"Static", essentiaCost:{ Matter:15 } },
  stutter_sigil:{ sigilId:"stutter_sigil", name:"Stutter", essentiaType:"Matter", scaling:{ unit:10, bonusPerUnit:15, min:15 } },
  reflex_sigil:{ sigilId:"reflex_sigil", name:"Reflex Sigil", essentiaType:"Life", scaling:{ unit:10, bonusPerUnit:10, min:10, baseBonus:20 } },
  air_blades:{ sigilId:"air_blades", name:"Air Blades", essentiaCost:{ Kinetic:25 } },
  shield_sigil:{ sigilId:"shield_sigil", name:"Shield", essentiaCost:{ Kinetic:25 } },
};
export const LEARNABLE_SIGILS = Object.keys(CRAFTABLE_SIGILS);
export const TEACHER_SIGIL_POOL = {
  kaelen: ["light_sigil","nod_laser","shadow_man","invisibility_sigil","strength_sigil","mending_sigil","reflex_sigil"]
};
