**🌾 Farm Friends**

Chrome Extension - Build Specification

_Idle Farming Game with Food Bank & Day/Night Cycle_

Version 1.0 | For use with VSCode + GitHub Copilot

# **1\. Project Overview**

Farm Friends is a Chrome Extension idle farming game that lives in the browser sidebar. Players grow crops, complete active mini-tasks (watering, weeding), harvest produce, and donate to a food bank that tracks how many community members they have helped. A real-time day/night cycle tied to an accelerated in-game clock keeps the experience visually alive during a typical workday shift.

| **Attribute**    | **Value**                                               |
| ---------------- | ------------------------------------------------------- |
| Extension Type   | Chrome Side Panel (sidePanel API, Manifest V3)          |
| Game Genre       | Idle / Casual Hybrid                                    |
| Target Platform  | Chrome Desktop Browser                                  |
| Payment Provider | ExtensionPay + Stripe (one-time IAP)                    |
| Persistence      | chrome.storage.local (offline-safe)                     |
| Canvas Renderer  | HTML5 Canvas API                                        |
| Cycle Duration   | 1 in-game day = 30 real minutes (configurable constant) |

# **2\. Core Game Loop**

The loop is designed so a player can check in every few minutes during a workday and always have something to do, but is never punished for being away.

| **Step**                 | **Trigger**           | **Player Action**                         | **Idle?**                         |
| ------------------------ | --------------------- | ----------------------------------------- | --------------------------------- |
| 1\. Plant                | Empty plot clicked    | Select seed from inventory, click plot    | No                                |
| 2\. Sprout               | Timer: 0-2 min        | None required                             | Yes                               |
| 3\. Growing - Attention  | Timer: 2-5 min        | Water OR weed appears randomly (50/50)    | Yes (grows slower without action) |
| 4\. Ready to Harvest     | Timer complete        | Click plot to harvest                     | No                                |
| 5\. Deliver to Food Bank | Inventory has produce | Click 'Donate' button                     | No                                |
| 6\. Friends Helped +1    | Delivery confirmed    | Counter increments, celebration animation | Auto                              |

### **Missed Action Penalty (Gentle)**

If the watering/weeding window expires without player action, the crop does NOT die. It resets to Stage 2 (Growing) and requires the attention task again. This keeps the game forgiving for idle players without making tasks irrelevant.

# **3\. File Architecture**

All files live in a single flat extension folder. No build tools or bundlers required for v1.

/farm-friends-extension/

manifest.json <- MV3 manifest, permissions, side panel config

background.js <- Service worker: opens panel, handles ExtensionPay

/sidepanel/

index.html <- Main HTML shell

style.css <- All visual styles

/js/

main.js <- Entry point, wires all modules together

constants.js <- ALL tunable values (timers, prices, etc.)

gameState.js <- State shape, load/save, offline progression

farm.js <- Plot logic, growth timers, wilt system

foodbank.js <- Delivery logic, friends counter, milestones

daynight.js <- In-game clock, sky colors, firefly particles

renderer.js <- All canvas drawing (farm, sky, particles)

ui.js <- DOM updates, button states, notifications

iap.js <- ExtensionPay integration, premium checks

shop.js <- Seed shop, fertilizer UI, premium unlocks

/assets/

/sprites/ <- PNG sprites (crops at each stage, soil, tools)

/sounds/ <- Optional: short .ogg sound effects

/icons/ <- Extension icon at 16, 32, 48, 128px

_⚠️ Keep ALL tunable numbers (growth times, prices, firefly counts) in constants.js. This makes balancing the game trivial and keeps Copilot from scattering magic numbers throughout the codebase._

# **4\. Build Order**

Build strictly in this order. Do not jump ahead. Each phase produces a testable checkpoint before moving on.

## **Phase 1 - Scaffold & Manifest**

| **Step** | **File(s)**          | **What to Build**                                                                  | **Test Checkpoint**                                   |
| -------- | -------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1.1      | manifest.json        | MV3 manifest with sidePanel permission, storage, ExtensionPay host permission      | Extension loads in chrome://extensions without errors |
| 1.2      | background.js        | setPanelBehavior openPanelOnActionClick, ExtensionPay.init()                       | Clicking toolbar icon opens side panel                |
| 1.3      | sidepanel/index.html | HTML shell: canvas, control buttons, food bank counter div, shop modal placeholder | Side panel renders blank layout                       |
| 1.4      | sidepanel/style.css  | Full layout CSS: flex column, canvas sizing, button styles, night mode class       | Layout looks correct at 380px wide                    |

## **Phase 2 - State & Persistence**

| **Step** | **File(s)**  | **What to Build**                                                                 | **Test Checkpoint**                                                   |
| -------- | ------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 2.1      | constants.js | GAME_DAY_MINUTES=30, PLOT_COUNT=6, all growth timers, seed prices, firefly count  | File exists, values exported                                          |
| 2.2      | gameState.js | State shape (see Section 5), loadState(), saveState(), calculateOfflineProgress() | State saves/loads across panel close/reopen                           |
| 2.3      | farm.js      | Plot class, startGrowth(), tick(), triggerAttentionTask(), harvest()              | console.log shows plots progressing through stages in browser console |
| 2.4      | main.js      | Boot sequence: loadState, init farm, start tick loop (setInterval 1000ms)         | Game ticks without visual output                                      |

## **Phase 3 - Canvas Renderer**

| **Step** | **File(s)** | **What to Build**                                                                                        | **Test Checkpoint**                              |
| -------- | ----------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 3.1      | renderer.js | drawSky(ctx, timeOfDay), drawPlots(ctx, plots), drawCrop(ctx, plot) using placeholder colored rectangles | 6 plot squares visible on canvas                 |
| 3.2      | renderer.js | Replace rectangles with sprite rendering once assets exist. Add stage-based sprite selection.            | Crops show correct sprite per growth stage       |
| 3.3      | renderer.js | drawUI overlay: water/weed prompt icons floating above plots needing attention                           | Attention icons appear at correct plot positions |
| 3.4      | main.js     | Wire requestAnimationFrame loop calling renderer.drawFrame()                                             | Canvas animates at 60fps                         |

## **Phase 4 - Day/Night Cycle & Fireflies**

| **Step** | **File(s)** | **What to Build**                                                                         | **Test Checkpoint**                           |
| -------- | ----------- | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| 4.1      | daynight.js | getGameTime(): maps real ms to 0-1440 in-game minutes, loops every 30 real minutes        | console.log shows time advancing correctly    |
| 4.2      | daynight.js | getSkyColor(gameMinutes): returns gradient stops for Dawn/Day/Dusk/Night phases           | Sky gradient changes visibly as time advances |
| 4.3      | daynight.js | FireflyParticle class: x, y, opacity, drift vector, glowRadius, update(), draw()          | Fireflies appear after 9pm game time          |
| 4.4      | renderer.js | Integrate sky gradient as canvas background. Draw fireflies from particle array at night. | Full day/night visual cycle works end-to-end  |

## **Phase 5 - Food Bank**

| **Step** | **File(s)** | **What to Build**                                                                              | **Test Checkpoint**                             |
| -------- | ----------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 5.1      | foodbank.js | deliverProduce(inventory): calculates friends helped per item, updates state, returns summary  | Delivery increments friendsHelped correctly     |
| 5.2      | ui.js       | updateFoodBankUI(): renders friends helped counter with animated count-up, milestone badges    | Counter animates on delivery                    |
| 5.3      | ui.js       | Milestone system: 10, 25, 50, 100, 250 friends helped trigger celebratory overlay with message | Milestone overlay appears at correct thresholds |

## **Phase 6 - Shop & IAP**

| **Step** | **File(s)** | **What to Build**                                                                                        | **Test Checkpoint**                             |
| -------- | ----------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 6.1      | iap.js      | ExtensionPay.getUser() wrapper, isPremium(), onPurchase() handler, unlockPremiumSeeds()                  | Premium state persists across restarts          |
| 6.2      | shop.js     | Seed inventory UI: free seeds always shown, premium seeds shown with lock icon if not purchased          | Locked seeds display correctly for free users   |
| 6.3      | shop.js     | Fertilizer upgrade UI: shows effect description, price, purchase button. Applies boost to growth timers. | Fertilizer reduces grow time after purchase     |
| 6.4      | iap.js      | Payment flow: clicking locked item triggers ExtensionPay payment sheet, unlocks on success               | Purchase flow completes end-to-end in test mode |

# **5\. Game State Shape**

This is the single source of truth stored in chrome.storage.local. Never store state anywhere else.

// gameState.js - default state

{

plots: \[ // Always exactly PLOT_COUNT entries

{

id: 0, // 0-5

stage: 'empty', // empty | sprouting | growing | ready | wilted

crop: null, // 'carrot' | 'tomato' | 'sunflower' | null

plantedAt: null, // Date.now() timestamp

stageStartedAt: null, // When current stage began

attentionType: null, // 'water' | 'weed' | null

attentionExpiresAt: null, // Timestamp when window closes

fertilized: false // Applies speed boost if true

}

\],

inventory: {

carrot: 0, tomato: 0, sunflower: 0 // Harvested, not yet donated

},

seeds: {

carrot: 5, // Free starter seeds

tomato: 5,

sunflower: 0 // Premium seed - locked by default

},

coins: 0, // Earned by harvesting, spent in shop

friendsHelped: 0,

totalDeliveries: 0,

milestonesAchieved: \[\], // \['10friends', '25friends', ...\]

premium: {

sunflowerSeeds: false,

fertilizer: false

},

settings: {

soundEnabled: true

},

lastSaved: null, // Date.now() - for offline progression

version: 1 // Increment for migration handling

}

# **6\. Day/Night Cycle Specification**

One full in-game day = 30 real-world minutes (set by GAME_DAY_MINUTES in constants.js). This means during an 8-hour workday shift, the player sees approximately 16 full day/night cycles.

| **Game Time** | **Phase** | **Sky Colors**     | **Special Effects**                       |
| ------------- | --------- | ------------------ | ----------------------------------------- |
| 5:00 - 7:00   | Dawn      | #1a1a2e to #e8b89a | Soft orange gradient, no fireflies        |
| 7:00 - 17:00  | Day       | #87CEEB to #c8e6c9 | Bright sky, birds (optional sprite)       |
| 17:00 - 20:00 | Dusk      | #ff6b35 to #c2185b | Orange-purple gradient, fireflies fade in |
| 20:00 - 5:00  | Night     | #0d0d1a to #1a237e | Dark sky, fireflies active, stars         |

### **Firefly Particle Spec**

- Count: 15 particles (FIREFLY_COUNT in constants.js)
- Each particle: x, y, opacity (0-1), driftX, driftY, glowRadius (4-8px), blinkTimer
- Movement: gentle random drift, wrap at canvas edges
- Glow: ctx.shadowBlur = glowRadius, ctx.shadowColor = '#ffffaa'
- Blink: opacity oscillates using Math.sin(blinkTimer), each firefly has unique phase offset
- Fade in: fireflies transition opacity 0 to active over 2 real-world minutes at dusk

# **7\. Crop Types (v1)**

| **Crop**  | **Tier** | **Grow Time** | **Attention Window** | **Coins/Harvest** | **Friends Helped** | **Seeds**        |
| --------- | -------- | ------------- | -------------------- | ----------------- | ------------------ | ---------------- |
| Carrot    | Free     | 5 min         | 60 sec               | 5                 | 1                  | Starter (5 free) |
| Tomato    | Free     | 8 min         | 90 sec               | 8                 | 2                  | Starter (5 free) |
| Sunflower | Premium  | 4 min         | 45 sec               | 12                | 3                  | IAP unlock       |

_⚠️ All times are in constants.js. Balance by adjusting there during playtesting, not in individual files._

# **8\. In-App Purchase Specification**

## **Payment Provider**

Use ExtensionPay (already configured). Do not implement custom payment flows. ExtensionPay handles the Stripe payment sheet, receipt validation, and user account linking.

## **Premium Items (v1)**

| **Item**               | **Price**       | **Unlock**                            | **Implementation**                                     |
| ---------------------- | --------------- | ------------------------------------- | ------------------------------------------------------ |
| Sunflower Seeds Bundle | \$1.99 one-time | sunflower crop type permanently       | premium.sunflowerSeeds = true                          |
| Fertilizer Pack        | \$0.99 one-time | All crops grow 30% faster permanently | premium.fertilizer = true, apply multiplier in farm.js |

## **IAP Rules**

- NEVER gate core gameplay behind IAP - free seeds must always be plantable
- Premium items are enhancements only - the game is completable without them
- Show premium items in shop with lock icon - do not hide them
- On successful purchase: update state, save, re-render shop immediately
- On app restart: call ExtensionPay.getUser() to re-validate - do not rely solely on cached state

# **9\. Performance Rules**

The extension shares CPU with the user's active browsing. These rules are non-negotiable.

| **Rule**                                 | **Why**                                                    | **Implementation**                                    |
| ---------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| Pause canvas when panel hidden           | Saves CPU when user is not looking                         | document.addEventListener('visibilitychange', ...)    |
| Game logic tick: 1 per second            | State updates do not need 60fps                            | setInterval(gameTick, 1000) separate from render loop |
| Render loop: requestAnimationFrame       | Correct way to animate canvas, auto-pauses when tab hidden | requestAnimationFrame(drawFrame)                      |
| Save state: every 30 seconds + on action | Prevents data loss without excessive writes                | setInterval(saveState, 30000)                         |
| Fireflies: 15 max particles              | Canvas particles are CPU-cheap but do not over-scale       | FIREFLY_COUNT constant, never exceed 20               |
| No content scripts                       | Do not inject into pages the user visits                   | Omit content_scripts from manifest entirely           |

# **10\. Recommended Enhancements**

The following additions are suggested to improve player enjoyment and retention. None are required for v1 but are worth considering when building each module.

## **Engagement**

- Daily Streak Counter - reward players who open the game at least once per day with bonus seeds. Simple, powerful retention driver.
- Neighbor Visits - a purely cosmetic feature where a friendly NPC visits at random and leaves a small gift (2-3 coins). Costs nothing to implement, adds life to the world.
- Harvest Celebration - a 1-second particle burst (confetti-style) when a crop is harvested. Canvas particles, no library needed.
- Food Bank Billboard - show a rolling 'message from the community' on the food bank building when milestones are hit (e.g., 'Thanks to you, 50 families had fresh vegetables this week').

## **Quality of Life**

- Water All / Weed All Button - if multiple plots need the same attention, a single button handles all of them. Reduces click fatigue on active sessions.
- Notification Badge - use chrome.action.setBadgeText() to show the number of ready-to-harvest plots on the extension icon. Draws players back in.
- Settings Panel - sound toggle and a 'reset tutorial' option. Minimal but players expect it.
- Offline Catch-Up Cap - cap offline progression at 2 hours. This prevents a player returning after a week from having a full harvest instantly, which would feel cheap.

## **Future Updates (v2+)**

- Seasons - visual reskins of sky, soil, and crops. Winter = snow overlay, Spring = cherry blossom petals instead of fireflies.
- More Crops - pumpkin (Halloween seasonal), strawberry, corn. Each with unique grow curves.
- Community Garden - shared leaderboard of friends helped across all players (requires small backend or Firebase).
- Tool Upgrades - watering can (waters 2 plots at once), scarecrow (auto-weeds one plot per harvest cycle).

# **11\. Pre-Launch Testing Checklist**

- Extension loads without console errors in chrome://extensions
- Clicking toolbar icon opens side panel correctly
- All 6 plots cycle through all 5 stages correctly
- Missed attention task resets stage (does not kill crop)
- Harvest adds to inventory correctly
- Delivery to food bank increments friendsHelped and clears inventory
- Milestone overlays appear at 10, 25, 50, 100
- Day/night cycle completes one full loop in exactly 30 real minutes
- Fireflies appear only during night phase, fade out at dawn
- Game state survives panel close and browser restart
- Offline progression correctly calculates elapsed time on reload
- Premium items show as locked for non-paying users
- ExtensionPay purchase flow completes and unlocks content
- Canvas pauses when panel is hidden (check CPU in Task Manager)
- No content scripts or page modifications on visited sites
