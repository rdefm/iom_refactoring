import { ESSENTIA_TYPES, PLAYER_FACTION, SIGIL_SLOTS, FACTIONS, SECTORS } from '@/data/constants';
import { SIGIL_REGISTRY, CRAFTABLE_SIGILS, TEACHER_SIGIL_POOL } from '@/data/sigils';
import { ESSENTIA_BUYERS } from '@/data/economy';
import {ESSENTIA_BASE_PRICE } from '@/data/constants';
import { GANG_FIGHTERS } from '@/data/enemies';
import { addLogEntry, ledgerAdd } from '@/engine/log';
import { ACT } from '@/engine/time';
import { initCombat } from '@/engine/combat';

export const EVENT_DEFINITIONS = {
  req_felix_01: {
    id:"req_felix_01", contactId:"felix", title:"Felix's Backup", start:"hook",
    states:{
      hook:{
        speaker:"Felix",
        text:()=>`Felix reaches out, looking unusually tense.\n\n"I'm meeting a new independent source to negotiate a deal, and I'd feel a lot better if you had my back. It should be a standard hand-off, but come ready for trouble just in case. You in?"`,
        choices:[
          { label:`"Sure, let's go."`, next:"arrival" },
          { label:`"Give me a bit of time to prep."`, onSelect:(ctx)=>{ ctx.deferred=true; }, next:null },
        ]
      },
      arrival:{
        speaker:"Narrator",
        onEnter:(ctx,state)=>{
          ctx.ambushRoll=1+Math.floor(Math.random()*20);
          ctx.ambushSet=ctx.ambushRoll<=12;
        },
        text:(ctx)=>ctx.ambushSet
          ? `You shadow Felix toward an abandoned rail yard. Something feels off about tonight.`
          : `You shadow Felix to an abandoned rail yard for the hand-off.`,
        choices:[{ label:"Continue", next:(ctx)=>ctx.ambushSet?"trap":"deal" }]
      },
      deal:{
        speaker:"Narrator",
        text:()=>`The meeting is tense, but the source hands over the package without incident. Felix nods to you in relief as you head back.`,
        choices:[{ label:"Continue", next:"resolution" }]
      },
      trap:{
        speaker:"Narrator",
        onEnter:(ctx,state)=>{
          const perception=state.competencies.perception||0;
          ctx.perceptionRoll=1+Math.floor(Math.random()*20);
          ctx.perceptionTotal=ctx.perceptionRoll+perception;
          ctx.perceptionSuccess=ctx.perceptionTotal>=12;
        },
        text:(ctx)=>{
          const warn=ctx.perceptionSuccess
            ? `[SUCCESS] Your intuition spikes. You detect something hidden behind the concrete pillars ahead. It's a setup.\n\n`
            : `[FAILURE] The area seems dead quiet. You step into the centre of the yard completely.\n\n`;
          return warn+`As Felix steps forward, three figures emerge from the shadows, sigil-gems glowing on their knuckles.\n\n"Hand over your funds and maybe we let you walk."`;
        },
        choices:[
          { label:`[Persuasion] Talk them down.`, requires:(_,state)=>(state.competencies.persuasion||0)>=3, next:"deescalate" },
          { label:`"Strike first."`, next:"combat_result" },
          { label:`"Brace for the assault."`, onSelect:(ctx)=>{ ctx.surprisePenalty=!ctx.perceptionSuccess; }, next:"combat_result" },
        ]
      },
      deescalate:{
        speaker:"Narrator",
        text:()=>`You step out of the shadows, flagging that you wouldn't come alone. The thugs curse under their breath and back away into the night.`,
        choices:[{ label:"Continue", next:"resolution" }]
      },
      combat_result:{
        speaker:"Narrator",
        onEnter:(ctx,state,dispatch)=>{
          if(ctx.surprisePenalty){
            const penalty=Math.floor(state.maxHealth*0.10);
            ctx.healthPenalty=penalty;
          }
        },
        text:(ctx)=>{
          const penaltyLine=ctx.surprisePenalty&&ctx.healthPenalty
            ? `The ambushers catch you off guard — you take ${ctx.healthPenalty} damage before the fight even starts.\n\n` : "";
          return `${penaltyLine}Sigils flare to life in the darkness. The clash is brutal, but your presence ensures Felix is not overwhelmed. You drive them off, though not without breaking a sweat.`;
        },
        onEnterEffect:(ctx,state)=>{
          if(ctx.surprisePenalty&&ctx.healthPenalty){
            return { health: Math.max(1, state.health-ctx.healthPenalty) };
          }
          return {};
        },
        choices:[{ label:"Continue", next:"resolution" }]
      },
      resolution:{
        speaker:"Felix",
        text:()=>`Felix slaps your shoulder with a grim smile.\n\n"Invaluable asset as always. Glad I brought you along."`,
        terminal:true,
        onEnterEffect:(_,state)=>({ contactUpdate:{ contactId:"felix", changes:{ relation:Math.min(100,(state.contacts.find(c=>c.id==="felix")?.relation||0)+5) } }, logEntry:{ text:"Felix's opinion of you improves. Relation +5.", type:"success" } })
      }
    }
  },

  req_felix_05:{
    id:"req_felix_05", contactId:"felix", title:"The Off-the-Books Liquidation", start:"fire_sale",
    states:{
      fire_sale:{
        speaker:"Felix",
        onEnter:(ctx,state)=>{
          ctx.essentiaType=ESSENTIA_TYPES[Math.floor(Math.random()*ESSENTIA_TYPES.length)];
          ctx.essentiaAmount=1+Math.floor(Math.random()*50);
          ctx.discountPercent=15+Math.floor(Math.random()*46);
          const base=ESSENTIA_BASE_PRICE[ctx.essentiaType]*ctx.essentiaAmount;
          ctx.purchaseCost=Math.max(1,Math.round(base*(1-ctx.discountPercent/100)));
          ctx.haggled=false;
        },
        text:(ctx)=>`Felix pulls you aside.\n\n"I've got a time-sensitive idiot situation. An acquaintance needs to vanish from London before sunrise. He's dumping ${ctx.essentiaAmount} ${ctx.essentiaType} essentia just to clear weight — ${ctx.discountPercent}% off market rate. £${ctx.purchaseCost} flat. Do you have the liquidity?"`,
        choices:[
          { label:(ctx)=>`"I'll take it." (Pay £${ctx?.purchaseCost||"?"})`, next:(ctx,state)=>state.money<ctx.purchaseCost?"fire_sale_broke":"exchange" },
          { label:`[Persuasion] Try to haggle.`, next:"squeeze" },
          { label:`"I can't afford to lock up my cash right now."`, onSelect:(ctx)=>{ ctx.declined=true; }, next:null },
        ]
      },
      fire_sale_broke:{
        speaker:"Felix",
        text:(ctx)=>`[Insufficient funds — you have £${0}, need £${ctx.purchaseCost}]\n\nFelix raises an eyebrow. "That's a no, then."`,
        choices:[
          { label:`[Persuasion] Try to haggle the price down.`, next:"squeeze" },
          { label:`"You're right. I'll pass."`, onSelect:(ctx)=>{ ctx.declined=true; }, next:null },
        ]
      },
      squeeze:{
        speaker:"Narrator",
        onEnter:(ctx,state)=>{
          const persuasion=state.competencies.persuasion||0;
          ctx.squeezeRoll=1+Math.floor(Math.random()*20);
          ctx.squeezeTotal=ctx.squeezeRoll+persuasion;
          ctx.squeezeSuccess=ctx.squeezeTotal>=15;
          if(ctx.squeezeSuccess&&!ctx.haggled){ ctx.haggled=true; ctx.newPurchaseCost=Math.max(1,Math.round(ctx.purchaseCost*0.90)); }
        },
        text:(ctx)=>ctx.squeezeSuccess
          ? `[SUCCESS — Roll ${ctx.squeezeTotal}] You point out that moving anonymous cargo on short notice carries real risk. Felix winces, checks his watch.\n\n"Fine — extra 10% off. £${ctx.newPurchaseCost}. Do we have a deal?"`
          : `[FAILURE — Roll ${ctx.squeezeTotal}] Felix snaps his ledger shut.\n\n"Are you joking? I have three other people who understand how a fire sale works. The price is £${ctx.purchaseCost}. Buy it now, or walk."`,
        choices:[
          { label:(ctx)=>ctx.squeezeSuccess?`"Done. (Pay £${ctx?.newPurchaseCost||"?"})"` : `"Fine. I'll pay £${ctx?.purchaseCost||"?"}."`, next:(ctx,state)=>{ const cost=ctx.squeezeSuccess?ctx.newPurchaseCost:ctx.purchaseCost; if(state.money<cost)return"fire_sale_broke"; if(ctx.squeezeSuccess)ctx.purchaseCost=ctx.newPurchaseCost; return"exchange"; } },
          { label:`"Not worth it. I'm out."`, onSelect:(ctx)=>{ ctx.declined=true; }, next:null },
        ]
      },
      exchange:{
        speaker:"Narrator",
        onEnterEffect:(ctx,state)=>({
          money: state.money-ctx.purchaseCost,
          essentia:{ ...state.essentia, [ctx.essentiaType]:(state.essentia[ctx.essentiaType]||0)+ctx.essentiaAmount },
          logEntry:{ text:`Bought ${ctx.essentiaAmount} ${ctx.essentiaType} essentia from Felix for £${ctx.purchaseCost} (${ctx.discountPercent}% off market).`, type:"success" },
        }),
        text:(ctx)=>`You count out the bank notes. Felix takes the cash with a practiced flick of his fingers, sliding the box into your hands.\n\n"Pleasure doing business. Now move along."\n\n${ctx.essentiaAmount} ${ctx.essentiaType} essentia — clean and unregistered.`,
        choices:[{ label:"Continue", next:"deal_finalized" }]
      },
      deal_finalized:{
        speaker:"Felix",
        text:()=>`Felix gives you a small, satisfied nod as you part ways.\n\n"Smart move. That stuff'll move well, if you know where to look."`,
        terminal:true,
        onEnterEffect:(_,state)=>({ contactUpdate:{ contactId:"felix", changes:{ relation:Math.min(100,(state.contacts.find(c=>c.id==="felix")?.relation||0)+10) } }, logEntry:{ text:"Felix's opinion of you improves. Relation +10.", type:"success" } })
      }
    }
  },

  req_felix_07:{
    id:"req_felix_07", contactId:"felix", title:"The Late Request", start:"start",
    states:{
      start:{
        speaker:"Felix",
        text:()=>`It's late. Felix messages you, terse and to the point.\n\n"Still awake? Got something. Meet me outside the station in ten."`,
        choices:[
          { label:`"On my way."`, next:"meet" },
          { label:`"Too tired. Another time."`, onSelect:(ctx)=>{ ctx.declined=true; }, next:null },
        ]
      },
      meet:{
        speaker:"Narrator",
        onEnter:(ctx,state)=>{
          ctx.bonusMoney=50+Math.floor(Math.random()*100);
        },
        text:(ctx)=>`Felix is leaning on the wall outside the station, watching the street. He passes you a small envelope without making eye contact.\n\n"Someone dropped that for me earlier. Finder's cut. No questions." He's already walking away before you open it — £${ctx.bonusMoney}.`,
        onEnterEffect:(ctx,state)=>({
          money:state.money+ctx.bonusMoney,
          logEntry:{ text:`Felix passed you £${ctx.bonusMoney} — finder's cut from an unnamed deal.`, type:"success" },
        }),
        choices:[{ label:"Pocket it.", next:"end" }]
      },
      end:{
        speaker:"Narrator",
        text:()=>`You pocket the money and head home. Felix doesn't explain, and you don't ask.`,
        terminal:true,
        onEnterEffect:(_,state)=>({ contactUpdate:{ contactId:"felix", changes:{ relation:Math.min(100,(state.contacts.find(c=>c.id==="felix")?.relation||0)+3) } } })
      }
    }
  },
};

/* ══ FAVOUR OPTIONS ══ */
export const FAVOUR_OPTIONS = [
  {
    id:"favour_info",
    label:"Ask for information",
    desc:"Ask your contact what they've heard on the street.",
    requires:(_c,_s)=>true,
    resolve(contact, state) {
      const roll=Math.floor(Math.random()*100)+1;
      const chance=Math.max(10,Math.min(95,50+contact.relation/2));
      if(roll<=chance){
        const money=Math.floor(50+Math.random()*150+Math.max(0,contact.relation));
        return{ money, logEntry:`${contact.name} passes along a useful tip — you find £${money} acting on it.`, type:"success" };
      }
      return{ money:0, logEntry:`${contact.name} doesn't have much for you right now.`, type:"fail" };
    }
  },
  {
    id:"favour_money",
    label:"Ask for a cash favour",
    desc:"Call in a favour for a small cash sum. Requires relation ≥ 20.",
    requires:(c,_s)=>c.relation>=20,
    resolve(contact, state) {
      const money=Math.floor(100+Math.random()*200+Math.max(0,contact.relation));
      return{ money, relationCost:5, logEntry:`${contact.name} comes through with £${money}. Relation −5.`, type:"success" };
    }
  },
];


/* ── Per-contact special actions (shown below generic favour buttons) ── */
export const CONTACT_SPECIAL_ACTIONS = {
  kaelen: [
    {
      id: "kaelen_train",
      label: "🥊 Sigil Training Session",
      sublabel: (c) => `Kaelen drills you hands-on. Costs £${Math.max(0,Math.round(2000*(1-Math.floor(Math.max(0,c.relation)/10)*0.10)))} (discounted by relation). Needs relation ≥ 0.`,
      requires: (c, s) => c.relation >= 0 && s.money >= Math.max(0,Math.round(2000*(1-Math.floor(Math.max(0,c.relation)/10)*0.10))),
      action: (c, dispatch, toast, _openModal, state) => {
        const cost = Math.max(0, Math.round(2000*(1-Math.floor(Math.max(0,c.relation)/10)*0.10)));
        if(state.money < cost){ toast(`You need £${cost} for Kaelen's training session.`); return; }
        dispatch({ type: "KAELEN_TRAIN_SESSION", cost });
      }
    },
    {
      id: "kaelen_learn",
      label: "📚 Learn a Sigil Recipe",
      sublabel: (c, s) => {
        const known = s.knownRecipes || [];
        const teachable = (TEACHER_SIGIL_POOL.kaelen||[]).filter(id=>!known.includes(id));
        if(teachable.length===0) return "You already know all of Kaelen's recipes.";
        const cost = Math.max(0,Math.round(2000*(1-Math.floor(Math.max(0,c.relation)/10)*0.10)));
        return `Kaelen teaches you a specific sigil. Costs £${cost}/lesson. Teaches Light & Life sigils. Needs relation ≥ 0.`;
      },
      requires: (c, s) => {
        if(c.relation < 0) return false;
        const known = s.knownRecipes || [];
        return (TEACHER_SIGIL_POOL.kaelen||[]).some(id=>!known.includes(id));
      },
      action: (c, dispatch, toast, openModal) => openModal("kaelen_learn")
    },
  ],
  andrea: [
    {
      id: "andrea_onboard",
      label: "✅ Complete Linford's Onboarding",
      sublabel: (_c, s) => {
        if(s.linford_partner) return "Already onboarded — account active.";
        if(!s.linford_contract_pending) return "No pending application. Ask Felix to introduce you first.";
        const fee = s.skippedEquipmentFee ? 2000 : 3200;
        return `Transfer £${fee} to activate your Linford's trading account.`;
      },
      requires: (_c, s) => !s.linford_partner && s.linford_contract_pending,
      action: (_c, dispatch, toast, _openModal, state) => {
        const fee = state.skippedEquipmentFee ? 2000 : 3200;
        if(state.money < fee) { toast(`You need £${fee} to complete onboarding.`); return; }
        dispatch({ type: ACT.ANDREA_ONBOARD });
      }
    },
    {
      id: "andrea_buy_well",
      label: "🏗️ Purchase a Well",
      sublabel: (_c, s) => {
        if(s.linford_suspended) return "⚠️ Account suspended — reinstate it first.";
        if(!s.linford_partner) return "You are not yet onboarded with Linford's.";
        return "Andrea can source and transfer ownership of a well directly to you.";
      },
      requires: (_c, s) => s.linford_partner && !s.linford_suspended,
      action: (_c, dispatch, toast, openModal) => openModal("andrea_buy_well")
    },
    {
      id: "andrea_buy_kit",
      label: "🧰 Buy Compliance Kit (£1,200)",
      sublabel: (_c, s) => {
        if(!s.skippedEquipmentFee) return "Your account is already compliant — you have the kit.";
        return "Buy the proprietary tracking kit to bring your account into compliance.";
      },
      requires: (_c, s) => s.skippedEquipmentFee,
      action: (_c, dispatch, toast, _openModal, state) => {
        if(state.money < 1200) { toast("You need £1,200 to purchase the kit."); return; }
        dispatch({ type: ACT.ANDREA_BUY_KIT });
      }
    },
    {
      id: "andrea_reinstate",
      label: "🔓 Reinstate Account (£1,200)",
      sublabel: (_c, s) => {
        if(!s.linford_suspended) return "Your account is not suspended.";
        return "Pay £1,200 to reinstate your suspended Linford's account.";
      },
      requires: (_c, s) => s.linford_suspended,
      action: (_c, dispatch, toast, _openModal, state) => {
        if(state.money < 1200) { toast("You need £1,200 to reinstate your account."); return; }
        dispatch({ type: ACT.ANDREA_REINSTATE });
      }
    },
  ],
};
