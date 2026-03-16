export function getShopItems(state) {
  return [
    {
      key: 'sunflowerSeeds',
      title: 'Sunflower Seeds Bundle',
      premium: true,
      unlocked: Boolean(state.premium?.sunflowerSeeds),
    },
    {
      key: 'fertilizer',
      title: 'Fertilizer Pack',
      premium: true,
      unlocked: Boolean(state.premium?.fertilizer),
    },
  ];
}
