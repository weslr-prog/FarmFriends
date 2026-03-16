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
export const CANVAS_HEIGHT = 400;
export const PLOT_COLUMNS = 3;
export const PLOT_ROWS = 2;
export const PLOT_SIZE = 90;
export const PLOT_GAP = 12;
export const PLOT_START_Y = 120;
export const TASK_NODE_RADIUS = 14;
export const TASK_NODE_START_X = 42;
export const TASK_NODE_END_X = 318;
export const TASK_NODE_TOP_Y = 190;
export const TASK_NODE_ROW_GAP = 64;

export const ROAD_TOP_Y = 300;
export const ROAD_HEIGHT = 42;
export const STAND_X = 252;
export const STAND_Y = 324;
export const STAND_WIDTH = 98;
export const STAND_HEIGHT = 72;

export const SUN_X = 52;
export const SUN_Y = 54;
export const SUN_RADIUS = 24;
export const CLOUD_COUNT = 3;
export const CLOUD_MIN_Y = 34;
export const CLOUD_MAX_Y = 110;
export const GRASS_TOP_RATIO = 0.34;

export const CUSTOMER_INTERVAL_MIN_MS = 16_000;
export const CUSTOMER_INTERVAL_MAX_MS = 30_000;
export const CUSTOMER_STOP_MS = 3_000;
export const CUSTOMER_MIN_ITEMS = 1;
export const CUSTOMER_MAX_ITEMS = 3;

export const WORKER_START_X = 42;
export const WORKER_Y = 300;
export const WORKER_SPEED_PX_PER_SEC = 86;
export const WORKER_TASK_DURATION_MS = 900;

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
