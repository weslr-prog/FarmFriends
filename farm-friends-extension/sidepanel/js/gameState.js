import { GAME_TICK_MS, OFFLINE_CAP_HOURS, PLOT_COUNT, STORAGE_KEY } from './constants.js';
import { tickFarm } from './farm.js';

function createDefaultPlots() {
  return Array.from({ length: PLOT_COUNT }, (_, id) => ({
    id,
    stage: 'empty',
    crop: null,
    plantedAt: null,
    stageStartedAt: null,
    attentionType: null,
    attentionExpiresAt: null,
    attentionRetryAt: null,
    fertilized: false,
  }));
}

export const DEFAULT_STATE = {
  plots: createDefaultPlots(),
  inventory: {
    carrot: 0,
    tomato: 0,
    sunflower: 0,
  },
  seeds: {
    carrot: 5,
    tomato: 5,
    sunflower: 0,
  },
  coins: 0,
  friendsHelped: 0,
  totalDeliveries: 0,
  milestonesAchieved: [],
  premium: {
    sunflowerSeeds: false,
    fertilizer: false,
  },
  settings: {
    soundEnabled: true,
  },
  lastSaved: null,
  version: 1,
};

function mergeDeep(base, incoming) {
  if (Array.isArray(base)) {
    if (!Array.isArray(incoming)) {
      return structuredClone(base);
    }

    return base.map((entry, index) => mergeDeep(entry, incoming[index]));
  }

  if (base && typeof base === 'object') {
    const merged = {};
    const source = incoming && typeof incoming === 'object' ? incoming : {};

    for (const key of Object.keys(base)) {
      merged[key] = mergeDeep(base[key], source[key]);
    }

    return merged;
  }

  return incoming === undefined || incoming === null ? base : incoming;
}

export async function loadState() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const savedState = result[STORAGE_KEY];
  const merged = mergeDeep(DEFAULT_STATE, savedState);

  if (!Array.isArray(merged.plots) || merged.plots.length !== PLOT_COUNT) {
    merged.plots = createDefaultPlots();
  }

  return merged;
}

export async function saveState(state) {
  const nextState = {
    ...state,
    lastSaved: Date.now(),
  };

  await chrome.storage.local.set({ [STORAGE_KEY]: nextState });
  return nextState;
}

export function calculateOfflineProgress(state, nowMs) {
  const capMs = OFFLINE_CAP_HOURS * 60 * 60_000;
  const lastSaved = state.lastSaved ?? nowMs;
  const elapsed = Math.max(0, Math.min(nowMs - lastSaved, capMs));

  if (elapsed < GAME_TICK_MS) {
    return {
      ...state,
      offlineElapsedMs: elapsed,
      lastSaved: nowMs,
    };
  }

  const fullSteps = Math.floor(elapsed / GAME_TICK_MS);
  const remainder = elapsed % GAME_TICK_MS;

  let progressedState = state;
  let cursorMs = lastSaved;

  for (let step = 0; step < fullSteps; step += 1) {
    cursorMs += GAME_TICK_MS;
    progressedState = tickFarm(progressedState, cursorMs);
  }

  if (remainder > 0) {
    progressedState = tickFarm(progressedState, cursorMs + remainder);
  }

  return {
    ...progressedState,
    offlineElapsedMs: elapsed,
    lastSaved: nowMs,
  };
}
