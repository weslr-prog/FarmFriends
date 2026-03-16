import { getSkyGradient, getPhase } from './daynight.js';
import {
  CLOUD_COUNT,
  CLOUD_MAX_Y,
  CLOUD_MIN_Y,
  GRASS_TOP_RATIO,
  PLOT_COLUMNS,
  PLOT_ROWS,
  ROAD_HEIGHT,
  ROAD_TOP_Y,
  STAND_HEIGHT,
  STAND_WIDTH,
  STAND_X,
  STAND_Y,
  SUN_RADIUS,
  SUN_X,
  SUN_Y,
  TASK_NODE_END_X,
  TASK_NODE_RADIUS,
  TASK_NODE_START_X,
  TASK_NODE_ROW_GAP,
  TASK_NODE_TOP_Y,
} from './constants.js';

export function getTaskNodes(plots) {
  if (!plots.length) {
    return [];
  }

  const columns = Math.max(1, PLOT_COLUMNS);
  const rows = Math.max(1, PLOT_ROWS);
  const maxSlots = columns * rows;
  const nodeCount = Math.min(plots.length, maxSlots);
  const xSpan = TASK_NODE_END_X - TASK_NODE_START_X;
  const xStep = columns > 1 ? xSpan / (columns - 1) : 0;

  return plots.slice(0, nodeCount).map((plot, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      plotId: plot.id,
      x: TASK_NODE_START_X + column * xStep,
      y: TASK_NODE_TOP_Y + row * TASK_NODE_ROW_GAP,
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
      nodeY: node.y,
      task,
    };
  }

  return null;
}

export function clampWorldX(pointerX) {
  return Math.max(TASK_NODE_START_X, Math.min(TASK_NODE_END_X, pointerX));
}

export function drawFrame(ctx, state, gameMinutes, fireflies, nowPerf = performance.now(), scene = null) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.clearRect(0, 0, width, height);

  drawSky(ctx, gameMinutes, width, height);
  drawSunAndClouds(ctx, gameMinutes, width, nowPerf);
  drawGround(ctx, width, height);
  drawTaskNodes(ctx, state.plots, nowPerf);
  drawWorker(ctx, state.worker, nowPerf);
  drawRoad(ctx, width);
  drawStand(ctx, state.inventory, scene);
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
  const grassTop = Math.floor(height * GRASS_TOP_RATIO);

  ctx.save();
  const grassGradient = ctx.createLinearGradient(0, grassTop, 0, height);
  grassGradient.addColorStop(0, '#2f6a39');
  grassGradient.addColorStop(1, '#234a2d');

  ctx.fillStyle = grassGradient;
  ctx.fillRect(0, grassTop, width, height - grassTop);

  ctx.fillStyle = 'rgba(185, 230, 166, 0.09)';
  ctx.fillRect(0, grassTop + 4, width, 5);

  ctx.fillStyle = 'rgba(14, 22, 14, 0.2)';
  ctx.fillRect(0, ROAD_TOP_Y - 2, width, 4);
  ctx.restore();
}

function drawSunAndClouds(ctx, gameMinutes, width, nowPerf) {
  const phase = getPhase(gameMinutes);
  if (phase === 'night') {
    return;
  }

  ctx.save();
  const sunGlow = (Math.sin(nowPerf * 0.002) + 1) / 2;
  ctx.globalAlpha = phase === 'dusk' ? 0.55 : 0.85;
  ctx.fillStyle = '#ffd86b';
  ctx.beginPath();
  ctx.arc(SUN_X, SUN_Y, SUN_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.3 + sunGlow * 0.25;
  ctx.fillStyle = '#ffe8a6';
  ctx.beginPath();
  ctx.arc(SUN_X, SUN_Y, SUN_RADIUS + 10, 0, Math.PI * 2);
  ctx.fill();

  const cloudBaseY = [CLOUD_MIN_Y, (CLOUD_MIN_Y + CLOUD_MAX_Y) / 2, CLOUD_MAX_Y];
  for (let index = 0; index < CLOUD_COUNT; index += 1) {
    const drift = ((nowPerf * (0.008 + index * 0.0015)) % (width + 120)) - 60;
    const x = (drift + index * 120) % (width + 120) - 30;
    const y = cloudBaseY[index % cloudBaseY.length];
    drawCloud(ctx, x, y, 0.65 - index * 0.08);
  }

  ctx.restore();
}

function drawCloud(ctx, x, y, alpha = 0.55) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#f8fbff';
  ctx.beginPath();
  ctx.ellipse(x, y, 24, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 18, y - 4, 20, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 34, y, 18, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRoad(ctx, width) {
  ctx.save();
  ctx.fillStyle = '#6d513a';
  ctx.fillRect(0, ROAD_TOP_Y, width, ROAD_HEIGHT);

  ctx.strokeStyle = 'rgba(245, 217, 165, 0.62)';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  const centerY = ROAD_TOP_Y + ROAD_HEIGHT / 2;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawStand(ctx, inventory, scene) {
  const totalProduce = (inventory.carrot ?? 0) + (inventory.tomato ?? 0) + (inventory.sunflower ?? 0);
  const awningHeight = Math.max(8, Math.floor(STAND_HEIGHT * 0.14));
  const crateTop = STAND_Y + Math.max(20, Math.floor(STAND_HEIGHT * 0.45));
  const crateHeight = Math.max(18, STAND_HEIGHT - (crateTop - STAND_Y) - 6);
  const slotY = crateTop + Math.floor(crateHeight * 0.45);

  ctx.save();
  ctx.fillStyle = '#4a2f1d';
  ctx.fillRect(STAND_X, STAND_Y, STAND_WIDTH, STAND_HEIGHT);

  ctx.fillStyle = '#70462b';
  ctx.fillRect(STAND_X - 4, STAND_Y + 8, STAND_WIDTH + 8, awningHeight);

  ctx.fillStyle = '#c38a4b';
  ctx.fillRect(STAND_X + 2, crateTop, STAND_WIDTH - 4, crateHeight);

  const slotStartX = STAND_X + 14;
  const slotStep = Math.floor((STAND_WIDTH - 28) / 2);
  drawProduceSlot(ctx, slotStartX, slotY, '#ff9a3d', inventory.carrot ?? 0);
  drawProduceSlot(ctx, slotStartX + slotStep, slotY, '#ff6b63', inventory.tomato ?? 0);
  drawProduceSlot(ctx, slotStartX + slotStep * 2, slotY, '#ffd65c', inventory.sunflower ?? 0);

  ctx.fillStyle = '#f5e8cf';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Stand', STAND_X + 8, STAND_Y + 20);
  ctx.textAlign = 'center';
  ctx.fillText(`${totalProduce}`, STAND_X + STAND_WIDTH / 2, STAND_Y + 20);

  if (scene?.customerActive) {
    drawCustomer(ctx, STAND_X - 24, STAND_Y + STAND_HEIGHT - 4, scene.customerPulse ?? 0);
  }

  ctx.restore();
}

function drawProduceSlot(ctx, x, y, color, count) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x - 6, y - 6, 12, 12);

  if (count > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCustomer(ctx, x, y, pulse) {
  const bob = Math.sin(pulse * 0.009) * 1.5;

  ctx.save();
  ctx.fillStyle = '#f2d2b4';
  ctx.beginPath();
  ctx.arc(x, y - 16 + bob, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6f5bd1';
  ctx.fillRect(x - 5, y - 10 + bob, 10, 15);

  ctx.fillStyle = '#3f2f77';
  ctx.fillRect(x - 4, y + 5 + bob, 3, 7);
  ctx.fillRect(x + 1, y + 5 + bob, 3, 7);
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
  const y = worker.y + bob;

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
  if (phase !== 'night') {
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
