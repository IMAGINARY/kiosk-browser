#!/usr/bin/env electron
// -*- mode: js -*-
// vim: set filetype=javascript :

'use strict';

// exit in case of unhandled exceptions or rejections
function logAndExit(title, error) {
    if (error instanceof SyntaxError) {
        // do nothing since electron logs syntax errors to the console on its own
    } else {
        logger.error('%s: %O', title, error);
    }

    // unhandled exceptions should be considered fatal
    app.exit(-1);
}

['uncaughtException', 'unhandledRejection'].forEach(e => process.on(e, error => logAndExit(e, error)));

global.shellStartTime = Date.now();

const {app} = require('electron');

const {pathToFileURL} = require('url');
const path = require('path');
const logging = require(path.join(__dirname, "logging.js"));
const logger = logging.logger;

const settings = require(path.join(__dirname, "settings.js"));
const convertToCmdLineFormat = require(path.join(__dirname, "settingsConverter.js"));
const cmdLineOptions = require(path.join(__dirname, 'cmdLine.js'));
const applyChromiumCmdLine = require(path.join(__dirname, 'applyChromiumCmdLine.js'));
const httpServer = require(path.join(__dirname, 'httpServer.js'));
const appReady = require(path.join(__dirname, 'appReady.js'));

const yargs = require('yargs');

function isKioskUrl(url) {
    return /^kiosk:\/\//.test(url);
}

function resolveKioskUrl(kioskUrl) {
    const url = new URL(kioskUrl);
    const kioskUrls = {
        home: 'index.html',
        testapp: 'testapp.html'
    };
    if (kioskUrls[url.hostname])
        return pathToFileURL(path.join(__dirname, '../../html/', kioskUrls[url.hostname])).href;
    else
        throw new Error(`Unknown kiosk:// url: ${url}`)
}

function onYargsFailure(msg, err) {
    yargs.showHelp();
    logger.error(msg);
    throw(err ? err : new Error("CLI option parsing failed"));
}

// TODO: describe positional argument
const yargsOptions = yargs
    .usage('Kiosk Web Browser\n    Usage: $0 [options] [url]')
    .wrap(yargs.terminalWidth())
    .help(false)
    .version(false)
    .strict()
    .fail(onYargsFailure)
    .options(cmdLineOptions.getOptions(convertToCmdLineFormat(settings)));

var args;
try {

    // running electron via npm/yarn adds an extra '.' cli argument after the exe path
    // and we need to strip that away.
    args = yargsOptions.parse(process.argv.slice(app.isPackaged ? 1 : 2));
} catch (err) {
    logger.error(err.msg);
    app.exit(1);
    return;
}

logging.setLevelNumeric(args.verbose);

// log parsed options
logger.debug(process.argv);
logger.debug('%o',args);

if(args.help){ yargsOptions.showHelp(); app.quit(); return; };

if(args.version){
    if( args.verbose == 0 ) {
        console.log(`v${app.getVersion()}`);
    } else {
        console.log(`Kiosk browser: v${app.getVersion()}`);
        console.log(`Electron: v${process.versions.electron}`);
        console.log(`Node: v${process.versions.node}`);
        console.log(`Chromium: v${process.versions.chrome}`);
    }
    app.quit();
    return;
};

if (args.port)
    args['append-chrome-switch'].push({key: 'remote-debugging-port', value: args.port});

if (args.localhost)
    args['append-chrome-switch'].push({key: 'host-rules', value: 'MAP * 127.0.0.1'});

applyChromiumCmdLine(args['use-minimal-chrome-cli'],args['append-chrome-switch'],args['append-chrome-argument']);

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());

// If there are no positional arguments, use one of the default URLs
let url = (args._.length > 0) ? args._[0] : (args.serve ? 'index.html' : settings['home']);

// If a kiosk:// URL is given, resolve it to the actual URL and add node integration
if (isKioskUrl(url)) {
    url = resolveKioskUrl(url);
    args.integration = args.i = true;
}

// Run the built-in server if requested and, if the current URL is without protocol, interpret it as a URL relative to
// the server root
let urlReady = (args.serve ? httpServer.init(args.serve) : Promise.resolve(''))
    .then(prefix => !/^[A-Za-z]+:\/\//.test(url) ? prefix + url : url);

// Delay further execution until electron and the built-in HTTP server are initialized
app.whenReady().then(() =>
    urlReady.then(url => {
        args.url = args.l = url;
        logger.info('URL after preprocessing: %s', url);
        appReady(args);
    })
);
