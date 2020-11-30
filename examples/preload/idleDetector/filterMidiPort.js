function portFilter(port) {
  if (port.manufacturer === 'AKAI' && port.name === 'MPK mini play') {
    console.log('The following MIDI port will NOT be able to interrupt the idle state:', port);
    return true;
  } else {
    console.log('The following MIDI port will be able to interrupt the idle state:', port);
    return false;
  }
}

kioskBrowser.idleDetector.midi.portFilters.add(portFilter);
