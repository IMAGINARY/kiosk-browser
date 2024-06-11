const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const json5 = require('json5');

function applyChromiumCmdLine(
  ignoreDefaults,
  additionalChromiumSwitches,
  additionalChromiumArguments,
) {
  // load default command line switches and arguments
  const appCmdLine = json5.parse(
    fs.readFileSync(
      path.join(__dirname, '../../json/defaultAppCommandLine.json5'),
      'utf8',
    ),
  );

  // process switches
  const chromiumSwitches = ignoreDefaults
    ? additionalChromiumSwitches
    : appCmdLine.switches.concat(additionalChromiumSwitches);
  chromiumSwitches.forEach((s) =>
    'value' in s
      ? app.commandLine.appendSwitch(s.key, s.value)
      : app.commandLine.appendSwitch(s.key),
  );

  // process arguments
  const chromiumArguments = ignoreDefaults
    ? additionalChromiumArguments
    : appCmdLine.arguments.concat(additionalChromiumArguments);
  chromiumArguments.forEach((a) => app.commandLine.appendArgument(a));
}

module.exports = applyChromiumCmdLine;
