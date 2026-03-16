import { CROP_CONFIG } from './constants.js';

const MILESTONES = [10, 25, 50, 100, 250];

export function getMilestone(friendsHelped) {
  const hit = MILESTONES.find((value) => value === friendsHelped);
  return hit ? `${hit}friends` : null;
}

export function deliverProduce(state) {
  let friendsAdded = 0;

  for (const [crop, amount] of Object.entries(state.inventory)) {
    const cropConfig = CROP_CONFIG[crop];
    if (!cropConfig || amount <= 0) {
      continue;
    }
    friendsAdded += cropConfig.friends * amount;
  }

  const updatedFriends = state.friendsHelped + friendsAdded;
  const milestone = getMilestone(updatedFriends);

  const updatedState = {
    ...state,
    inventory: {
      carrot: 0,
      tomato: 0,
      sunflower: 0,
    },
    friendsHelped: updatedFriends,
    totalDeliveries: state.totalDeliveries + (friendsAdded > 0 ? 1 : 0),
    milestonesAchieved:
      milestone && !state.milestonesAchieved.includes(milestone)
        ? [...state.milestonesAchieved, milestone]
        : state.milestonesAchieved,
  };

  return { updatedState, friendsAdded, milestone };
}
