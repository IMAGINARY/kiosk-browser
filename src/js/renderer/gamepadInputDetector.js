const createList = require('../common/createList');
const domReady = require('./domReady');

const deviceFilters = [];
const stateFilters = [];

window.kioskBrowser.idleDetector ??= {};
Object.assign(window.kioskBrowser.idleDetector, {
  gamepad: {
    deviceFilters: createList(deviceFilters),
    stateFilters: createList(stateFilters),
  },
});

if (!document.featurePolicy.allowsFeature('gamepad')) {
  return;
}

// FIXME
const { ipcIntervalMs, requestResetIdleTime } = require('./resetIdleTime');

let lastEventTimestampMs = -1;
let animationFrameRequestId = 0;
let timeoutId = 0;

const gamepadIndices = new Set();

function loop() {
  clearTimeout(timeoutId);
  cancelAnimationFrame(animationFrameRequestId);

  // Discard disconnected gamepads
  const gamepads = [...navigator.getGamepads()].filter(
    (gamepad) => gamepad !== null
  );

  // Discard gamepads via device filter
  const deviceFilteredGamepads = gamepads.filter((gamepad) =>
    gamepadIndices.has(gamepad.index)
  );

  if (gamepads.length > 0) {
    // Discard gamepads through state filter
    const stateFilteredGamepads = deviceFilteredGamepads
      .filter((gamepad) => lastEventTimestampMs < gamepad.timestamp)
      .filter(
        (gamepad) =>
          !stateFilters.reduce((acc, cur) => acc || cur(gamepad), false)
      );

    // Keep timestamp to avoid processing the same state twice (important for state filters)
    lastEventTimestampMs = Math.max(...gamepads.map((gp) => gp.timestamp));

    // If there are gamepads left -> request idle time reset
    if (stateFilteredGamepads.length > 0) {
      const maxTimestampMs = Math.max(
        ...stateFilteredGamepads.map((gp) => gp.timestamp)
      );
      requestResetIdleTime(maxTimestampMs);
    }

    if (stateFilters.length > 0) {
      // If there are no state filters, we can poll less often and rely on the timestamp only
      animationFrameRequestId = requestAnimationFrame(loop);
    } else {
      // If there are state filters, we poll every frame
      timeoutId = setTimeout(loop, ipcIntervalMs);
    }
  }
}

function handleGamepadConnected(gamepadEvent) {
  const gamepad = gamepadEvent.gamepad;
  const discard = deviceFilters.reduce(
    (acc, cur) => acc || cur(gamepad),
    false
  );
  if (!discard) {
    gamepadIndices.add(gamepad.index);
    loop();
  }
}

function handleGamepadDisconnected(gamepadEvent) {
  const gamepad = gamepadEvent.gamepad;
  gamepadIndices.delete(gamepad.index);
}

(async () => {
  await domReady;
  window.addEventListener('gamepadconnected', handleGamepadConnected);
  window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
  loop();
})();
