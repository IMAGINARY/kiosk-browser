const { ipcRenderer } = require('electron');
const remoteRequire = require('@electron/remote').require;

const RemoteIdleDetector = remoteRequire('./idleDetector');

const channel = RemoteIdleDetector.IPC_CHANNEL;
const ipcIntervalMs = RemoteIdleDetector.IPC_INTERVAL_MS; // don't do IPCs to often

let lastIpcTimestampMs = -1;
let timeoutId = 0;

function isTimestampOutdated(eventTimestampMs) {
  return eventTimestampMs <= lastIpcTimestampMs;
}

function msUntilNextResetIdleTime(lastEventTimestampMs) {
  return lastIpcTimestampMs + ipcIntervalMs - lastEventTimestampMs;
}

function resetIdleTime(lastEventTimestampMs = performance.now()) {
  const nowMs = performance.now();
  const idleTimeMs = nowMs - lastEventTimestampMs;
  ipcRenderer.send(channel, idleTimeMs);
  lastIpcTimestampMs = nowMs;
}

function requestResetIdleTime(lastEventTimestampMs = performance.now()) {
  if (!isTimestampOutdated(lastEventTimestampMs)) {
    clearTimeout(timeoutId);

    const waitingPeriodMs = msUntilNextResetIdleTime(lastEventTimestampMs);
    if (waitingPeriodMs <= 0.0) {
      // reset now
      resetIdleTime(lastEventTimestampMs);
    } else {
      // reset after waiting time
      timeoutId = setTimeout(
        () => resetIdleTime(lastEventTimestampMs),
        waitingPeriodMs
      );
    }
  }
}

module.exports = {
  ipcIntervalMs,
  resetIdleTime,
  requestResetIdleTime,
};
