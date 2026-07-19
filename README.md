# Vein — London

A mobile-first economy game about running an underground magical resource
operation in contemporary London. This is the working v1 app, packaged from the
single-file HTML prototype as an installable static PWA.

## Running it

No build step, no dependencies — it's plain static files:

```sh
npx http-server .   # or any static file server, run from the repo root
```

Then open http://localhost:8080 on a phone-sized viewport (390px). Deployed via
Netlify from the repo root — `netlify.toml` sets `publish = "."` with no build
step.

## Installing on a phone

Serve over HTTPS (Netlify does this), open in the browser, and "Add to Home
Screen". The service worker (`sw.js`) is network-first with cache fallback:
updates land on next online load, and the game still opens offline.

## Structure

The game keeps the prototype's architecture — one global `gameState`, systems
mutate it, screens re-render from it (`renderGame()`). The scripts are classic
(non-module) scripts sharing one global scope, loaded in dependency order by
`index.html`:

| File | Contents |
|---|---|
| `js/data.js` | Static tables: ore types, recipes, devices, homes, factions, barometer, event card decks, districts, site tiers, district events |
| `js/state.js` | The `gameState` object (pure data tree — keep it that way, snapshots depend on it) |
| `js/systems.js` | All game logic: time, veins, crafting, combat, raids, barometer, contacts, travel, prospecting, sites |
| `js/render-core.js` | Render helpers + title, intro, home, veins, inventory screens |
| `js/save.js` | Save slots, versioned migrations, export/import (localStorage) |
| `js/render-world.js` | Stats, world hub, property, factions, barometer, save/load screens |
| `js/render-events.js` | Contact/SMS/story event screens |
| `js/render-map.js` | London map (SVG), district/prospect/district-event modals, cultivating tutorial |
| `js/render-craft-combat.js` | Crafting screen (type-link picker), combat screen, modals |
| `js/render-master.js` | `renderGame()` master compositor + global nav |
| `js/main.js` | Init + service worker registration |

## M1 — "London Exists" (v0.6)

The vision doc's M1 layer, on top of prototype parity:

- **Ore roster v2**: time / physics / life / fate / emotion (energy+motion merged
  into physics, void dropped). Saves migrate via `migrateSave()` in `js/save.js`
  — versioned, idempotent; migration #1 buys out void stock for cash.
- **9 districts + map screen** (`World → The Map`): ore biases, danger, site
  caps, faction presence; King's Cross recharges veins faster.
- **Travel rule**: acting in a district you're not in costs +1 time block; you
  wake at home (Shoreditch) each day.
- **Prospecting & sites**: prospect a district to discover a site
  (Barren→Saturated, quality visible before you pay); seeding happens into
  sites and the site's hospitability becomes the vein's permanent terroir
  (−1 recharge · +1 max level (Deep Lode) · +15% yield). ~5% of Saturated
  sites hold a free natural vein. Unclaimed sites get NPC-claimed over time.
- **District event deck**: 15 cards fired on travel/prospect, weighted by
  district and danger.
- **Cultivating tutorial**: Archie walks you through his transferred vein
  after the home-raid beat.

## M2 — "Everything Wants Your Ore" (v0.7)

Combat 2.0 and the systems that feed it:

- **Negotiation openers**: every hostile encounter starts at a standoff —
  **Talk** (vs reputation + faction backup), **Bribe** (cost scales with
  enemy greed × what you're visibly carrying), **Intimidate** (attack +
  weapon + reputation vs nerve), or **Fight**. A fight can be fully avoided.
- **Intent-telegraph combat**: each enemy shows its next move — Swing,
  Heavy, Grab, Brace, Call, Bolt — and your turn is about answering it.
  Built enemy-count-agnostic (`combat.enemies[]`); **Call** spawns a second
  combatant, **Grab** steals ore/cash that a **Bolt** carries off, **Brace**
  halves your hits unless you **Blast** through it.
- **Consumable answers**: Blast (ignores Brace), Shield (absorbs Heavy/Grab),
  Time Pearl (freezes Heavy), Enhancement Powder (Speed beats Grab / Strength
  big hit), Healing Burst (time+life combo, first two-type recipe), Healing
  Salve (overnight regen). Every intent has at least one answer.
- **Reputation (0–100)**: earned by wins and intimidation, decays slowly,
  feeds the openers. **Fieldcraft** skill: XP from fights/negotiations/
  escapes, capped ±15% bonuses, unlocks Read and Press maneuvers.
- **Enemy roster**: 8 templates across threat tiers T1–T3 with intent mixes,
  greed/nerve/affinity profiles; tiers scale with district danger and visible
  value, never player level.
- **NPC vein raids**: a daily roll per vein vs its security tier steals
  charged ore — the demand side of vein-security spending. Home raids run on
  the new intent combat.
- **Rewind** rebuilt for the array model (full-state snapshots); save
  migration adds the M2 fields and clears any old-format mid-fight combat.

## M3 — "The Craft" (v0.8)

Discovery, combination crafting, biology (affinities), and machines:

- **Affinities, fixed at birth**: a new-game screen offers five preset
  profiles or a random roll (rare allergy, compensated with bonus cash).
  One attuned type (+10% craft success, self-effects +25%, device fuel −10%),
  one resistant (self-effects ±50% dampened, both hostile and beneficial),
  everything else neutral. Allergic blocks self-use of that type entirely —
  the item still consumes, but backfires as damage instead of a buff.
  Enemies carry the same profile shape (already seeded in M2's templates);
  Time Pearl freeze and Pan's Prank potency now actually read it.
- **Type-link crafting picker**: the plan's headline UI risk. A row of five
  ore-type icons; tap one for its single-type recipes, tap a link (or a
  second icon) for exactly that combination's recipes — the two-tap sequence
  doubles as the "drag" alternative the plan describes. Verified at 390px
  with ≥44px tap targets.
- **Discovery-by-experimentation**: `DISCOVERABLE_RECIPES` (Prophet's
  Breath, Pan's Prank, Luck Be a Lady) start unknown; the *Discover* action
  spends ore + a time block and rolls vs crafting skill — unknown → hinted
  (silhouette, cost visible, name hidden) → known (full recipe). Failures
  are flavour text, occasionally a Minor Incident (extra ore lost). Recipes
  taught by story (Time Pearl, Rewind, Blast, Shield, the Salve/Burst pair,
  Enhancement Powder) are untouched — discovery layers on top, doesn't
  replace the M0–M2 teaching beats.
- **New consumables**: Prophet's Breath (time, self-evade), Pan's Prank
  (emotion — Panic forces a Bolt, Rage enrages + drops their accuracy,
  Confidence buffs your next hit; enemy emotion-resistance can shrug it
  off), Luck Be a Lady (fate — guaranteed max hit + a beat of pure evade).
- **Devices phase 1**: Assay Glass (fate, previews a district's best site
  tier before you spend the block prospecting), Ward Stone (physics, daily
  fuel, stacks with security to cut home raid chance), Cultivator's Still
  (life, daily fuel, +1 dev/day to one assigned vein), Ocular Lathe (life,
  cures the new minor Strained Eyes debuff — a rare crafting-failure side
  effect, −10% success, self-clears in a few days or instantly via the
  device). Utility devices are managed from Your Property, distinct from
  the single combat-equip slot.
- Save migration → v3 adds affinities/recipeState/Strained Eyes and
  backfills two M2 combat-state fields (`luckyTurn`/`luckyBonus`) that
  predate this milestone.

**Found and fixed a real M2 latent bug while touching this code**: combat
status effects (shield, evade, motion, strength) were being written to
`gameState.player` instead of the intentionally-scoped `gameState.combat.player`
— meaning the UI status chips never rendered and buffs could leak across
fights. Rescoped every read/write; snapshot/rewind already used the correct
object, so no data was ever lost, just displayed wrong and occasionally
carried over.

Conventions to preserve (they're what the vision doc's engine foundations rely
on): screens never mutate state directly; `gameState` stays a pure data tree
(no node refs, no closures) so combat snapshots/Rewind keep working; buttons
call system functions which end in `renderGame()`.

## Provenance

- Prototype: `Vein — London` single-file HTML (v0.5), split verbatim into the
  files above — game logic is unchanged.
- Design direction: *VEIN — Game Vision & Development Plan v1.1* (July 2026).
  This v1 is prototype parity; the plan's M1+ features (new ore roster, map,
  districts, prospecting) layer on top of this codebase.
