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

function coerceServe(path) {
    console.log('coerceServe called');

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
        setDefault: (option, defaultPort) => option.coerce = port => option.coerceFunc(port, defaultPort),
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
    'url': {
        alias: 'l',
        type: 'string',
        description: 'URL to load',
        requiresArg: true,
    },
    'serve': {
        alias: 's',
        type: 'string',
        description: 'Open URL relative to this path served via built-in HTTP server.',
        requiresArg: true,
        coerce: coerceServe,
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
    'preload': {
        type: 'string',
        description: 'Preload a JavaScript file into each website',
    },
    'append-chrome-switch': {
        type: 'string',
        description: 'Append switch to internal Chrome browser switches',
        coerce: coerceAppendChromeSwitch,
    },
    'append-chrome-argument': {
        type: 'string',
        description: 'Append positional argument to internal Chrome browser argument',
        coerce: coerceAppendChromeArgument,
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
        .forEach(optionName => assignDefault(optionsWithDefaults[optionName], defaults[optionName]));
    return optionsWithDefaults;
}

module.exports = {getOptions: getOptions};
