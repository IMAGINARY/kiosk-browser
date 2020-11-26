const { ipcRenderer } = require('electron');
const remoteRequire = require('@electron/remote').require;
const path = require('path');
const RemoteIdleDetector = remoteRequire(path.join(__dirname, '../main/idleDetector.js'));

const channel = RemoteIdleDetector.IPC_CHANNEL;
const ipcIntervalMs = RemoteIdleDetector.IPC_INTERVAL_MS; // don't do IPCs to often

let lastIpcTimestampMs = 0;
let timeoutId = 0;

function msUntilNextResetIdleTime(lastEventTimestampMs) {
  return (lastIpcTimestampMs + ipcIntervalMs) - lastEventTimestampMs;
}

function resetIdleTime(lastEventTimestampMs) {
  const nowMs = performance.now();
  const idleTimeMs = nowMs - lastEventTimestampMs;
  ipcRenderer.send(channel, idleTimeMs);
  lastIpcTimestampMs = nowMs;
}

function requestResetIdleTime(lastEventTimestampMs) {
  clearTimeout(timeoutId);

  const waitingPeriodMs = msUntilNextResetIdleTime(lastEventTimestampMs);
  if (waitingPeriodMs <= 0.0) {
    // reset now
    resetIdleTime(lastEventTimestampMs);
  } else {
    // reset after
    timeoutId = setTimeout(() => resetIdleTime(lastEventTimestampMs), waitingPeriodMs);
  }
}

function handlePortStateChange(port) {
  switch (port.state) {
    case 'connected':
      port.onmidimessage = (midiMessageEvent) => requestResetIdleTime(midiMessageEvent.timeStamp);
      break;
    case 'disconnected':
      port.onmidimessage = undefined;
      break;
  }
}

async function setupMIDIListeners() {
  try {
    const midiAccess = await navigator.requestMIDIAccess();
    midiAccess.inputs.forEach(handlePortStateChange);
    midiAccess.onstatechange = (stateChangeEvent) => handlePortStateChange(stateChangeEvent.port);
  } catch (err) {
    console.warn(`Could not set up MIDI event listeners for idle monitoring`, err);
  }
}

window.addEventListener('DOMContentLoaded', setupMIDIListeners);
