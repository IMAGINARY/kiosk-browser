const lastButtonss = [];

/**
 * Register the gamepad in lastButtons when it is connected.
 */
function deviceFilter(gamepad) {
  lastButtonss[gamepad.index] = [...gamepad.buttons.map((b) => b.pressed)];
  return false;
}

/**
 * Discard state changes where the gamepad.buttons didn't change, but maybe there was a change in
 * one of the gamepad.axis or other properties.
 */
function stateFilter(gamepad) {
  const lastButtons = lastButtonss[gamepad.index];
  const curButtons = [...gamepad.buttons.map((b) => b.pressed)];
  const buttonsChanged = curButtons.reduce(
    (acc, cur, i) => acc || lastButtons[i] !== cur,
    false
  );
  lastButtonss[gamepad.index] = curButtons;
  if (buttonsChanged) {
    console.log('NOT ignoring state change because a button changed.', gamepad);
    return false;
  } else {
    console.log('Ignoring state change because NO button changed.', gamepad);
    return true;
  }
}

kioskBrowser.idleDetector.gamepad.deviceFilters.add(deviceFilter);
kioskBrowser.idleDetector.gamepad.stateFilters.add(stateFilter);
