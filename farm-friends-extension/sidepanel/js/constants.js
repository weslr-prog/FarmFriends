export const GAME_DAY_MINUTES = 30;
export const PLOT_COUNT = 6;
export const FIREFLY_COUNT = 15;
export const OFFLINE_CAP_HOURS = 2;
export const AUTOSAVE_INTERVAL_MS = 30_000;
export const GAME_TICK_MS = 1_000;
export const STATUS_MESSAGE_MS = 2_400;
export const COUNTER_ANIMATION_MS = 700;
export const MILESTONE_OVERLAY_MS = 2_200;

export const CANVAS_WIDTH = 360;
export const CANVAS_HEIGHT = 420;
export const PLOT_COLUMNS = 3;
export const PLOT_SIZE = 90;
export const PLOT_GAP = 12;
export const PLOT_START_Y = 120;

export const SPROUT_STAGE_RATIO = 0.4;
export const GROW_STAGE_RATIO = 0.6;
export const FERTILIZER_SPEED_MULTIPLIER = 0.7;
export const ATTENTION_RETRY_DELAY_MS = 30_000;

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
