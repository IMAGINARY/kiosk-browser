// Add the version of the kiosk browser to process.versions
const remote = require('@electron/remote');

process.versions.app = remote.app.getVersion();
const { versions } = process;

function isUndefined(v) {
  return typeof v === 'undefined';
}

/**
 * When run without node integration, Electron will remove the version info, but we want to keep it.
 */
function ensureVersions() {
  window.process = isUndefined(window.process) ? {} : window.process;
  window.process.versions = versions;
}

setTimeout(ensureVersions, 0); // needs to run as soon as all preload scripts ended
