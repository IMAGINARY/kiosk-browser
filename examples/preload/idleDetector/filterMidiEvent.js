function messageEventFilter(messageEvent) {
  const command = messageEvent.data[0];
  if (command === 128) {
    console.log("Ignoring noteOff MIDI message event.", messageEvent);
    return true;
  } else {
    return false;
  }
}

kioskBrowser.idleDetector.midi.messageEventFilters.add(messageEventFilter);
