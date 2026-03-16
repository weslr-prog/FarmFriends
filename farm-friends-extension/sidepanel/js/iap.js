export async function initIAP() {
  if (typeof globalThis.ExtensionPay?.getUser !== 'function') {
    return null;
  }

  try {
    return await globalThis.ExtensionPay.getUser();
  } catch (error) {
    console.warn('ExtensionPay user lookup failed:', error);
    return null;
  }
}

export async function isPremium(feature, state) {
  if (!state?.premium) {
    return false;
  }

  return Boolean(state.premium[feature]);
}

export async function purchaseFeature(feature) {
  if (typeof globalThis.ExtensionPay?.openPaymentPage !== 'function') {
    throw new Error('ExtensionPay purchase flow is not configured in this build yet.');
  }

  return globalThis.ExtensionPay.openPaymentPage(feature);
}
