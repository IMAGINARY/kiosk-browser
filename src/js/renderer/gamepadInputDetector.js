const createList = require('../common/createList');
const domReady = require('./domReady');

const deviceFilters = [];

window.kioskBrowser.idleDetector ??= {};
Object.assign(
  window.kioskBrowser.idleDetector,
  {
    gamepad: {
      deviceFilters: createList(deviceFilters),
    }
  }
);

if (!document.featurePolicy.allowsFeature('gamepad')) {
  return;
}

const { ipcRenderer } = require('electron');
const remoteRequire = require('@electron/remote').require;
const RemoteIdleDetector = remoteRequire('./idleDetector');

const channel = RemoteIdleDetector.IPC_CHANNEL;
const ipcIntervalMs = RemoteIdleDetector.IPC_INTERVAL_MS; // don't do IPCs to often

let lastEventTimestampMs = 0;
let timeoutId = 0;

function loop() {
  clearTimeout(timeoutId);

  const gamepads = [...navigator.getGamepads()]
    .filter(gamepad => gamepad !== null)
    .filter(gamepad => !deviceFilters.reduce((acc, cur) => acc || cur(gamepad), false));
  if (gamepads.length > 0) {
    const maxTimestampMs = gamepads
      .map(gp => gp.timestamp)
      .reduce((acc, cur) => Math.max(acc, cur));
    if (lastEventTimestampMs !== maxTimestampMs) {
      lastEventTimestampMs = maxTimestampMs;
      const idleTimeMs = performance.now() - lastEventTimestampMs;
      ipcRenderer.send(channel, idleTimeMs);
    }

    timeoutId = setTimeout(loop, ipcIntervalMs);
  }
}

(async () => {
  await domReady;
  window.addEventListener('gamepadconnected', loop);
  loop();
})();
