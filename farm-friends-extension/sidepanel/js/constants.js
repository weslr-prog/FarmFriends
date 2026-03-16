export const GAME_DAY_MINUTES = 30;
export const PLOT_COUNT = 6;
export const FIREFLY_COUNT = 15;
export const OFFLINE_CAP_HOURS = 2;
export const AUTOSAVE_INTERVAL_MS = 30_000;
export const GAME_TICK_MS = 1_000;

export const CROP_CONFIG = {
  carrot: {
    growMs: 5 * 60_000,
    attentionWindowMs: 60_000,
    coins: 5,
    friends: 1,
  },
  tomato: {
    growMs: 8 * 60_000,
    attentionWindowMs: 90_000,
    coins: 8,
    friends: 2,
  },
  sunflower: {
    growMs: 4 * 60_000,
    attentionWindowMs: 45_000,
    coins: 12,
    friends: 3,
  },
};

export const STAGE_SEQUENCE = ['sprouting', 'growing', 'ready'];

export const STORAGE_KEY = 'farmFriendsState';
