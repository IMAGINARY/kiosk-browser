// Preload the modules by path supplied to the main process
const path = require('path');
const remoteRequire = require('@electron/remote').require;
const preloadModulesPaths = remoteRequire(path.join(__dirname, '../main/preloadModules.js'));
preloadModulesPaths.forEach(p => require(p));

const { kioskSiteForHtmlUrl } = remoteRequire(path.join(__dirname, '../main/kiosk-sites.js'));

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
