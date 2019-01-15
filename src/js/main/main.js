#!/usr/bin/env electron
// -*- mode: js -*-
// vim: set filetype=javascript :

'use strict';

global.shellStartTime = Date.now();

const {app} = require('electron');

const path = require('path');
const fsExtra = require('fs-extra');
const logging = require(path.join(__dirname,"logging.js"));
const logger = logging.logger;

const settings = require(path.join(__dirname,"settings.js"));
const convertToCmdLineFormat = require(path.join(__dirname,"settingsConverter.js"));
const cmdLineOptions = require(path.join(__dirname, 'cmdLine.js'));
const appReady = require(path.join(__dirname, 'appReady.js'));

const yargs = require('yargs');

function onYargsFailure(msg, err) {
    yargs.showHelp();
    logger.error(msg);
    throw(err ? err : new Error("CLI option parsing failed"));
}

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

const httpServer = require(path.join(__dirname,'httpServer.js'));
const urlPrefixPromise = typeof args.serve === "undefined" ? Promise.resolve("") : httpServer.initHttpServer(args.serve);

if (args.port)
    args['append-chrome-switch'].push({key: 'remote-debugging-port', value: args.port});

if (args.localhost)
    args['append-chrome-switch'].push({key: 'host-rules', value: 'MAP * 127.0.0.1'});

const applyChromiumCmdLine = require(path.join(__dirname,'applyChromiumCmdLine.js'));
applyChromiumCmdLine(args['use-minimal-chrome-cli'],args['append-chrome-switch'],args['append-chrome-argument']);

function logAndExit(title,error) {
    logger.error('%s: %O', title, error);

    // unhandled exceptions should be considered fatal
    app.exit(-1);
}
['uncaughtException','unhandledRejection'].forEach(e => process.on(e,error=>logAndExit(e,error)));

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());

// Delay further execution until electron and the built-in HTTP server are initialized
app.whenReady().then(() => urlPrefixPromise).then(urlPrefix => appReady(settings, args, urlPrefix));
