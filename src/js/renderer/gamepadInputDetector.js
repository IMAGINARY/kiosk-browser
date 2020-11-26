const { ipcRenderer } = require('electron');
const remoteRequire = require('@electron/remote').require;
const path = require('path');
const RemoteIdleDetector = remoteRequire(path.join(__dirname, '../main/idleDetector.js'));

const channel = RemoteIdleDetector.IPC_CHANNEL;
const ipcIntervalMs = RemoteIdleDetector.IPC_INTERVAL_MS; // don't do IPCs to often

let lastEventTimestampMs = 0;
let timeoutId = 0;

function loop() {
  clearTimeout(timeoutId);

  const gamepads = [...navigator.getGamepads()].filter(gamepad => gamepad !== null);
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

window.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('gamepadconnected', loop);
  loop();
});

