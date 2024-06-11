const deviceIds = ['3 In 1 Android Controller (Vendor: 1949 Product: 0402)'];

function deviceFilter(gamepad) {
  // The syntax of the gamepad id is system and browser (version) specific as it is not part of the
  // Gamepad API definition. This is not very portable and should be used with care.
  if (deviceIds.includes(gamepad.id)) {
    console.log(
      'The following gamepad will NOT be able to interrupt the idle state:',
      gamepad,
    );
    return true;
  } else {
    console.log(
      'The following gamepad will be able to interrupt the idle state:',
      gamepad,
    );
    return false;
  }
}

kioskBrowser.idleDetector.gamepad.deviceFilters.add(deviceFilter);
