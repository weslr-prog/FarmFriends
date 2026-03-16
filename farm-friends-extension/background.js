function initExtensionPay() {
  if (typeof globalThis.ExtensionPay?.init === 'function') {
    globalThis.ExtensionPay.init('farm-friends');
    return;
  }
  console.info('ExtensionPay is not bundled yet; payment init is deferred.');
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  initExtensionPay();
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  initExtensionPay();
});
