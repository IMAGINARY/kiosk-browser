global.shellStartTime = Date.now();

import { app, session } from 'electron';
import remote from '@electron/remote/main';
import yargs from 'yargs';

import logging from './logging';
import settings from './settings';
import convertToCmdLineFormat from './settingsConverter';
import cmdLineOptions from './cmdLine';
import applyChromiumCmdLine from './applyChromiumCmdLine';
import { hasKioskProtocol, kioskSiteForKioskUrl } from './kiosk-sites';
import httpServer from './httpServer';
import appReady from './appReady';

remote.initialize();

const { logger } = logging;

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

['uncaughtException', 'unhandledRejection'].forEach((e) =>
  process.on(e, (error) => logAndExit(e, error)),
);

const yargsParserConfig = {
  'short-option-groups': true,
  'camel-case-expansion': false,
  'dot-notation': true,
  'parse-numbers': true,
};
yargs.parserConfiguration(yargsParserConfig);

function onYargsFailure(msg, err) {
  yargs.showHelp();
  logger.error(msg);
  throw err || new Error('CLI option parsing failed');
}

// TODO: describe positional argument
const yargsOptions = yargs
  .usage(
    `$0 [url]`,
    'A Chromium-based web browser with minimal UI targeting kiosk applications.',
    () =>
      yargs.positional('url', {
        describe: 'The URL to open.',
        type: 'string',
      }),
  )
  .wrap(yargs.terminalWidth())
  .help(false)
  .version(false)
  .detectLocale(false)
  .locale('en')
  .strict()
  .fail(onYargsFailure)
  .options(cmdLineOptions.getOptions(convertToCmdLineFormat(settings)));

async function main(rawArgs) {
  const args = { ...rawArgs };

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
    if (args.verbose === 0) {
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

  if (args['app-name-suffix']) {
    const s = args['app-name-suffix'];
    const newAppName = `${app.getName()}-${s}`;
    const newUserDataPath = `${app.getPath('userData')}-${s}`;
    const newSessionDataPath = `${app.getPath('sessionData')}-${s}`;
    app.setName(newAppName);
    app.setPath('userData', newUserDataPath);
    app.setPath('sessionData', newSessionDataPath);
    logger.info('Setting app name to %s', app.getName());
    logger.info('Setting userData path to %s', app.getPath('userData'));
    logger.info('Setting sessionData path to %s', app.getPath('sessionData'));
  }

  const isFirstInstance = app.requestSingleInstanceLock();
  if (isFirstInstance) {
    logger.debug("This is the first instance of app '%s'", app.getName());
  } else {
    logger.error(
      "Detected another instance of '%s'. Please supply a different --app-name-suffix for each instance. Exiting.",
      app.getName(),
    );
    app.exit(-1);
  }

  if (args['remote-debugging-port']) {
    const port = args['remote-debugging-port'];
    args['append-chrome-switch'].push({
      key: 'remote-debugging-port',
      value: port,
    });
  }

  if (args.localhost) {
    const rules =
      'MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1, EXCLUDE ::1';
    args['append-chrome-switch'].push(
      { key: 'host-rules', value: rules },
      { key: 'host-resolver-rules', value: rules },
    );
    args['clear-cache'] = true;
  }

  if (args.persistent) {
    args['append-chrome-switch'].push({ key: 'incognito' });
  }

  applyChromiumCmdLine(
    args['use-minimal-chrome-cli'],
    args['append-chrome-switch'],
    args['append-chrome-argument'],
  );

  // Quit when all windows are closed.
  app.on('window-all-closed', () => app.quit());

  // If there are no positional arguments, use one of the default URLs
  let url = args.url ?? (args.serve ? 'index.html' : settings.home);

  // If a kiosk:// URL is given, resolve it to the actual URL
  if (hasKioskProtocol(url)) {
    const kioskSite = kioskSiteForKioskUrl(url);
    console.log(kioskSite);
    url = kioskSite.html.href;
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
  Object.assign(args, { url, l: url });

  logger.info('URL after preprocessing: %s', url);

  // Wait for initialization of electron
  await app.whenReady();

  if (args['clear-cache']) {
    logger.info('Clearing cache...');
    await session.defaultSession.clearCache();
    await session.defaultSession.clearHostResolverCache();
  }

  // FIXME: For transparent windows, initialization it not ready yet (window is opaque).
  //  A delayed start serves as a temporary workaround until the problem is fixed in electron upstream.
  if (process.platform === 'linux' && args.transparent) {
    await new Promise((r) => {
      setTimeout(r, 500);
    });
  }

  await appReady(args);
}

try {
  // running electron via npm/yarn adds an extra '.' cli argument after the exe path
  // and we need to strip that away.
  const args = yargsOptions.parse(process.argv.slice(app.isPackaged ? 1 : 2));
  main(args).catch((err) => logAndExit('Exception in main', err));
} catch (err) {
  logger.error(err.msg);
  app.exit(1);
}
