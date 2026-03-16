import {
  AUTOSAVE_INTERVAL_MS,
  FIREFLY_COUNT,
  GAME_TICK_MS,
  STATUS_MESSAGE_MS,
  WORKER_SPEED_PX_PER_SEC,
  WORKER_TASK_DURATION_MS,
} from './constants.js';
import { getGameMinutes, updateFireflies, createFireflies } from './daynight.js';
import { doAttentionTask, harvestPlot, plantCrop, tickFarm } from './farm.js';
import { deliverProduce } from './foodbank.js';
import { calculateOfflineProgress, loadState, saveState } from './gameState.js';
import { clampWorldX, drawFrame, getTaskHitFromPoint, getTaskNodes } from './renderer.js';
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
let saveChain = Promise.resolve();

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

  updateWorker(dtMs);

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

function queueStateSave() {
  const snapshot = state;

  saveChain = saveChain
    .then(async () => {
      const saved = await saveState(snapshot);
      if (state === snapshot) {
        state = saved;
      }
    })
    .catch((error) => {
      console.warn('Save queue error:', error);
    });
}

function ensureWorkerState() {
  if (state.worker) {
    return;
  }

  state = {
    ...state,
    worker: {
      x: 42,
      y: 162,
      targetX: 42,
      facing: 1,
      status: 'idle',
      task: null,
      taskRemainingMs: 0,
    },
    pendingTask: null,
  };
}

function enqueueWorkerTask(taskPayload) {
  ensureWorkerState();

  state = {
    ...state,
    pendingTask: taskPayload,
  };
}

function executeWorkerTask(taskPayload) {
  const { plotId, task } = taskPayload;

  try {
    if (task.type === 'plant') {
      state = plantCrop(state, plotId, task.cropType ?? selectedSeed);
      showStatus(`Worker planted ${task.cropType ?? selectedSeed}.`);
    } else if (task.type === 'attention') {
      state = doAttentionTask(state, plotId);
      showStatus('Worker completed attention task.');
    } else if (task.type === 'harvest') {
      const plot = state.plots.find((entry) => entry.id === plotId);
      state = harvestPlot(state, plotId);
      showStatus(`Worker harvested ${plot?.crop ?? 'crop'}.`);
    }

    updateHud();
    queueStateSave();
  } catch (error) {
    showStatus(error.message);
  }
}

function updateWorker(dtMs) {
  ensureWorkerState();

  const worker = state.worker;
  const pendingTask = state.pendingTask;

  if (!worker.task && pendingTask) {
    state = {
      ...state,
      pendingTask: null,
      worker: {
        ...worker,
        task: pendingTask,
        targetX: pendingTask.nodeX,
        status: 'walking',
      },
    };
  }

  const activeWorker = state.worker;
  const direction = activeWorker.targetX >= activeWorker.x ? 1 : -1;
  const distance = Math.abs(activeWorker.targetX - activeWorker.x);
  const step = (WORKER_SPEED_PX_PER_SEC * dtMs) / 1000;

  let nextX = activeWorker.x;
  let nextStatus = activeWorker.status;
  let nextTaskRemainingMs = activeWorker.taskRemainingMs;

  if (distance > 0.5) {
    nextX = activeWorker.x + direction * Math.min(step, distance);
    nextStatus = 'walking';
  } else {
    nextX = activeWorker.targetX;
    if (!activeWorker.task) {
      nextStatus = 'idle';
    }
  }

  let completedTask = null;
  if (activeWorker.task && Math.abs(nextX - activeWorker.targetX) <= 0.5) {
    if (nextStatus !== 'working') {
      nextStatus = 'working';
      nextTaskRemainingMs = WORKER_TASK_DURATION_MS;
    } else {
      nextTaskRemainingMs = Math.max(0, nextTaskRemainingMs - dtMs);
      if (nextTaskRemainingMs === 0) {
        completedTask = activeWorker.task;
        nextStatus = 'idle';
      }
    }
  }

  state = {
    ...state,
    worker: {
      ...activeWorker,
      x: nextX,
      facing: direction,
      status: nextStatus,
      task: completedTask ? null : activeWorker.task,
      taskRemainingMs: completedTask ? 0 : nextTaskRemainingMs,
    },
  };

  if (completedTask) {
    executeWorkerTask(completedTask);
  }
}

async function onPlant(plotId = null) {
  const targetPlotId = plotId ?? getFirstEmptyPlotId();
  if (targetPlotId === null) {
    showStatus('No empty plots right now.');
    return;
  }

  const nodes = getTaskNodes(state.plots);
  const node = nodes.find((entry) => entry.plotId === targetPlotId);

  enqueueWorkerTask({
    plotId: targetPlotId,
    nodeX: node?.x ?? clampWorldX(180),
    task: { type: 'plant', cropType: selectedSeed },
  });
  showStatus(`Task queued: plant ${selectedSeed}.`);
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

  const hit = getTaskHitFromPoint(x, y, state.plots, selectedSeed);

  if (!hit || !hit.task) {
    ensureWorkerState();
    state = {
      ...state,
      worker: {
        ...state.worker,
        targetX: clampWorldX(x),
      },
    };
    showStatus('Destination set for worker.');
    return;
  }

  enqueueWorkerTask({
    plotId: hit.plotId,
    nodeX: hit.nodeX,
    task: hit.task,
  });

  const taskLabel = hit.task.type === 'plant' ? `plant ${hit.task.cropType ?? selectedSeed}` : hit.task.type;
  showStatus(`Task queued: ${taskLabel}.`);
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
