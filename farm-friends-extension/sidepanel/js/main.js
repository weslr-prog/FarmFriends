import { AUTOSAVE_INTERVAL_MS, FIREFLY_COUNT, GAME_TICK_MS } from './constants.js';
import { getGameMinutes, updateFireflies, createFireflies } from './daynight.js';
import { tickFarm, plantCrop } from './farm.js';
import { deliverProduce } from './foodbank.js';
import { calculateOfflineProgress, loadState, saveState } from './gameState.js';
import { drawFrame } from './renderer.js';
import { initIAP } from './iap.js';
import { updateFoodBankUI, wireUIHandlers } from './ui.js';

let state;
let ctx;
let rafId = null;
let fireflies = [];
let previousRenderMs = performance.now();

function gameTick() {
  const now = Date.now();
  state = tickFarm(state, now);
  updateFoodBankUI(state);
}

function renderLoop() {
  const nowPerf = performance.now();
  const dtMs = nowPerf - previousRenderMs;
  previousRenderMs = nowPerf;

  const gameMinutes = getGameMinutes(Date.now());
  updateFireflies(fireflies, gameMinutes, dtMs, ctx.canvas.width, ctx.canvas.height);
  drawFrame(ctx, state, gameMinutes, fireflies);

  rafId = requestAnimationFrame(renderLoop);
}

function pauseRender() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function resumeRender() {
  if (rafId === null) {
    previousRenderMs = performance.now();
    rafId = requestAnimationFrame(renderLoop);
  }
}

function handleVisibility() {
  if (document.hidden) {
    pauseRender();
    return;
  }

  resumeRender();
}

async function onPlant() {
  try {
    const emptyPlot = state.plots.find((plot) => plot.stage === 'empty');
    if (!emptyPlot) {
      return;
    }

    state = plantCrop(state, emptyPlot.id, 'carrot');
    state = await saveState(state);
    updateFoodBankUI(state);
  } catch (error) {
    console.warn(error.message);
  }
}

async function onDonate() {
  const { updatedState } = deliverProduce(state);
  state = await saveState(updatedState);
  updateFoodBankUI(state);
}

function onShop() {
  console.info('Shop flow scaffolded; Phase 6 implementation pending.');
}

async function init() {
  const canvas = document.getElementById('farm-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Farm canvas element not found.');
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context unavailable.');
  }

  const loaded = await loadState();
  state = calculateOfflineProgress(loaded, Date.now());

  await initIAP();

  state = await saveState(state);

  fireflies = createFireflies(canvas.width, canvas.height, FIREFLY_COUNT);

  wireUIHandlers({ onPlant, onDonate, onShop });
  updateFoodBankUI(state);

  setInterval(gameTick, GAME_TICK_MS);
  setInterval(async () => {
    state = await saveState(state);
  }, AUTOSAVE_INTERVAL_MS);

  document.addEventListener('visibilitychange', handleVisibility);
  resumeRender();
}

init().catch((error) => {
  console.error('Farm Friends bootstrap error:', error);
});
