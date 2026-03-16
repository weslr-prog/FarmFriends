import { CROP_CONFIG } from './constants.js';

export function tickFarm(state, nowMs) {
  const plots = state.plots.map((plot) => {
    if (plot.stage === 'empty' || !plot.crop || !plot.stageStartedAt) {
      return plot;
    }

    const cropConfig = CROP_CONFIG[plot.crop];
    if (!cropConfig) {
      return plot;
    }

    const speedMultiplier = state.premium.fertilizer || plot.fertilized ? 0.7 : 1;
    const growThresholdMs = cropConfig.growMs * speedMultiplier;
    const stageElapsedMs = nowMs - plot.stageStartedAt;

    if (plot.stage === 'sprouting' && stageElapsedMs >= growThresholdMs * 0.4) {
      return {
        ...plot,
        stage: 'growing',
        stageStartedAt: nowMs,
        attentionType: Math.random() < 0.5 ? 'water' : 'weed',
        attentionExpiresAt: nowMs + cropConfig.attentionWindowMs,
      };
    }

    if (plot.stage === 'growing') {
      if (plot.attentionExpiresAt && nowMs > plot.attentionExpiresAt && plot.attentionType) {
        return {
          ...plot,
          stage: 'sprouting',
          stageStartedAt: nowMs,
          attentionType: null,
          attentionExpiresAt: null,
        };
      }

      if (stageElapsedMs >= growThresholdMs * 0.6) {
        return {
          ...plot,
          stage: 'ready',
          attentionType: null,
          attentionExpiresAt: null,
        };
      }
    }

    return plot;
  });

  return {
    ...state,
    plots,
  };
}

export function plantCrop(state, plotId, cropType) {
  const cropConfig = CROP_CONFIG[cropType];
  if (!cropConfig) {
    throw new Error(`Unknown crop type: ${cropType}`);
  }

  if ((state.seeds[cropType] ?? 0) <= 0) {
    throw new Error(`No seeds available for ${cropType}`);
  }

  const nowMs = Date.now();
  const plots = state.plots.map((plot) => {
    if (plot.id !== plotId) {
      return plot;
    }

    if (plot.stage !== 'empty') {
      throw new Error('Plot is not empty');
    }

    return {
      ...plot,
      stage: 'sprouting',
      crop: cropType,
      plantedAt: nowMs,
      stageStartedAt: nowMs,
      attentionType: null,
      attentionExpiresAt: null,
      fertilized: false,
    };
  });

  return {
    ...state,
    plots,
    seeds: {
      ...state.seeds,
      [cropType]: state.seeds[cropType] - 1,
    },
  };
}

export function doAttentionTask(state, plotId) {
  const nowMs = Date.now();
  const plots = state.plots.map((plot) => {
    if (plot.id !== plotId) {
      return plot;
    }

    if (plot.stage !== 'growing' || !plot.attentionType) {
      return plot;
    }

    return {
      ...plot,
      attentionType: null,
      attentionExpiresAt: null,
      stageStartedAt: nowMs,
    };
  });

  return {
    ...state,
    plots,
  };
}

export function harvestPlot(state, plotId) {
  const plots = state.plots.map((plot) => {
    if (plot.id !== plotId) {
      return plot;
    }

    if (plot.stage !== 'ready' || !plot.crop) {
      return plot;
    }

    return {
      ...plot,
      stage: 'empty',
      crop: null,
      plantedAt: null,
      stageStartedAt: null,
      attentionType: null,
      attentionExpiresAt: null,
      fertilized: false,
    };
  });

  const harvestedPlot = state.plots.find((plot) => plot.id === plotId);
  if (!harvestedPlot || harvestedPlot.stage !== 'ready' || !harvestedPlot.crop) {
    return state;
  }

  const crop = harvestedPlot.crop;
  const reward = CROP_CONFIG[crop].coins;

  return {
    ...state,
    plots,
    inventory: {
      ...state.inventory,
      [crop]: (state.inventory[crop] ?? 0) + 1,
    },
    coins: state.coins + reward,
  };
}
