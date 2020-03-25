const fs = require('fs');

function coercePort(port, defaultPort) {
    if (port === undefined) {
        return defaultPort;
    } else {
        const pInt = Number.parseInt(port);
        if (/[0-9]+/.test(port) && pInt >= 0 && pInt <= 65535) {
            return pInt;
        } else {
            throw new Error(`Invalid remote debugging port: ${port}`);
        }
    }
}

function coerceServe(path, defaultPath) {
    if (path === undefined)
        path = defaultPath;

    let isDir;
    try {
        isDir = fs.statSync(path).isDirectory();
    } catch (err) {
        // handle statSync error
        isDir = false;
    }
    if (isDir)
        return path;
    else
        throw new Error(`Directory does not exist or is inaccessible: ${path}`);
}

function coerceAppendChromeSwitch(xs) {
    function processSwitch(s) {
        if (s.length === 0)
            throw new Error("Empty Chrome CLI switch");

        if (!s.startsWith('--'))
            throw new Error("Chrome CLI switch must start with '--'");

        const parts = s.substr(2).split("=", 2);
        return parts.length === 1 ? {key: parts[0]} : {key: parts[0], value: parts[1]};
    }

    xs = typeof xs == 'string' ? [xs] : xs;
    return xs.map(processSwitch);
}

function coerceAppendChromeArgument(xs) {
    return typeof xs == 'string' ? [xs] : xs;
}

function coerceFit(s) {
    const regex = /^(_|[0-9]+)x(_|[0-9]+)$/;
    const match = s.match(regex);
    if (match === null) {
        throw new Error(`Invalid viewport size: ${s}`);
    } else {
        return {
            width: match[1] === '_' ? '_' : parseInt(match[1]),
            height: match[2] === '_' ? '_' : parseInt(match[2]),
            get forceZoomFactor() {
                return match[1] !== '_' || match[2] !== '_'
            }
        };
    }
}

function coerceCoverDisplays(s) {
    const stringNums = s.split(',');
    const nums = stringNums.map(s => Number.parseInt(s, 10));
    for (let i = 0; i < nums.length; ++i) {
        if (Number.isNaN(nums[i]) || nums[i] < 0) {
            throw new Error(`Invalid display number: ${stringNums[i]}`);
        }
    }
    if (nums.length > 1 && process.platform !== 'linux')
        throw new Error(`Covering multiple display in only supported on Linux.`);
    return nums;
}

function coerceOverflow(s) {
    const possibleRules = ["", "auto", "hidden", "inherit", "initial", "scroll", "visible"];
    const overflowRules = s.split(",").slice(0, 2).map(r => r.trim());
    const invalidRules = overflowRules.filter(r => possibleRules.indexOf(r) === -1);
    if (invalidRules.length > 0)
        throw new Error(`Invalid overflow rule: ${invalidRules[0]}`);
    if (overflowRules.length === 1)
        overflowRules.push(overflowRules[0]);
    return {
        x: overflowRules[0],
        y: overflowRules[overflowRules.length - 1]
    };
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
    'port': {
        alias: 'p',
        type: 'number',
        description: 'Specify remote debugging port',
        coerceFunc: coercePort,
        coerce: port => coercePort(port, 9222),
        setDefault: (option, defaultValue) => option.coerce = value => option.coerceFunc(value, defaultValue),
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
        description: 'Restrict network access to localhost',
    },
    'zoom': {
        alias: 'z',
        type: 'number',
        description: 'Set zoom factor',
    },
    'serve': {
        alias: 's',
        type: 'string',
        description: 'Open URL relative to this path served via built-in HTTP server.',
        requiresArg: true,
        coerceFunc: coerceServe,
        setDefault: (option, defaultValue) => option.coerce = value => option.coerceFunc(value, defaultValue),
    },
    'transparent': {
        alias: 't',
        type: 'boolean',
        description: 'Make browser window background transparent.',
    },
    'retry': {
        type: 'number',
        description: 'Retry after given number of seconds if loading the page failed (0 to disable)',
    },
    'reload-unresponsive': {
        type: 'number',
        description: 'Reloads websites that are unresponsive for the given number of seconds.',
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
        default: []
    },
    'append-chrome-argument': {
        type: 'string',
        description: 'Append positional argument to internal Chrome browser argument',
        coerce: coerceAppendChromeArgument,
        default: []
    },
    'use-minimal-chrome-cli': {
        type: 'boolean',
        description: 'Don\'t append anything to the internal Chrome command line by default',
        default: false
    },
    'fit': {
        type: 'string',
        description: 'Automatically adjust the zoom level to fit a given viewport of the page to the window size while preserving the viewports aspect ratio. Valid formats are wxh, wx_, _xh and _x_ (don\'t fit). The value supplied to --zoom acts as an additional multiplier.',
        requiresArg: true,
        default: '_x_',
        coerce: coerceFit
    },
    'cover-displays': {
        description: 'Let the browser window cover the displays provided by comma separated display numbers. Spanning multiple displays is not supported on all platforms.',
        requiresArg: true,
        type: 'string',
        coerce: coerceCoverDisplays,
    },
    'inspect': {
        type: 'number',
        description: 'Enable remote inspection for the main process on the given port. Connect via chrome://inspect in Chromium based browsers.',
        hidden: true,
    },
    'inspect-brk': {
        type: 'number',
        description: 'Like --inspect but pauses execution on the first line of JavaScript.',
        hidden: true,
    },
    "overflow": {
        type: "string",
        description: "Specify CSS overflow rules for top-level page. Use 'hidden' to hide the overflow and disable scroll bars. Separate rules for the x and y directions can be provided, e.g. 'hidden,' disables vertical scrolling but leaves the horizontal overflow rule untouched.",
        requiresArg: true,
        default: "",
        coerce: coerceOverflow,
    },
};

function assignDefault(option, defaultValue) {
    if (option.hasOwnProperty('setDefault'))
        option.setDefault(option, defaultValue);
    else
        option.default = defaultValue;
}

function getOptions(defaults) {
    const optionsWithDefaults = Object.assign({}, options);
    Object.getOwnPropertyNames(defaults)
        .filter(optionName => optionsWithDefaults.hasOwnProperty(optionName))
        .forEach(optionName => assignDefault(optionsWithDefaults[optionName], defaults[optionName]))
    const compare = (a, b) => a[0].localeCompare(b[0]);
    const sortedOptionsWithDefaults = Object.fromEntries(Object.entries(optionsWithDefaults).sort(compare));
    return sortedOptionsWithDefaults;
}

module.exports = {getOptions: getOptions};
