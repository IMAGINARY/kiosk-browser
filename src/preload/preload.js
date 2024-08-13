import { ipcRenderer } from 'electron';

console.log(process);

const preloadModulesPaths = ipcRenderer.sendSync(
  'get-preload-modules-for-site',
);

console.log(preloadModulesPaths);

const hasNodeIntegration = typeof window.require !== 'undefined';

const kioskBrowser = {};
window.kioskBrowser = kioskBrowser;

preloadModulesPaths.forEach((p) => require(p));

// only keep kioskBrowser API is node integration is enabled and the API hasn't been overwritten
if (!hasNodeIntegration && window.kioskBrowser === kioskBrowser) {
  delete window.kioskBrowser;
}
