import { FIREFLY_COUNT, GAME_DAY_MINUTES } from './constants.js';

const TOTAL_GAME_MINUTES = 24 * 60;

export function getGameMinutes(nowMs) {
  const cycleMs = GAME_DAY_MINUTES * 60_000;
  const elapsedInCycle = nowMs % cycleMs;
  return Math.floor((elapsedInCycle / cycleMs) * TOTAL_GAME_MINUTES);
}

export function getPhase(gameMinutes) {
  if (gameMinutes >= 5 * 60 && gameMinutes < 7 * 60) return 'dawn';
  if (gameMinutes >= 7 * 60 && gameMinutes < 17 * 60) return 'day';
  if (gameMinutes >= 17 * 60 && gameMinutes < 20 * 60) return 'dusk';
  return 'night';
}

export function getSkyGradient(ctx, gameMinutes, width, height) {
  const phase = getPhase(gameMinutes);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);

  if (phase === 'dawn') {
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#e8b89a');
  } else if (phase === 'day') {
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#c8e6c9');
  } else if (phase === 'dusk') {
    gradient.addColorStop(0, '#ff6b35');
    gradient.addColorStop(1, '#c2185b');
  } else {
    gradient.addColorStop(0, '#0d0d1a');
    gradient.addColorStop(1, '#1a237e');
  }

  return gradient;
}

export function createFireflies(width, height, count = FIREFLY_COUNT) {
  return Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    driftX: (Math.random() - 0.5) * 0.3,
    driftY: (Math.random() - 0.5) * 0.3,
    glowRadius: 4 + Math.random() * 4,
    blinkTimer: Math.random() * Math.PI * 2,
    phaseOffset: index * 0.41,
    opacity: 0,
  }));
}

export function updateFireflies(particles, gameMinutes, dtMs, width, height) {
  const phase = getPhase(gameMinutes);
  const active = phase === 'night';

  for (const particle of particles) {
    particle.x = (particle.x + particle.driftX * dtMs * 0.05 + width) % width;
    particle.y = (particle.y + particle.driftY * dtMs * 0.05 + height) % height;
    particle.blinkTimer += dtMs * 0.004;

    const base = (Math.sin(particle.blinkTimer + particle.phaseOffset) + 1) / 2;
    const targetOpacity = active ? 0.2 + base * 0.8 : 0;
    const delta = targetOpacity - particle.opacity;
    particle.opacity += delta * 0.1;
  }
}
