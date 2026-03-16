import { getSkyGradient, getPhase } from './daynight.js';
import { PLOT_COLUMNS, PLOT_GAP, PLOT_SIZE, PLOT_START_Y } from './constants.js';

function getPlotLayout(width) {
  const startX = (width - PLOT_COLUMNS * PLOT_SIZE - (PLOT_COLUMNS - 1) * PLOT_GAP) / 2;
  return { startX };
}

export function getPlotRects(plots, width) {
  const { startX } = getPlotLayout(width);

  return plots.map((plot, index) => {
    const col = index % PLOT_COLUMNS;
    const row = Math.floor(index / PLOT_COLUMNS);
    const x = startX + col * (PLOT_SIZE + PLOT_GAP);
    const y = PLOT_START_Y + row * (PLOT_SIZE + PLOT_GAP);

    return { plotId: plot.id, x, y, size: PLOT_SIZE };
  });
}

export function getPlotHitFromPoint(x, y, plots, width) {
  const rects = getPlotRects(plots, width);

  for (const rect of rects) {
    const inBounds = x >= rect.x && x <= rect.x + rect.size && y >= rect.y && y <= rect.y + rect.size;
    if (!inBounds) {
      continue;
    }

    const attentionDx = x - (rect.x + rect.size - 12);
    const attentionDy = y - (rect.y + 12);
    const onAttentionBubble = attentionDx * attentionDx + attentionDy * attentionDy <= 8 * 8;

    return {
      plotId: rect.plotId,
      zone: onAttentionBubble ? 'attention' : 'plot',
    };
  }

  return null;
}

export function drawFrame(ctx, state, gameMinutes, fireflies, nowPerf = performance.now()) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.clearRect(0, 0, width, height);

  drawSky(ctx, gameMinutes, width, height);
  drawPlots(ctx, state.plots, width, nowPerf);
  drawFireflies(ctx, fireflies, gameMinutes);
  drawUI(ctx, gameMinutes, width, state.plots, nowPerf);
}

function drawSky(ctx, gameMinutes, width, height) {
  const gradient = getSkyGradient(ctx, gameMinutes, width, height);
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawPlots(ctx, plots, width, nowPerf) {
  const rects = getPlotRects(plots, width);
  const pulse = (Math.sin(nowPerf * 0.01) + 1) / 2;

  plots.forEach((plot, index) => {
    const rect = rects[index];
    const x = rect.x;
    const y = rect.y;

    ctx.save();
    ctx.fillStyle = '#6e5432';
    ctx.fillRect(x, y, PLOT_SIZE, PLOT_SIZE);

    if (plot.stage !== 'empty') {
      ctx.fillStyle = plot.stage === 'ready' ? '#7ee081' : '#76c1ff';
      ctx.fillRect(x + 14, y + 14, PLOT_SIZE - 28, PLOT_SIZE - 28);

      if (plot.stage === 'ready') {
        ctx.strokeStyle = `rgba(168, 255, 165, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x + 10, y + 10, PLOT_SIZE - 20, PLOT_SIZE - 20);
      }
    }

    if (plot.attentionType) {
      ctx.fillStyle = '#ffef86';
      ctx.beginPath();
      ctx.arc(x + PLOT_SIZE - 12, y + 12, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

function drawFireflies(ctx, fireflies, gameMinutes) {
  const phase = getPhase(gameMinutes);
  if (phase !== 'night' && phase !== 'dusk') {
    return;
  }

  for (const firefly of fireflies) {
    ctx.save();
    ctx.globalAlpha = firefly.opacity;
    ctx.shadowBlur = firefly.glowRadius;
    ctx.shadowColor = '#ffffaa';
    ctx.fillStyle = '#fff5a8';
    ctx.beginPath();
    ctx.arc(firefly.x, firefly.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawUI(ctx, gameMinutes, width, plots, nowPerf) {
  const hours = Math.floor(gameMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor(gameMinutes % 60)
    .toString()
    .padStart(2, '0');

  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 20, 0.5)';
  ctx.fillRect(10, 10, 92, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText(`${hours}:${minutes}`, 20, 28);

  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('Farm Friends', width - 86, 28);

  const readyCount = plots.filter((plot) => plot.stage === 'ready').length;
  if (readyCount > 0) {
    const glow = (Math.sin(nowPerf * 0.012) + 1) / 2;
    ctx.fillStyle = `rgba(130, 239, 143, ${0.55 + glow * 0.35})`;
    ctx.fillRect(width - 118, 40, 108, 24);
    ctx.fillStyle = '#102015';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`Ready: ${readyCount}`, width - 102, 56);
  }
  ctx.restore();
}
