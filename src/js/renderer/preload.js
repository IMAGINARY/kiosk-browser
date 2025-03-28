// Preload the modules by path supplied to the main process
const remoteRequire = require('@electron/remote').require;

const preloadModulesPaths = remoteRequire('./preloadModules');

const hasNodeIntegration = typeof window.require !== 'undefined';

const kioskBrowser = {};
window.kioskBrowser = kioskBrowser;

// eslint-disable-next-line global-require,import/no-dynamic-require
preloadModulesPaths.forEach((p) => require(p));

const { kioskSiteForHtmlUrl } = remoteRequire('./kiosk-sites');

try {
  const site = kioskSiteForHtmlUrl(window.location.href);
  try {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    require(site.preload.pathname);
  } catch (e) {
    console.error(
      `Error loading preload script for '${site.id}' kiosk app.`,
      e,
    );
  }
} catch (e) {
  // Has no matching preload script. NOOP.
}

// only keep kioskBrowser API is node integration is enabled and the API hasn't been overwritten
if (!hasNodeIntegration && window.kioskBrowser === kioskBrowser) {
  delete window.kioskBrowser;
}
