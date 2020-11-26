const createList = require('../common/createList');

const midiPortFilters = [];
const midiMessageEventFilters = [];

const knownMessageEventFilters = {
  'clock': (midiMessageEvent) => midiMessageEvent.data === 0xF0,
  'activeSensing': (midiMessageEvent) => midiMessageEvent.data === 0xFE,
};

const idleDetector = window.kioskBrowser.idleDetector = window.kioskBrowser.idleDetector || {};
Object.assign(
  window.kioskBrowser.idleDetector,
  {
    midi: {
      portFilters: createList(midiPortFilters),
      messageEventFilters: createList(midiMessageEventFilters),
      knownMessageEventFilters,
    }
  }
);

if (!document.featurePolicy.allowsFeature('midi')) {
  return;
}

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

function handleMIDIMessage(midiMessageEvent) {
  const discard = midiMessageEventFilters
    .reduce((acc, cur) => acc || cur(midiMessageEvent), false);
  if (!discard) {
    requestResetIdleTime(midiMessageEvent.timeStamp);
  }
}

function handlePortStateChange(port) {
  if (port.state === 'connected' && port.connection === 'open') {
    const discard = midiPortFilters.reduce((acc, cur) => acc || cur(port), false);
    if (!discard) {
      port.onmidimessage = handleMIDIMessage;
    }
  } else {
    port.onmidimessage = undefined;
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

idleDetector.midi.messageEventFilters.add(knownMessageEventFilters['clock']);
idleDetector.midi.messageEventFilters.add(knownMessageEventFilters['activeSensing']);

window.addEventListener('DOMContentLoaded', setupMIDIListeners);
