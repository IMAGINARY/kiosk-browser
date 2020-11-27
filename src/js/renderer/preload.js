// Preload the modules by path supplied to the main process
const remoteRequire = require('@electron/remote').require;
const preloadModulesPaths = remoteRequire('./preloadModules.js');

const hasNodeIntegration = typeof window.require !== 'undefined';

const kioskBrowser = window.kioskBrowser = {};

preloadModulesPaths.forEach(p => require(p));

const { kioskSiteForHtmlUrl } = remoteRequire('./kiosk-sites.js');

try {
  const site = kioskSiteForHtmlUrl(window.location.href);
  try {
    require(site.preload.pathname);
  } catch (e) {
    console.error(`Error loading preload script for '${site.id}' kiosk app.`, e);
  }
} catch (e) {
  // Has no matching preload script. NOOP.
}

// only keep kioskBrowser API is node integration is enabled and the API hasn't been overwritten
if (!hasNodeIntegration && window.kioskBrowser === kioskBrowser) {
  delete window.kioskBrowser;
}
