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

['uncaughtException', 'unhandledRejection'].forEach(e => process.on(e,
  error => logAndExit(e, error)));

global.shellStartTime = Date.now();

const { app } = require('electron');
require('@electron/remote/main').initialize();

const logging = require('./logging');
const { logger } = logging;

const settings = require('./settings');
const convertToCmdLineFormat = require('./settingsConverter');
const cmdLineOptions = require('./cmdLine');
const applyChromiumCmdLine = require('./applyChromiumCmdLine');
const { hasKioskProtocol, kioskSiteForKioskUrl } = require('./kiosk-sites');
const httpServer = require('./httpServer');
const appReady = require('./appReady');

const yargsParserConfig = {
  "short-option-groups": true,
  "camel-case-expansion": false,
  "dot-notation": true,
  "parse-numbers": true,
};
const yargs = require('yargs').parserConfiguration(yargsParserConfig);

function onYargsFailure(msg, err) {
  yargs.showHelp();
  logger.error(msg);
  throw(err ? err : new Error("CLI option parsing failed"));
}

// TODO: describe positional argument
const yargsOptions = yargs
  .usage(
      `$0 [url]`,
      'A Chromium-based web browser with minimal UI targeting kiosk applications.',
      (yargs) => yargs.positional('url', {
            describe: 'The URL to open.',
            type: 'string'
          }
      ))
  .wrap(yargs.terminalWidth())
  .help(false)
  .version(false)
  .detectLocale(false)
  .locale('en')
  .strict()
  .fail(onYargsFailure)
  .options(cmdLineOptions.getOptions(convertToCmdLineFormat(settings)));

async function main(args) {
  logging.setLevelNumeric(args.verbose);

  // log parsed options
  logger.debug(process.argv);
  logger.debug('%o', args);

  if (args.help) {
    yargsOptions.showHelp();
    app.quit();
    return;
  }

  if (args.version) {
    if (args.verbose == 0) {
      console.log(`v${app.getVersion()}`);
    } else {
      console.log(`Kiosk browser: v${app.getVersion()}`);
      console.log(`Electron: v${process.versions.electron}`);
      console.log(`Node: v${process.versions.node}`);
      console.log(`Chromium: v${process.versions.chrome}`);
    }
    app.quit();
    return;
  }

  if (args.port) {
    args['append-chrome-switch'].push({ key: 'remote-debugging-port', value: args.port });
  }

  if (args.localhost) {
    args['append-chrome-switch'].push({ key: 'host-rules', value: 'MAP * 127.0.0.1' });
  }

  if (process.platform === 'linux' && args.transparent) {
    // This is a workaround for
    // https://github.com/electron/electron/blob/v11.0.0/docs/api/frameless-window.md#limitations
    // TODO: Check regularly if the fix is still necessary
    args['append-chrome-switch'].push({ key: '--enable-transparent-visuals', value: '' });
    args['append-chrome-switch'].push({ key: '--disable-gpu', value: '' });
  }

  applyChromiumCmdLine(args['use-minimal-chrome-cli'],
    args['append-chrome-switch'],
    args['append-chrome-argument']);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => app.quit());

  // If there are no positional arguments, use one of the default URLs
  let url = args.url ?? (args.serve ? 'index.html' : settings['home']);

  // If a kiosk:// URL is given, resolve it to the actual URL
  if (hasKioskProtocol(url)) {
    url = kioskSiteForKioskUrl(url).html.href;
  }

  if (args.serve) {
    try {
      // Wait for initialization of the built-in HTTP server
      // and adjust url with the http server prefix.
      const serverPrefix = await httpServer.init(args.serve);
      url = new URL(url, serverPrefix).href;
    } catch (err) {
      logger.error('Unable to start built-in HTTP server: %O', err);
      app.exit(1);
    }
  }

  // Set the computed url
  args.url = args.l = url;

  logger.info('URL after preprocessing: %s', url);

  // Wait for initialization of electron
  await app.whenReady();

  // FIXME: For transparent windows, initialization it not ready yet (window is opaque).
  //  A delayed start serves as a temporary workaround until the problem is fixed in electron upstream.
  if (process.platform === 'linux' && args.transparent) {
    await new Promise(r => setTimeout(r, 500));
  }

  appReady(args);
}

try {
  // running electron via npm/yarn adds an extra '.' cli argument after the exe path
  // and we need to strip that away.
  const args = yargsOptions.parse(process.argv.slice(app.isPackaged ? 1 : 2));
  main(args).catch(err => logAndExit('Exception in main', err));
} catch (err) {
  logger.error(err.msg);
  app.exit(1);
  return;
}
