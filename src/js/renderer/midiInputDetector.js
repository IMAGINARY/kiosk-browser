const createList = require('../common/createList');
const domReady = require('./domReady');

const midiPortFilters = [];
const midiMessageEventFilters = [];

const knownMessageEventFilters = {
  clock: (midiMessageEvent) => midiMessageEvent.data === 0xf0,
  activeSensing: (midiMessageEvent) => midiMessageEvent.data === 0xfe,
};

const idleDetector = (window.kioskBrowser.idleDetector ??= {});
Object.assign(window.kioskBrowser.idleDetector, {
  midi: {
    portFilters: createList(midiPortFilters),
    messageEventFilters: createList(midiMessageEventFilters),
    knownMessageEventFilters,
  },
});

if (!document.featurePolicy.allowsFeature('midi')) {
  return;
}

const { requestResetIdleTime } = require('./resetIdleTime');

function handleMIDIMessage(midiMessageEvent) {
  const discard = midiMessageEventFilters.reduce(
    (acc, cur) => acc || cur(midiMessageEvent),
    false
  );
  if (!discard) {
    requestResetIdleTime(midiMessageEvent.timeStamp);
  }
}

function handlePortStateChange(port) {
  if (port.state === 'connected' && port.connection === 'open') {
    const discard = midiPortFilters.reduce(
      (acc, cur) => acc || cur(port),
      false
    );
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
    midiAccess.onstatechange = (stateChangeEvent) =>
      handlePortStateChange(stateChangeEvent.port);
  } catch (err) {
    console.warn(
      `Could not set up MIDI event listeners for idle monitoring`,
      err
    );
  }
}

idleDetector.midi.messageEventFilters.add(knownMessageEventFilters['clock']);
idleDetector.midi.messageEventFilters.add(
  knownMessageEventFilters['activeSensing']
);

domReady.then(setupMIDIListeners);
