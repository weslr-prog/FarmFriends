export function updateFoodBankUI(state) {
  const counter = document.getElementById('food-bank-counter');
  if (!counter) {
    return;
  }

  counter.textContent = `Friends Helped: ${state.friendsHelped}`;
}

export function wireUIHandlers({ onPlant, onDonate, onShop }) {
  const plantButton = document.getElementById('plant-button');
  const donateButton = document.getElementById('donate-button');
  const shopButton = document.getElementById('shop-button');

  plantButton?.addEventListener('click', onPlant);
  donateButton?.addEventListener('click', onDonate);
  shopButton?.addEventListener('click', onShop);
}
