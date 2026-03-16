**🤖 Copilot Master Instructions**

Farm Friends Chrome Extension

_Paste this file at the top of every new Copilot session_

# **Project Context**

You are helping build Farm Friends, a Chrome Extension idle farming game. The extension lives in Chrome's Side Panel (sidePanel API, Manifest V3). Players plant seeds, water and weed crops during an idle grow cycle, harvest produce, and donate to a virtual food bank. A real-time accelerated day/night cycle shows fireflies at night. Paid upgrades use ExtensionPay + Stripe.

| **Key Fact**     | **Value**                                                            |
| ---------------- | -------------------------------------------------------------------- |
| Chrome API       | sidePanel (NOT popup, NOT iframe, NOT content script)                |
| Manifest Version | 3 - use service workers, not background pages                        |
| Storage          | chrome.storage.local ONLY - never localStorage, never sessionStorage |
| Payments         | ExtensionPay (already configured) - never build custom payment flows |
| Renderer         | HTML5 Canvas API - no game engine libraries                          |
| Module pattern   | Plain ES modules (type=module in HTML) - no bundler, no npm          |
| Game clock       | 1 in-game day = 30 real minutes - constant in constants.js           |

## **Current Scene Layout Target (Active Redesign)**

- Keep canvas width unchanged; increase canvas height by roughly 2/3 for vertical scene depth
- Reserve bottom lane for a left-to-right dirt road
- Place vegetable stand on the right side above the road
- Harvested produce should be visually represented at the stand
- Customers should periodically appear, take produce, and increment community-help progress
- Fireflies should render only during the night phase (not dawn/day/dusk)

# **Rules: ALWAYS Do This**

## **Architecture**

- Put ALL tunable numbers (timers, prices, counts) in constants.js - never hardcode them inline
- Keep rendering code in renderer.js, game logic in farm.js, state in gameState.js - do not mix concerns
- Use chrome.storage.local for ALL persistence - wrap in async/await
- Export a clean public API from each module - do not reach into another module's internals
- Keep the game tick (setInterval 1000ms) and the render loop (requestAnimationFrame) as two separate loops

## **Canvas & Performance**

- Pause the requestAnimationFrame loop when document.hidden === true
- Resume the rAF loop in the visibilitychange event listener
- Clear the canvas at the start of every drawFrame() call
- Keep firefly particle count at FIREFLY_COUNT constant (default 15) - never create unbounded arrays
- Use ctx.save() and ctx.restore() around any canvas state changes (transforms, shadows, alpha)

## **State Management**

- Always load state first before any game logic runs - use an async init() pattern
- Always save state after every player action AND in the 30-second auto-save interval
- When loading state, always merge with DEFAULT_STATE to handle missing keys from older save files
- Calculate offline progression by comparing lastSaved timestamp to Date.now() on every load
- Cap offline progression at 2 hours to prevent abuse and preserve game feel

## **IAP**

- Always call ExtensionPay.getUser() on startup to validate premium status - never trust cached state alone
- Always show premium items in the shop UI - lock them visually, do not hide them
- Always keep the core game fully playable without any purchase

# **Rules: NEVER Do This**

## **Chrome Extension Anti-Patterns**

- Never use localStorage or sessionStorage - use chrome.storage.local
- Never add content_scripts to the manifest - do not inject into pages the user visits
- Never use chrome.tabs or page-level APIs in the side panel - wrong context
- Never rely on the MV3 service worker being alive - it can be killed at any time. No game state lives there.
- Never use eval() or inline script tags - Chrome CSP blocks them

## **Game Logic Anti-Patterns**

- Never kill a crop on missed attention - reset it to the previous stage instead
- Never hardcode growth timers inline - they all live in constants.js
- Never mutate state directly - always go through gameState setter functions
- Never run game logic inside the render loop - keep tick and render separate

## **IAP Anti-Patterns**

- Never build a custom payment flow - use ExtensionPay only
- Never gate the core game loop behind a purchase
- Never hide premium items - show them with a lock icon

# **Module Public APIs**

When generating or editing any module, respect these interfaces. Do not add dependencies that go in the opposite direction.

## **constants.js**

export const GAME_DAY_MINUTES = 30;

export const PLOT_COUNT = 6;

export const FIREFLY_COUNT = 15;

export const OFFLINE_CAP_HOURS = 2;

export const AUTOSAVE_INTERVAL_MS = 30000;

export const CROP_CONFIG = { carrot: { growMs: 300000, attentionWindowMs: 60000, coins: 5, friends: 1 }, ... };

## **gameState.js**

export async function loadState() // Returns full state, merged with defaults

export async function saveState(state) // Writes to chrome.storage.local

export function calculateOfflineProgress(state, nowMs) // Mutates and returns updated state

export const DEFAULT_STATE = { ... } // Used for merge on load

## **farm.js**

export function tickFarm(state, nowMs) // Advances all plots, returns updated state

export function plantCrop(state, plotId, cropType) // Returns updated state or throws

export function doAttentionTask(state, plotId) // Water or weed - returns updated state

export function harvestPlot(state, plotId) // Returns updated state

## **renderer.js**

export function drawFrame(ctx, state, gameTime) // Master draw call - call from rAF loop

// Internally calls: drawSky, drawPlots, drawFireflies, drawUI

## **daynight.js**

export function getGameMinutes(nowMs) // Returns 0-1440 based on real time

export function getPhase(gameMinutes) // Returns 'dawn'|'day'|'dusk'|'night'

export function getSkyGradient(ctx, gameMinutes, w, h) // Returns CanvasGradient

export function updateFireflies(particles, gameMinutes, dt) // Mutates particle array

## **foodbank.js**

export function deliverProduce(state) // Returns { updatedState, friendsAdded, milestone }

export function getMilestone(friendsHelped) // Returns milestone key or null

## **iap.js**

export async function initIAP() // Calls ExtensionPay.getUser(), updates state

export async function isPremium(feature) // Returns boolean

export async function purchaseFeature(feature) // Triggers ExtensionPay payment sheet

# **Effective Copilot Prompts for This Project**

Use these prompt patterns to get focused, on-spec responses from Copilot.

## **Starting a New File**

"Implement \[filename\] for Farm Friends following the module contract in the

master instructions. Import only from the modules listed. Export the

exact functions specified. Use chrome.storage.local for persistence."

## **Fixing a Bug**

"The \[function name\] in \[filename\] is \[describe bug\]. Fix it without

changing the function's public signature or adding new dependencies.

The fix should stay within this single file."

## **Adding a Feature**

"Add \[feature\] to Farm Friends. It belongs in \[filename\]. Follow the

existing code style. Put any new constants in constants.js. Do not

change any other files."

## **Balancing / Tuning**

"I want crops to grow \[faster/slower\]. Show me only the lines to change

in constants.js - do not touch any other files."

## **Asking for Review**

"Review this function against the Farm Friends master rules. Flag any

use of localStorage, hardcoded constants, state mutations, or mixing

of render and game logic."

# **New Session Startup Checklist**

At the start of every Copilot session, confirm the following before writing any code:

- Paste this entire document into the Copilot context or attach it as a file
- State which Phase you are currently building (Phase 1-6 from the Build Spec)
- State which specific file you are working on
- State what the file should do in one sentence
- Confirm you are NOT introducing any new npm dependencies

Example session opener:

"I'm building Farm Friends Phase 3, Step 3.1. I'm implementing renderer.js.

It should draw the sky gradient and 6 plot squares on the canvas using

placeholder colored rectangles. No libraries. Import only from constants.js

and daynight.js."
