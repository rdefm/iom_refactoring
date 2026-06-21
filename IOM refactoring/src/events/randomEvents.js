import { ESSENTIA_TYPES, SIGIL_SLOTS, DAILY_LIVING_COST } from '@/data/constants';
import { CRAFTABLE_SIGILS, SIGIL_REGISTRY } from '@/data/sigils';
import { ESSENTIA_BASE_PRICE } from '@/data/constants';
import { addLogEntry, ledgerAdd } from '@/engine/log';

function unknownLearnableSigils(knownRecipes) {
  return Object.keys(CRAFTABLE_SIGILS).filter(id => !(knownRecipes||[]).includes(id));
}

export const RANDOM_EVENT_DEFINITIONS = [

  /* ── 1. The High Street Cover-Up ── */
  {
    id:"event_box_01", cooldown:30,
    title:"The High Street Cover-Up",
    scenario:"While walking past the local football pitch, you notice a council maintenance crew standing around a violently mangled green electrical box. As you get closer, your senses start screaming. There is a heavy, metallic tang of active kinetic essentia hanging in the air, and you can see the distinctive, jagged scorch marks of a powerful Slam sigil scorched right through the metal plating. Some apprentice clearly lost control of a spell and the council is completely clueless.",
    choices:[
      {
        label:"[Siphon the Residue] Wait for the workers to look away and draw in the leaking energy.",
        resolve(state) {
          const gained = 1 + Math.floor(Math.random()*3);
          const s = { ...state, essentia:{ ...state.essentia, Kinetic:(state.essentia.Kinetic||0)+gained } };
          return { ...addLogEntry(s, `Siphoned ${gained} Kinetic essentia from a damaged electrical box.`, "success"),
            _eventResult:{ text:`You manage to siphon ${gained} unit${gained>1?"s":""} of kinetic essentia before the pool goes cold. Your phone battery instantly jumps to 100%, and your screen flickers aggressively for the next ten minutes. (+${gained} Kinetic essentia)`, type:"success" } };
        }
      },
      {
        label:"[Eavesdrop on the Crew] Act like you're stretching and listen in.",
        resolve(state) {
          return { ...addLogEntry(state, "Eavesdropped on council workers. They blamed joyriders for a Slam sigil scorch. Deeply amusing.", "info"),
            _eventResult:{ text:`You overhear them confidently blaming "some joyriders in a hatchback last night." The sheer, mundane innocence of their theory is deeply amusing.`, type:"info" } };
        }
      },
      {
        label:"[Keep Moving] Head down and walk away.",
        resolve(state) {
          return { ...addLogEntry(state, "Walked past a Slam-scorched electrical box. Left the council to figure it out.", "info"),
            _eventResult:{ text:"You walk away and carry on with your day, leaving the council workers to head-scratch over their 'vandalism' problem.", type:"info" } };
        }
      },
    ]
  },

  /* ── 2. The Beckenham Mystic ── */
  {
    id:"event_con_01", cooldown:30,
    title:"The Beckenham Mystic",
    scenario:'A man in a tie-dye poncho corners you near the Oyster card barriers at the station, aggressively waving a piece of purple plastic masquerading as an "authentic aura-cleansing crystal." He stops, squinting intently at your forehead.\n\n"Wait. I can see your magical channels from here, friend. Your internal mana is completely blocked by bad vibes. This crystal will open your energy gates right up."\n\nAs an actual practitioner, you know for a fact his terminology is total nonsense and his crystal has all the magical potency of a milk bottle top.',
    choices:[
      {
        label:"[The Magical Lecture] Correct his terminology with excruciatingly precise drucraft theory.",
        resolve(state) {
          return { ...addLogEntry(state, "Delivered a full drucraft lecture to a crystal con artist. Won a psychological victory.", "info"),
            _eventResult:{ text:'You spend five minutes explaining the mathematical variance of ambient energy channels and why "mana" is a fictional concept. He looks utterly bewildered, mutters something about you ruining the mood, and backs away. You win a psychological victory.', type:"info" } };
        }
      },
      {
        label:"[The Minor Flex] Intentionally leak a tiny pulse of raw power into the air.",
        resolve(state) {
          return { ...addLogEntry(state, "Triggered a sensory spike near a crystal con artist. He fled in genuine horror.", "info"),
            _eventResult:{ text:"You trigger a tiny sensory spike. The con artist abruptly stops talking, shivers violently as his arm hairs stand on end, and stares at his plastic crystal in genuine horror. He breaks into a quick walk to get away from you.", type:"info" } };
        }
      },
      {
        label:"[Buy the Plastic] Hand over a fiver just to make him stop talking. (Costs £5)",
        requires(state) { return (state.money||0) >= 5; },
        resolve(state) {
          const s = ledgerAdd(state, -5, "Purple plastic crystal (Beckenham Mystic)");
          return { ...addLogEntry(s, "Paid £5 for a piece of purple plastic that smells of coconut body spray. Worth it.", "info"),
            _eventResult:{ text:"He takes the cash and blesses you. You are now the proud owner of a cheap piece of purple plastic. It smells faintly of coconut body spray. (−£5)", type:"info" } };
        }
      },
    ]
  },

  /* ── 3. The Standing Charge Shock ── */
  {
    id:"event_bill_01", cooldown:30,
    title:"The Standing Charge Shock",
    scenario:"Your phone buzzes with a high-priority notification from your banking app. You open it, expecting a standard update, only to find a terrifyingly massive direct debit has just cleared for your monthly energy bill. A sudden, general price hike on standing charges and unit rates across the UK has just gone into effect, hitting your cash reserves directly. You're left staring at the screen, bitterly reflecting on how fighting for your life in the magical underworld doesn't exempt you from the absolute tyranny of standard British utilities.",
    choices:[
      {
        label:"[Bitter Acceptance] Close the app and accept your financial fate.",
        resolve(state) {
          const newMult = Math.round(((state.livingCostMultiplier||1.0) + 0.05) * 100) / 100;
          const newCost = Math.round(DAILY_LIVING_COST * newMult);
          const s = { ...state, livingCostMultiplier: newMult };
          return { ...addLogEntry(s, `Energy bills went up. Daily living costs now £${newCost}/day (+5%).`, "danger"),
            _eventResult:{ text:`Your energy bills have gone up. Daily living costs are now £${newCost} (up ${Math.round((newMult-1)*100)}% total). You mentally vow to start turning off every single light switch the moment you leave a room.`, type:"danger" } };
        }
      },
      {
        label:"[Inquire About Tariffs] Open the energy app and try to dispute the charge.",
        resolve(state) {
          return { ...addLogEntry(state, "Fought an energy provider chatbot for ten minutes. Gained nothing but a headache.", "fail"),
            _eventResult:{ text:"You waste ten minutes fighting with an automated customer service chatbot that repeatedly fails to understand your questions. You gain absolutely nothing but a headache.", type:"fail" } };
        }
      },
      {
        label:"[The Drastic Measure] Calculate whether an illusion sigil could fake your meter readings.",
        resolve(state) {
          return { ...addLogEntry(state, "Considered defrauding the national grid via illusion sigil. Wisely decided against it.", "info"),
            _eventResult:{ text:"You quickly realise that trying to defraud a major UK energy supplier's digital grid is probably way more dangerous than dealing with hostile mages. You wisely drop the idea.", type:"info" } };
        }
      },
    ]
  },

  /* ── 4. The Stubborn Urbanite ── */
  {
    id:"event_fox_01", cooldown:30,
    title:"The Stubborn Urbanite",
    scenario:"While walking home down a dimly lit residential street at night, you find your path blocked by a mangy, unblinking London fox sitting dead centre on the pavement. Because of the lingering magical aura from your active items, the animal is completely transfixed by you. It isn't scared at all; it's just sitting there, tilting its head, treating your ambient essentia like a highly entertaining television screen. Worse, it's sitting directly on top of a dropped £20 note.",
    choices:[
      {
        label:"[The Standoff] Establish dominant eye contact and assert your authority.",
        resolve(state) {
          return { ...addLogEntry(state, "Lost a staring contest with a London fox. The £20 note on the pavement remains uncollected.", "fail"),
            _eventResult:{ text:"You stare at the fox. The fox opens its mouth and lets out a horrific, blood-curdling screech that echoes down the quiet suburban street. A light turns on in a nearby bedroom. You panic and back away, leaving the money behind.", type:"fail" } };
        }
      },
      {
        label:"[The Distraction] Toss a pebble down the street to draw it away.",
        resolve(state) {
          const s = ledgerAdd(state, 20, "Found £20 under a London fox");
          return { ...addLogEntry(s, "Outwitted a London fox with a pebble. Found £20 underneath it.", "success"),
            _eventResult:{ text:"The pebble clatters away. The fox snaps its head toward the sound, gets excited, and trots off to investigate. You quickly scoop up the crisp £20 note before it returns. (+£20)", type:"success" } };
        }
      },
      {
        label:"[Walk Around] Give the creature a very wide berth. It's his pavement now.",
        resolve(state) {
          return { ...addLogEntry(state, "Ceded the pavement to a fox. It judged you silently.", "info"),
            _eventResult:{ text:"You step into the road to bypass the animal. The fox watches you pass with an expression of pure, smug judgment. You lose no resources, but your dignity takes a minor hit.", type:"info" } };
        }
      },
    ]
  },

  /* ── 5. The Pawn Shop Find ── */
  {
    id:"event_pawn_01", cooldown:30,
    condition(state) { return unknownLearnableSigils(state.knownRecipes).length > 0; },
    scenario(state) {
      const unknown = unknownLearnableSigils(state.knownRecipes);
      const id = unknown[Math.floor(Math.random()*unknown.length)];
      const sig = SIGIL_REGISTRY[id];
      // Store target in randomEventFlags so resolve() can read it
      return { text:`Glancing into the dusty window of an independent pawn shop on a side street, you notice an old, mid-quality silver ring nestled among a tray of tarnished watches. Your internal senses pick up a faint, rhythmic hum. Getting closer, you recognise the unmistakable geometric lines of a genuine drucraft sigil etched into the inner band — clearly part of a dead mage's estate sold off by clueless relatives.\n\nThe focus is useless to you personally, but the sigil design is intact. It looks like a ${sig?sig.name:"sigil"} design. Studying it might let you reverse-engineer the blueprint.`, targetSigil:id };
    },
    choices:[
      {
        label:"[Buy the Ring to Study] Take it home and dissect the design properly. (Costs £45)",
        requires(state) { return (state.money||0) >= 45; },
        resolve(state, ctx) {
          const id = ctx.targetSigil;
          const sig = id ? SIGIL_REGISTRY[id] : null;
          const s = ledgerAdd(state, -45, "Sigil ring (pawn shop)");
          if(id && sig && !(s.knownRecipes||[]).includes(id)) {
            const kr = [...(s.knownRecipes||[]), id];
            return { ...addLogEntry({...s,knownRecipes:kr}, `Bought a sigil ring for £45. Learned the ${sig.name} blueprint.`, "success"),
              _eventResult:{ text:`You pay £45 for the ring, take it home, and spend a quiet evening dissecting the design under proper lighting. The pattern clicks into place! ${sig.name} blueprint added to your crafting log. (−£45)`, type:"success" } };
          }
          return { ...addLogEntry(s, "Bought a sigil ring for £45. Design too degraded to extract a clean blueprint.", "fail"),
            _eventResult:{ text:"You pay £45 and study it carefully, but the design is too degraded to extract a clean blueprint. (−£45)", type:"fail" } };
        }
      },
      {
        label:"[Memorise it Through the Window] Squint through the glass and copy the geometry.",
        resolve(state, ctx) {
          const id = ctx.targetSigil;
          const sig = id ? SIGIL_REGISTRY[id] : null;
          const chance = sig ? Math.max(5, Math.min(95, (state.competencies.sigil||0)*10 + (state.affinities[sig.type]??0)*10)) : 10;
          const roll = Math.floor(Math.random()*100) + 1;
          if(roll <= chance && id && sig && !(state.knownRecipes||[]).includes(id)) {
            const kr = [...(state.knownRecipes||[]), id];
            return { ...addLogEntry({...state,knownRecipes:kr}, `Memorised a pawn shop sigil ring through the window. Learned the ${sig.name} blueprint.`, "success"),
              _eventResult:{ text:`You successfully trace the core nodes through the glass and fill in the blanks using your own knowledge. The pattern clicks! ${sig.name} blueprint added to your crafting log. (Roll ${roll} ≤ ${chance}%)`, type:"success" } };
          }
          // Consolation: small chance at Sigil-Making +1
          const cur = state.competencies.sigil || 0;
          const trainChance = Math.min(100, Math.max(3, 25 - cur*3 + 25));
          const trainRoll = Math.floor(Math.random()*100) + 1;
          if(trainRoll <= trainChance) {
            const comp = { ...state.competencies, sigil: cur+1 };
            return { ...addLogEntry({...state,competencies:comp}, `Failed to memorise the pawn shop sigil, but the attempt sharpens your eye. Sigil-Making +1.`, "fail"),
              _eventResult:{ text:`You can't quite resolve the design, but the attempt sharpens your eye for sigil geometry. Sigil-Making increases to ${cur+1}! (Roll ${roll} > ${chance}%)`, type:"fail" } };
          }
          return { ...addLogEntry(state, "Failed to memorise a pawn shop sigil through the window.", "fail"),
            _eventResult:{ text:`A smudge on the window and a glare from the streetlamp distort your view. The shopkeeper walks over to lock the front door, blocking your view entirely. (Roll ${roll} > ${chance}%)`, type:"fail" } };
        }
      },
      {
        label:"[Walk Away] You don't have the cash or patience for this today.",
        resolve(state) {
          return { ...addLogEntry(state, "Walked past a pawn shop with a sigil ring in the window. Left it behind.", "info"),
            _eventResult:{ text:"You leave the shop window behind. By tomorrow, someone else will likely buy it as a quirky vintage accessory, completely unaware of the hidden magic wrapped around their finger.", type:"info" } };
        }
      },
    ]
  },

  /* ── 6. The Hedgerow Mystery ── */
  {
    id:"event_sigil_01", cooldown:30,
    condition(state) { return unknownLearnableSigils(state.knownRecipes).length > 0; },
    scenario(state) {
      const unknown = unknownLearnableSigils(state.knownRecipes);
      const id = unknown[Math.floor(Math.random()*unknown.length)];
      const sig = SIGIL_REGISTRY[id];
      return { text:`While walking past an overgrown hedge near the park, a metallic glint catches your eye. Tucked deep in the brambles is a discarded, burnt-out silver ring. When you pull it out you realise it's an overloaded magical focus — entirely drained of energy, but the geometric theory of the sigil etched into the blackened band is plain as day.\n\nYou recognise it as the design for a ${sig?sig.name:"sigil"}.`, targetSigil:id };
    },
    choices:[
      {
        label:"[Study the Geometry] Carefully trace the faded grooves into your notebook.",
        resolve(state, ctx) {
          const id = ctx.targetSigil;
          const sig = id ? SIGIL_REGISTRY[id] : null;
          if(id && sig && !(state.knownRecipes||[]).includes(id)) {
            const kr = [...(state.knownRecipes||[]), id];
            return { ...addLogEntry({...state,knownRecipes:kr}, `Studied a burnt-out focus in a hedgerow. Learned the ${sig.name} blueprint.`, "success"),
              _eventResult:{ text:`The underlying patterns click into place! You successfully deduce the missing nodes. ${sig.name} blueprint added to your crafting log.`, type:"success" } };
          }
          return { ...addLogEntry(state, "Studied a burnt-out focus. Couldn't resolve the design.", "fail"),
            _eventResult:{ text:"You study the ring carefully but can't quite resolve the design.", type:"fail" } };
        }
      },
      {
        label:"[Analyse the Burn Pattern] Study how it overloaded rather than the shape itself.",
        resolve(state) {
          const cur = state.competencies.sigil || 0;
          const chance = Math.min(100, Math.max(3, 25 - cur*3 + 25));
          const roll = Math.floor(Math.random()*100) + 1;
          if(roll <= chance) {
            const comp = { ...state.competencies, sigil: cur+1 };
            return { ...addLogEntry({...state,competencies:comp}, `Studied a burnt-out focus's failure mode. Sigil-Making +1.`, "success"),
              _eventResult:{ text:`You figure out exactly where the structural integrity failed under high magical pressure. The insight translates directly — Sigil-Making increases to ${cur+1}!`, type:"success" } };
          }
          return { ...addLogEntry(state, "Studied a burnt-out focus's failure mode. No breakthrough today.", "fail"),
            _eventResult:{ text:"You study the burn pattern carefully, but the specific failure mode doesn't translate into a broader insight today.", type:"fail" } };
        }
      },
      {
        label:"[Pragmatic Discard] Throw it back in the bushes.",
        resolve(state) {
          return { ...addLogEntry(state, "Tossed a burnt-out focus back into a hedgerow. A magpie claimed it immediately.", "info"),
            _eventResult:{ text:"You toss it back. A magpie immediately drops down, eyeballs it, and flies off with it. Good luck to the bird.", type:"info" } };
        }
      },
    ]
  },

  /* ── 7. The Southeastern Abyss ── */
  {
    id:"event_commute_01", cooldown:30,
    title:"The Southeastern Abyss",
    scenario:'Your train shudderingly grinds to a halt midway between stations, plunging the carriage into a heavy, communal silence. Minutes pass. Suddenly, the intercom crackles to life. The audio quality is so violently distorted it sounds like an ancient curse being chanted through an underwater walkie-talkie.\n\n"Bing-bong... dzzzt... passengers are advised that due to a... shhhk... points failure at... skrrrrt... please do not... [unintelligible screaming]."',
    choices:[
      {
        label:"[Apply Logic] Try to intellectually decipher the announcement.",
        resolve(state) {
          return { ...addLogEntry(state, "Attempted to decode a Southeastern rail announcement. Inconclusive.", "info"),
            _eventResult:{ text:"After running the phonetic data through your brain, you are 60% sure the conductor said there is a stray swan on the line near Herne Hill, and 40% sure he said the apocalypse has begun. You gain absolutely nothing from this realisation.", type:"info" } };
        }
      },
      {
        label:"[Sensory Attunement] Use your magical perception to check for a hidden message.",
        resolve(state) {
          return { ...addLogEntry(state, "Scanned train intercom for magical signals. Found only bad rail infrastructure.", "info"),
            _eventResult:{ text:"You focus your senses on the speakers. There is no magic here. It is just genuinely, tragically awful 1980s British rail technology. Your ears ache slightly from the effort.", type:"info" } };
        }
      },
      {
        label:"[Commuter Transcendence] Lock eyes onto a teeth-whitening ad and dissociate.",
        resolve(state) {
          return { ...addLogEntry(state, "Achieved commuter transcendence. Lost a small piece of your soul to the ceiling tiles.", "info"),
            _eventResult:{ text:"Time loses all meaning. You learn more about the texture of the carriage ceiling than you ever intended. No resources are lost, but a small piece of your soul definitely evaporated.", type:"info" } };
        }
      },
    ]
  },

];

/* ── rollRandomEvent (pure — returns event data or null, no state mutation) ── */
export function rollRandomEvent(state) {
  if(state.randomEventFiredToday) return null;
  if(Math.random() > 0.05) return null; // 5% per shift

  const pool = RANDOM_EVENT_DEFINITIONS.filter(def => {
    const flags = (state.randomEventFlags||{})[def.id] || {};
    if(flags.cooldownUntil && state.day < flags.cooldownUntil) return false;
    if(typeof def.condition === "function" && !def.condition(state)) return false;
    return true;
  });
  if(!pool.length) return null;

  const def = pool[Math.floor(Math.random()*pool.length)];
  // Scenario may be a string or a function that returns { text, ...ctx }
  const raw = typeof def.scenario === "function" ? def.scenario(state) : def.scenario;
  const scenarioText = typeof raw === "object" ? raw.text : raw;
  const ctx          = typeof raw === "object" ? raw      : {};

  return { def, scenarioText, ctx };
}
