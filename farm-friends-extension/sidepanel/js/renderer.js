import { getSkyGradient, getPhase } from './daynight.js';
import { TASK_NODE_END_X, TASK_NODE_RADIUS, TASK_NODE_START_X, TASK_NODE_Y, WORKER_Y } from './constants.js';

export function getTaskNodes(plots) {
  if (!plots.length) {
    return [];
  }

  if (plots.length === 1) {
    return [{ plotId: plots[0].id, x: (TASK_NODE_START_X + TASK_NODE_END_X) / 2, y: TASK_NODE_Y }];
  }

  const span = TASK_NODE_END_X - TASK_NODE_START_X;
  return plots.map((plot, index) => {
    const ratio = index / (plots.length - 1);
    return {
      plotId: plot.id,
      x: TASK_NODE_START_X + span * ratio,
      y: TASK_NODE_Y,
    };
  });
}

function getTaskForPlot(plot, selectedSeed = 'carrot') {
  if (plot.stage === 'empty') {
    return { type: 'plant', cropType: selectedSeed };
  }
  if (plot.stage === 'growing' && plot.attentionType) {
    return { type: 'attention' };
  }
  if (plot.stage === 'ready') {
    return { type: 'harvest' };
  }
  return null;
}

export function getTaskHitFromPoint(x, y, plots, selectedSeed = 'carrot') {
  const nodes = getTaskNodes(plots);

  for (const node of nodes) {
    const dx = x - node.x;
    const dy = y - node.y;
    if (dx * dx + dy * dy > TASK_NODE_RADIUS * TASK_NODE_RADIUS) {
      continue;
    }

    const plot = plots.find((entry) => entry.id === node.plotId);
    if (!plot) {
      return null;
    }

    const task = getTaskForPlot(plot, selectedSeed);
    return {
      plotId: node.plotId,
      nodeX: node.x,
      task,
    };
  }

  return null;
}

export function clampWorldX(pointerX) {
  return Math.max(TASK_NODE_START_X, Math.min(TASK_NODE_END_X, pointerX));
}

export function drawFrame(ctx, state, gameMinutes, fireflies, nowPerf = performance.now()) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.clearRect(0, 0, width, height);

  drawSky(ctx, gameMinutes, width, height);
  drawGround(ctx, width, height);
  drawTaskNodes(ctx, state.plots, nowPerf);
  drawWorker(ctx, state.worker, nowPerf);
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

function drawGround(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = '#284a2f';
  ctx.fillRect(0, TASK_NODE_Y + 14, width, height - (TASK_NODE_Y + 14));
  ctx.fillStyle = 'rgba(17, 28, 18, 0.28)';
  ctx.fillRect(0, TASK_NODE_Y + 14, width, 4);
  ctx.restore();
}

function drawTaskNodes(ctx, plots, nowPerf) {
  const nodes = getTaskNodes(plots);
  const pulse = (Math.sin(nowPerf * 0.01) + 1) / 2;

  plots.forEach((plot, index) => {
    const node = nodes[index];
    const x = node.x;
    const y = node.y;

    ctx.save();
    if (plot.stage === 'ready') {
      ctx.fillStyle = `rgba(126, 224, 129, ${0.65 + pulse * 0.3})`;
    } else if (plot.stage === 'growing' && plot.attentionType) {
      ctx.fillStyle = '#ffd46f';
    } else if (plot.stage === 'growing' || plot.stage === 'sprouting') {
      ctx.fillStyle = '#78c7ff';
    } else {
      ctx.fillStyle = '#8d6940';
    }

    ctx.beginPath();
    ctx.arc(x, y, TASK_NODE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(16, 20, 16, 0.52)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#101410';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${plot.id + 1}`, x, y + 3);

    if (plot.stage === 'growing' && plot.attentionType) {
      ctx.fillStyle = '#fff2a3';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('!', x, y - 20);
    }

    ctx.restore();
  });
}

function drawWorker(ctx, worker, nowPerf) {
  if (!worker) {
    return;
  }

  const walking = worker.status === 'walking';
  const bob = walking ? Math.sin(nowPerf * 0.02) * 2 : 0;
  const x = worker.x;
  const y = WORKER_Y + bob;

  ctx.save();
  ctx.fillStyle = '#f3d4b3';
  ctx.beginPath();
  ctx.arc(x, y - 16, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3658a7';
  ctx.fillRect(x - 6, y - 10, 12, 17);

  ctx.fillStyle = '#22314f';
  ctx.fillRect(x - 5, y + 7, 4, 8);
  ctx.fillRect(x + 1, y + 7, 4, 8);

  if (worker.task) {
    ctx.fillStyle = '#eaf8ff';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    const icon = worker.task.type === 'plant' ? '🌱' : worker.task.type === 'attention' ? '💧' : '🧺';
    ctx.fillText(icon, x, y - 24);
  }

  ctx.restore();
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

  ctx.fillStyle = 'rgba(6, 10, 16, 0.5)';
  ctx.fillRect(10, 40, 120, 24);
  ctx.fillStyle = '#ecf1ff';
  ctx.font = '10px Inter, sans-serif';
  ctx.fillText('Click nodes to assign tasks', 70, 56);
  ctx.restore();
}
