export function updateFoodBankUI(state) {
  const counter = document.getElementById('food-bank-counter');
  if (!counter) {
    return;
  }

  counter.textContent = `Friends Helped: ${state.friendsHelped}`;
}

export function updateInventoryUI(state) {
  const inventory = document.getElementById('inventory-strip');
  if (!inventory) {
    return;
  }

  const { carrot, tomato, sunflower } = state.inventory;
  inventory.textContent = `Inventory: carrot ${carrot} · tomato ${tomato} · sunflower ${sunflower} · coins ${state.coins}`;
}

export function setStatusMessage(message) {
  const status = document.getElementById('status-message');
  if (!status) {
    return;
  }

  status.textContent = message;
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
