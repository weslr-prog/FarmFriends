import { COUNTER_ANIMATION_MS, MILESTONE_OVERLAY_MS } from './constants.js';

let counterAnimationFrameId = null;
let milestoneOverlayTimeoutId = null;

export function updateFoodBankUI(state, options = {}) {
  const counter = document.getElementById('food-bank-counter');
  if (!counter) {
    return;
  }

  const targetValue = state.friendsHelped;
  const animateFrom = options.animateFrom;

  if (typeof animateFrom !== 'number' || animateFrom === targetValue) {
    counter.textContent = `Friends Helped: ${targetValue}`;
    return;
  }

  if (counterAnimationFrameId !== null) {
    cancelAnimationFrame(counterAnimationFrameId);
    counterAnimationFrameId = null;
  }

  const startMs = performance.now();
  const direction = targetValue > animateFrom ? 1 : -1;

  const step = () => {
    const elapsed = performance.now() - startMs;
    const progress = Math.min(1, elapsed / COUNTER_ANIMATION_MS);
    const currentValue = Math.round(animateFrom + (targetValue - animateFrom) * progress);
    counter.textContent = `Friends Helped: ${currentValue}`;

    if (progress < 1) {
      counterAnimationFrameId = requestAnimationFrame(step);
      return;
    }

    counter.textContent = `Friends Helped: ${targetValue}`;
    counterAnimationFrameId = null;

    if (direction > 0) {
      counter.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.03)' },
          { transform: 'scale(1)' },
        ],
        { duration: 280, easing: 'ease-out' }
      );
    }
  };

  counterAnimationFrameId = requestAnimationFrame(step);
}

export function updateInventoryUI(state) {
  const inventory = document.getElementById('inventory-strip');
  if (!inventory) {
    return;
  }

  const { carrot, tomato, sunflower } = state.inventory;
  inventory.textContent = `Stand: carrot ${carrot} · tomato ${tomato} · sunflower ${sunflower} · coins ${state.coins}`;
}

export function setStatusMessage(message) {
  const status = document.getElementById('status-message');
  if (!status) {
    return;
  }

  status.textContent = message;
}

export function showMilestoneOverlay(milestoneKey) {
  const overlay = document.getElementById('milestone-overlay');
  if (!overlay || !milestoneKey) {
    return;
  }

  const count = Number.parseInt(milestoneKey.replace('friends', ''), 10);
  const label = Number.isFinite(count) ? `${count}` : milestoneKey;

  overlay.textContent = `🎉 Milestone reached: ${label} friends helped!`;
  overlay.hidden = false;

  if (milestoneOverlayTimeoutId !== null) {
    clearTimeout(milestoneOverlayTimeoutId);
  }

  milestoneOverlayTimeoutId = setTimeout(() => {
    overlay.hidden = true;
    overlay.textContent = '';
    milestoneOverlayTimeoutId = null;
  }, MILESTONE_OVERLAY_MS);
}

export function getSelectedSeed() {
  const seedSelect = document.getElementById('seed-select');
  if (!(seedSelect instanceof HTMLSelectElement)) {
    return 'carrot';
  }

  return seedSelect.value;
}

export function wireUIHandlers({ onPlant, onDonate, onShop, onSeedChange, onCanvasClick }) {
  const plantButton = document.getElementById('plant-button');
  const donateButton = document.getElementById('donate-button');
  const shopButton = document.getElementById('shop-button');
  const seedSelect = document.getElementById('seed-select');
  const canvas = document.getElementById('farm-canvas');

  plantButton?.addEventListener('click', onPlant);
  donateButton?.addEventListener('click', onDonate);
  shopButton?.addEventListener('click', onShop);
  seedSelect?.addEventListener('change', onSeedChange);
  canvas?.addEventListener('click', onCanvasClick);
}
