# Farm Friends

Chrome Side Panel idle farming extension (Manifest V3) with crop growth, food bank donations, and accelerated day/night visuals.

## Status

- Phase 1 scaffold complete (manifest, side panel shell, styling, service worker).
- Phase 2 in progress and functional (state model, storage, farm tick loop, offline progression simulation).
- Placeholder rendering and interaction are available for rapid validation before deeper feature work.

## Project Structure

- Extension root: farm-friends-extension/
- Side panel app: farm-friends-extension/sidepanel/
- Core modules: farm-friends-extension/sidepanel/js/
- Specs/instructions: docs/FarmFriends_BuildSpec.md and docs/FarmFriends_CopilotInstructions.md

## Run Locally (Chrome)

1. Open chrome://extensions
2. Enable Developer mode
3. Click Load unpacked
4. Select folder: farm-friends-extension/
5. Click the Farm Friends toolbar icon to open the side panel

## What Works Now

- Persistent state in chrome.storage.local
- 6 plot state model with stage transitions
- Game tick loop (1 second) and render loop (requestAnimationFrame) separated
- Day/night gradient cycle and firefly rendering
- Plant (basic) and donate actions wired to state changes
- Auto-save every 30 seconds and save-on-action
- Offline progression replay (capped at 2 hours)

## Validation Checklist (Current)

- Extension loads without console errors
- Side panel opens from extension action
- Plot states progress through sprouting/growing/ready
- Missed attention tasks recycle crop attention requirements (no crop death)
- Inventory donation increments friendsHelped and clears inventory
- State persists across side panel close/reopen

## Design Notes

- All tunable values are centralized in constants.js
- Logic and rendering are separated by module
- No content scripts are used
- Core game loop is playable without paid features

## Next Build Targets

- Phase 2 polish: richer plot interactions and tighter HUD state feedback
- Phase 3: sprite-based rendering, attention prompt visuals, and cleaner per-plot input UX
- Phase 5/6: milestone overlays, shop flow, and production-ready ExtensionPay wiring
