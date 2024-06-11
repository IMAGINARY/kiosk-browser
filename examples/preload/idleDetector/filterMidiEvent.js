/**
 * Discard noteOff events.
 */
function filterNoteOff(messageEvent) {
  const command = messageEvent.data[0];
  if (command === 128) {
    console.log('Ignoring noteOff MIDI message event.', messageEvent);
    return true;
  } else {
    return false;
  }
}

/**
 * Discard repeated control change messages with identical value.
 */
const controlChangess = [];

function filterRepeatedControlChange(messageEvent) {
  controlChangess[messageEvent.target.id] ??= [];
  const controlChanges = controlChangess[messageEvent.target.id];
  const data = messageEvent.data;
  if (data[0] >> 4 === 0xb) {
    // this is a control change message
    const controlId = (data[0] << 8) + data[1];
    const changed = controlChanges[controlId] !== data[2];
    controlChanges[controlId] = data[2];
    if (changed) {
      console.log('NOT ignoring MIDI control change event.', messageEvent);
      return false;
    } else {
      console.log(
        "Ignoring MIDI control change event because its value didn't change.",
        messageEvent,
      );
      return true;
    }
  }
}

kioskBrowser.idleDetector.midi.messageEventFilters.add(filterNoteOff);
kioskBrowser.idleDetector.midi.messageEventFilters.add(
  filterRepeatedControlChange,
);
