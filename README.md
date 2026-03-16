# Farm Friends

Chrome Side Panel idle farming extension (Manifest V3) with crop growth, food bank donations, and accelerated day/night visuals.

## Status

- Phase 1 scaffold complete (manifest, side panel shell, styling, service worker).
- Phase 2 functional (state model, storage, farm tick loop, offline progression simulation).
- Phase 3 visual/gameplay prototype active with side-scroller scene layout and task-node interactions.

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
- Day/night gradient cycle with fireflies at night only
- 2x3 crop task grid with click-to-assign interactions
- Worker movement to assigned nodes with 2D travel (horizontal + vertical)
- Plant mode flow (press Plant, then click target empty plot)
- Bottom-road scene with larger produce stand on right (slight road overlap)
- Harvested produce visible at stand inventory slots
- Timed customer pickups that remove produce and increment community impact
- Manual Donate action remains available
- Auto-save every 30 seconds and save-on-action
- Offline progression replay (capped at 2 hours)

## Validation Checklist (Current)

- Extension loads without console errors
- Side panel opens from extension action
- Plot states progress through sprouting/growing/ready
- Worker reaches both grid rows when assigned crop tasks
- Plant mode requires explicit target node click
- Missed attention tasks recycle crop attention requirements (no crop death)
- Stand inventory updates after harvest and decreases on customer pickup
- Donation increments friendsHelped and clears stand inventory
- State persists across side panel close/reopen
- Fireflies appear only during night phase

## Design Notes

- All tunable values are centralized in constants.js
- Logic and rendering are separated by module
- No content scripts are used
- Core game loop is playable without paid features

## Next Build Targets

- Phase 3 polish: sprite upgrades for crops, stand, worker, and customer characters
- Phase 4 polish: refine weather/sky ambience and cloud variation
- Phase 5/6: milestone UX expansion, shop flow, and production-ready ExtensionPay wiring
