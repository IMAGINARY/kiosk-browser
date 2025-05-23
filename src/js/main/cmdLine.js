const fs = require('fs');
const Color = require('color');

function coercePort(port, defaultPort) {
  if (port === undefined) {
    return defaultPort;
  }
  const pInt = Number.parseInt(port, 10);
  if (/[0-9]+/.test(port) && pInt >= 0 && pInt <= 65535) {
    return pInt;
  }
  throw new Error(`Invalid remote debugging port: ${port}`);
}

function coerceServe(path, defaultPath) {
  const pathToServe = path ?? defaultPath;
  try {
    const dir = fs.opendirSync(pathToServe);
    dir.closeSync();
  } catch (err) {
    throw new Error(
      `Directory does not exist or is inaccessible: ${pathToServe}`,
    );
  }
}

function coerceAppendChromeSwitch(sOrXs) {
  function processSwitch(s) {
    if (s.length === 0) throw new Error('Empty Chrome CLI switch');

    if (!s.startsWith('--'))
      throw new Error("Chrome CLI switch must start with '--'");

    const parts = s.substr(2).split('=', 2);
    return parts.length === 1
      ? { key: parts[0] }
      : { key: parts[0], value: parts[1] };
  }

  const xs = typeof sOrXs === 'string' ? [sOrXs] : sOrXs;
  return xs.map(processSwitch);
}

function coerceAppendChromeArgument(xs) {
  return typeof xs === 'string' ? [xs] : xs;
}

function coerceFit(s) {
  const regex = /^(_|[0-9]+)x(_|[0-9]+)$/;
  const match = s.match(regex);
  if (match === null) {
    throw new Error(`Invalid viewport size: ${s}`);
  } else {
    return {
      width: match[1] === '_' ? '_' : parseInt(match[1], 10),
      height: match[2] === '_' ? '_' : parseInt(match[2], 10),
      get forceZoomFactor() {
        return match[1] !== '_' || match[2] !== '_';
      },
    };
  }
}

function coerceCoverDisplays(s) {
  const stringNums = typeof s !== 'undefined' ? s.split(',') : [];
  const nums = stringNums.map((sn) => Number.parseInt(sn, 10));
  for (let i = 0; i < nums.length; i += 1) {
    if (Number.isNaN(nums[i]) || nums[i] < 0) {
      throw new Error(`Invalid display number: ${stringNums[i]}`);
    }
  }
  if (nums.length > 1 && process.platform !== 'linux')
    throw new Error(`Covering multiple display in only supported on Linux.`);
  return nums;
}

function coerceOverflow(s) {
  const possibleRules = [
    '',
    'auto',
    'hidden',
    'inherit',
    'initial',
    'scroll',
    'visible',
  ];
  const overflowRules = s
    .split(',')
    .slice(0, 2)
    .map((r) => r.trim());
  const invalidRules = overflowRules.filter(
    (r) => possibleRules.indexOf(r) === -1,
  );
  if (invalidRules.length > 0)
    throw new Error(`Invalid overflow rule: ${invalidRules[0]}`);
  if (overflowRules.length === 1) overflowRules.push(overflowRules[0]);
  return {
    x: overflowRules[0],
    y: overflowRules[overflowRules.length - 1],
  };
}

function coerceBackgroundColor(s) {
  const byteToHex = (byte) =>
    Number(byte).toString(16).toUpperCase().padStart(2, '0');
  try {
    const colorRGBA = new Color(s).rgb();
    const rgb = colorRGBA.color.map(byteToHex).join('');
    const a = byteToHex(Math.round(colorRGBA.valpha * 255));
    return {
      rgb: `#${rgb}`,
      rgba: `#${rgb}${a}`,
      argb: `#${a}${rgb}`,
    };
  } catch (error) {
    throw new Error(`Invalid background color specification: ${s}`);
  }
}

function coerceAppNameSuffix(s) {
  if (/^[A-Za-z0-9][\w-]*$/.test(s)) {
    return s;
  }
  throw new Error(
    `Invalid app name suffix (must match /^[A-Za-z0-9][\\w-]*$/): ${s}`,
  );
}

const options = {
  'help': {
    alias: 'h',
    type: 'boolean',
    description: 'Print this usage message',
  },
  'version': {
    alias: 'V',
    type: 'boolean',
    description: 'Print the version. Combine with -v to get more details',
  },
  'verbose': {
    alias: 'v',
    type: 'count',
    description: 'Increase verbosity',
  },
  'dev': {
    alias: 'd',
    type: 'boolean',
    description: 'Run in development mod.',
  },
  'remote-debugging-port': {
    type: 'number',
    description: 'Specify remote debugging port',
    coerceFunc: coercePort,
    coerce: (port) => coercePort(port, this.default),
    default: 9222,
    setDefault: (option, defaultValue) => {
      const coerce = (value) => option.coerceFunc(value, defaultValue);
      Object.assign(option, { coerce });
    },
  },
  'menu': {
    alias: 'm',
    type: 'boolean',
    description: 'Enable or disable main menu',
  },
  'kiosk': {
    alias: 'k',
    type: 'boolean',
    description: 'Enable or disable kiosk mode',
  },
  'always-on-top': {
    alias: 'T',
    type: 'boolean',
    description: 'Enable or disable always-on-top mode',
  },
  'fullscreen': {
    alias: 'f',
    type: 'boolean',
    description: 'Enable or disable fullscreen mode',
  },
  'integration': {
    alias: 'i',
    type: 'boolean',
    description: 'Enable or disable node integration',
  },
  'localhost': {
    type: 'boolean',
    description: 'Restrict network access to localhost. Implies --clear-cache',
  },
  'clear-cache': {
    type: 'boolean',
    description: 'Clear the browser cache before opening the page',
  },
  'zoom': {
    alias: 'z',
    type: 'number',
    description: 'Set zoom factor',
  },
  'serve': {
    alias: 's',
    type: 'string',
    description:
      'Open URL relative to this path served via built-in HTTP server.',
    requiresArg: true,
    coerceFunc: coerceServe,
    setDefault: (option, defaultValue) => {
      const coerce = (value) => option.coerceFunc(value, defaultValue);
      Object.assign(option, { coerce });
    },
  },
  'transparent': {
    alias: 't',
    type: 'boolean',
    description:
      'Make browser window background transparent. See --background-color as well.',
  },
  'retry': {
    type: 'number',
    description:
      'Retry after given number of seconds if loading the page failed (0 to disable)',
  },
  'reload-unresponsive': {
    type: 'number',
    description:
      'Reloads websites that are unresponsive for the given number of seconds.',
    requiresArg: true,
  },
  'reload-idle': {
    type: 'number',
    description:
      'Reload the initially opened web page when the system is idle for the given number of seconds.',
    requiresArg: true,
  },
  'preload': {
    type: 'string',
    description: 'Preload a JavaScript file into each website',
  },
  'append-chrome-switch': {
    type: 'string',
    description: 'Append switch to internal Chrome browser switches',
    coerce: coerceAppendChromeSwitch,
    default: [],
  },
  'append-chrome-argument': {
    type: 'string',
    description:
      'Append positional argument to internal Chrome browser argument',
    coerce: coerceAppendChromeArgument,
    default: [],
  },
  'use-minimal-chrome-cli': {
    type: 'boolean',
    description:
      "Don't append anything to the internal Chrome command line by default",
    default: false,
  },
  'fit': {
    type: 'string',
    description:
      "Automatically adjust the zoom level to fit a given viewport of the page to the window size while preserving the viewports aspect ratio. Valid formats are wxh, wx_, _xh and _x_ (don't fit). The value supplied to --zoom acts as an additional multiplier.",
    requiresArg: true,
    default: '_x_',
    coerce: coerceFit,
  },
  'cover-displays': {
    description:
      'Let the browser window cover the displays provided by comma separated display numbers. Implies --no-resize and --no-frame. Spanning multiple displays is not supported on all platforms.',
    requiresArg: true,
    type: 'string',
    coerce: coerceCoverDisplays,
  },
  'inspect': {
    type: 'number',
    description:
      'Enable remote inspection for the main process on the given port. Connect via chrome://inspect in Chromium based browsers.',
    hidden: true,
  },
  'inspect-brk': {
    type: 'number',
    description:
      'Like --inspect but pauses execution on the first line of JavaScript.',
    hidden: true,
  },
  'overflow': {
    type: 'string',
    description:
      "Specify CSS overflow rules for top-level page. Use 'hidden' to hide the overflow and disable scroll bars. Separate rules for the x and y directions can be provided, e.g. 'hidden,' disables vertical scrolling but leaves the horizontal overflow rule untouched.",
    requiresArg: true,
    default: '',
    coerce: coerceOverflow,
  },
  'hide-scrollbars': {
    type: 'boolean',
    description:
      'Hide scroll bars without disabling scroll functionality via keyboard, mouse wheel or gestures.',
    default: false,
  },
  'disable-selection': {
    type: 'boolean',
    description: 'Disable selection for all elements except form fields.',
    default: false,
  },
  'disable-drag': {
    type: 'boolean',
    description: 'Prevent dragging of draggable elements like images.',
    default: false,
  },
  'hide-cursor': {
    type: 'boolean',
    description: 'Hide the mouse cursor.',
    default: false,
  },
  'frame': {
    type: 'boolean',
    description: 'Show the browser window frame.',
    default: true,
  },
  'background-color': {
    type: 'string',
    description:
      'The background color to apply until it is overwritten by the loaded site.',
    requiresArg: true,
    default: '#FFF0',
    coerce: coerceBackgroundColor,
  },
  'resize': {
    type: 'boolean',
    description: 'Allow resizing of the browser window.',
    default: true,
  },
  'persistent': {
    type: 'boolean',
    description: 'Do not delete session storage in between runs.',
    default: false,
  },
  'app-name-suffix': {
    type: 'string',
    description:
      'Append the argument to the app name. This also affects where user data is stored. Two different instances of the kiosk-browser must use different app names to avoid resource access conflicts. The argument must match /^[A-Za-z0-9][\\w-]*$/.',
    requiresArg: true,
    coerce: coerceAppNameSuffix,
  },
};

function assignDefault(option, defaultValue) {
  if ('setDefault' in option) option.setDefault(option, defaultValue);
  else Object.assign(option, { default: defaultValue });
}

function getOptions(defaults) {
  const optionsWithDefaults = { ...options };
  Object.getOwnPropertyNames(defaults)
    .filter((optionName) => optionName in optionsWithDefaults)
    .forEach((optionName) =>
      assignDefault(optionsWithDefaults[optionName], defaults[optionName]),
    );
  const compare = (a, b) => a[0].localeCompare(b[0]);
  const sortedOptionsWithDefaults = Object.fromEntries(
    Object.entries(optionsWithDefaults).sort(compare),
  );
  return sortedOptionsWithDefaults;
}

module.exports = { getOptions };
