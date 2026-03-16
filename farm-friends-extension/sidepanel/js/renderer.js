import { getSkyGradient, getPhase } from './daynight.js';

export function drawFrame(ctx, state, gameMinutes, fireflies) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.clearRect(0, 0, width, height);

  drawSky(ctx, gameMinutes, width, height);
  drawPlots(ctx, state.plots, width);
  drawFireflies(ctx, fireflies, gameMinutes);
  drawUI(ctx, gameMinutes, width);
}

function drawSky(ctx, gameMinutes, width, height) {
  const gradient = getSkyGradient(ctx, gameMinutes, width, height);
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawPlots(ctx, plots, width) {
  const columns = 3;
  const plotSize = 90;
  const gap = 12;
  const startX = (width - columns * plotSize - (columns - 1) * gap) / 2;
  const startY = 120;

  plots.forEach((plot, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + col * (plotSize + gap);
    const y = startY + row * (plotSize + gap);

    ctx.save();
    ctx.fillStyle = '#6e5432';
    ctx.fillRect(x, y, plotSize, plotSize);

    if (plot.stage !== 'empty') {
      ctx.fillStyle = plot.stage === 'ready' ? '#7ee081' : '#76c1ff';
      ctx.fillRect(x + 14, y + 14, plotSize - 28, plotSize - 28);
    }

    if (plot.attentionType) {
      ctx.fillStyle = '#ffef86';
      ctx.beginPath();
      ctx.arc(x + plotSize - 12, y + 12, 8, 0, Math.PI * 2);
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

function drawUI(ctx, gameMinutes, width) {
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
  ctx.restore();
}
