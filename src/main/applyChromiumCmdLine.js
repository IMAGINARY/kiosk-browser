import { app } from 'electron';
import json5 from 'json5';

import defaultAppCommandLineRaw from '../json/defaultAppCommandLine.json5?raw';

function applyChromiumCmdLine(
  ignoreDefaults,
  additionalChromiumSwitches,
  additionalChromiumArguments,
) {
  // load default command line switches and arguments
  const appCmdLine = json5.parse(defaultAppCommandLineRaw);

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

export default applyChromiumCmdLine;
