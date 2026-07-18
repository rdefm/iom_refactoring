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
| `js/data.js` | Static tables: ore types, recipes, devices, homes, factions, barometer, event card decks |
| `js/state.js` | The `gameState` object (pure data tree — keep it that way, snapshots depend on it) |
| `js/systems.js` | All game logic: time, veins, crafting, combat, raids, barometer, contacts |
| `js/render-core.js` | Render helpers + title, intro, home, veins, inventory screens |
| `js/save.js` | Save slots, autosave, export/import (localStorage) |
| `js/render-world.js` | Stats, world hub, property, factions, barometer, save/load screens |
| `js/render-events.js` | Contact/SMS/story event screens |
| `js/render-craft-combat.js` | Crafting screen, combat screen, modals |
| `js/render-master.js` | `renderGame()` master compositor + global nav |
| `js/main.js` | Init + service worker registration |

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
