import {
  AUTOSAVE_INTERVAL_MS,
  FIREFLY_COUNT,
  GAME_TICK_MS,
  STATUS_MESSAGE_MS,
} from './constants.js';
import { getGameMinutes, updateFireflies, createFireflies } from './daynight.js';
import { doAttentionTask, harvestPlot, plantCrop, tickFarm } from './farm.js';
import { deliverProduce } from './foodbank.js';
import { calculateOfflineProgress, loadState, saveState } from './gameState.js';
import { drawFrame, getPlotHitFromPoint } from './renderer.js';
import { initIAP } from './iap.js';
import {
  getSelectedSeed,
  setStatusMessage,
  showMilestoneOverlay,
  updateFoodBankUI,
  updateInventoryUI,
  wireUIHandlers,
} from './ui.js';

let state;
let ctx;
let rafId = null;
let tickIntervalId = null;
let autosaveIntervalId = null;
let fireflies = [];
let previousRenderMs = performance.now();
let selectedSeed = 'carrot';
let statusTimeoutId = null;

function gameTick() {
  const now = Date.now();
  state = tickFarm(state, now);
  updateHud();
}

function updateHud(options = {}) {
  updateFoodBankUI(state, options);
  updateInventoryUI(state);
}

function showStatus(message) {
  setStatusMessage(message);
  if (statusTimeoutId !== null) {
    clearTimeout(statusTimeoutId);
  }

  statusTimeoutId = setTimeout(() => {
    setStatusMessage('');
    statusTimeoutId = null;
  }, STATUS_MESSAGE_MS);
}

function startGameTick() {
  if (tickIntervalId !== null) {
    return;
  }

  tickIntervalId = setInterval(gameTick, GAME_TICK_MS);
}

function stopGameTick() {
  if (tickIntervalId === null) {
    return;
  }

  clearInterval(tickIntervalId);
  tickIntervalId = null;
}

function renderLoop() {
  const nowPerf = performance.now();
  const dtMs = nowPerf - previousRenderMs;
  previousRenderMs = nowPerf;

  const gameMinutes = getGameMinutes(Date.now());
  updateFireflies(fireflies, gameMinutes, dtMs, ctx.canvas.width, ctx.canvas.height);
  drawFrame(ctx, state, gameMinutes, fireflies, nowPerf);

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
    stopGameTick();
    pauseRender();
    return;
  }

  startGameTick();
  resumeRender();
}

function getFirstEmptyPlotId() {
  const emptyPlot = state.plots.find((plot) => plot.stage === 'empty');
  return emptyPlot ? emptyPlot.id : null;
}

async function applyStateUpdate(nextState, statusMessage) {
  const friendsBefore = state.friendsHelped;
  state = await saveState(nextState);
  updateHud({ animateFrom: friendsBefore });
  if (statusMessage) {
    showStatus(statusMessage);
  }
}

async function onPlant(plotId = null) {
  try {
    const targetPlotId = plotId ?? getFirstEmptyPlotId();
    if (targetPlotId === null) {
      showStatus('No empty plots right now.');
      return;
    }

    const nextState = plantCrop(state, targetPlotId, selectedSeed);
    await applyStateUpdate(nextState, `Planted ${selectedSeed} seed.`);
  } catch (error) {
    showStatus(error.message);
  }
}

async function onDonate() {
  const friendsBefore = state.friendsHelped;
  const { updatedState, friendsAdded, milestone } = deliverProduce(state);
  const donatedAnything = Object.values(state.inventory).some((value) => value > 0);

  state = await saveState(updatedState);
  updateHud({ animateFrom: friendsBefore });

  if (donatedAnything) {
    showStatus(`Donation delivered. +${friendsAdded} friends helped.`);
  } else {
    showStatus('Nothing to donate yet.');
  }

  if (milestone) {
    showMilestoneOverlay(milestone);
  }
}

function onShop() {
  showStatus('Shop flow scaffolded; Phase 6 implementation pending.');
}

function onSeedChange() {
  selectedSeed = getSelectedSeed();
  showStatus(`Selected seed: ${selectedSeed}.`);
}

async function onCanvasClick(event) {
  if (!(event.currentTarget instanceof HTMLCanvasElement)) {
    return;
  }

  const canvas = event.currentTarget;
  const bounds = canvas.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * canvas.width;
  const y = ((event.clientY - bounds.top) / bounds.height) * canvas.height;

  const hit = getPlotHitFromPoint(x, y, state.plots, canvas.width);
  if (!hit) {
    return;
  }

  const clickedPlot = state.plots.find((plot) => plot.id === hit.plotId);
  if (!clickedPlot) {
    return;
  }

  if (clickedPlot.stage === 'empty') {
    await onPlant(clickedPlot.id);
    return;
  }

  if (clickedPlot.stage === 'growing' && hit.zone === 'attention' && clickedPlot.attentionType) {
    const nextState = doAttentionTask(state, clickedPlot.id);
    await applyStateUpdate(nextState, 'Attention task completed.');
    return;
  }

  if (clickedPlot.stage === 'ready') {
    const nextState = harvestPlot(state, clickedPlot.id);
    await applyStateUpdate(nextState, `Harvested ${clickedPlot.crop}.`);
  }
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

  selectedSeed = getSelectedSeed();

  wireUIHandlers({ onPlant, onDonate, onShop, onSeedChange, onCanvasClick });
  updateHud();

  startGameTick();
  autosaveIntervalId = setInterval(async () => {
    state = await saveState(state);
  }, AUTOSAVE_INTERVAL_MS);

  document.addEventListener('visibilitychange', handleVisibility);
  resumeRender();
}

init().catch((error) => {
  if (autosaveIntervalId !== null) {
    clearInterval(autosaveIntervalId);
  }
  console.error('Farm Friends bootstrap error:', error);
});
