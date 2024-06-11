const createList = require('../common/createList');
const domReady = require('./domReady');

const midiPortFilters = [];
const midiMessageEventFilters = [];

const knownMessageEventFilters = {
  clock: (midiMessageEvent) => midiMessageEvent.data === 0xf0,
  activeSensing: (midiMessageEvent) => midiMessageEvent.data === 0xfe,
};

window.kioskBrowser.idleDetector ??= {};
const { idleDetector } = window.kioskBrowser;
Object.assign(idleDetector, {
  midi: {
    portFilters: createList(midiPortFilters),
    messageEventFilters: createList(midiMessageEventFilters),
    knownMessageEventFilters,
  },
});

const { requestResetIdleTime } = require('./resetIdleTime');

function handleMIDIMessage(midiMessageEvent) {
  const discard = midiMessageEventFilters.reduce(
    (acc, cur) => acc || cur(midiMessageEvent),
    false,
  );
  if (!discard) {
    requestResetIdleTime(midiMessageEvent.timeStamp);
  }
}

function handlePortStateChange(port) {
  if (port.state === 'connected' && port.connection === 'open') {
    const discard = midiPortFilters.reduce(
      (acc, cur) => acc || cur(port),
      false,
    );
    if (!discard) {
      port.addEventListener('midimessage', handleMIDIMessage);
    }
  } else {
    port.removeEventListener('midimessage', handleMIDIMessage);
  }
}

async function setupMIDIListeners() {
  try {
    const midiAccess = await navigator.requestMIDIAccess();
    midiAccess.inputs.forEach(handlePortStateChange);
    midiAccess.addEventListener('statechange', (stateChangeEvent) =>
      handlePortStateChange(stateChangeEvent.port),
    );
  } catch (err) {
    console.warn(
      `Could not set up MIDI event listeners for idle monitoring`,
      err,
    );
  }
}

if (document.featurePolicy.allowsFeature('midi')) {
  ['clock', 'activeSensing']
    .map((name) => knownMessageEventFilters[name])
    .forEach((filter) => idleDetector.midi.messageEventFilters.add(filter));

  domReady.then(setupMIDIListeners);
}
