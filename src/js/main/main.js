#!/usr/bin/env electron
// -*- mode: js -*-
// vim: set filetype=javascript :

'use strict';

global.shellStartTime = Date.now();

const electron = require('electron');
const {app, BrowserWindow, Menu, MenuItem} = electron;

const path = require('path');
const fsExtra = require('fs-extra');
const logging = require(path.join(__dirname,"logging.js"));
const logger = logging.logger;

function getLinuxIcon() {
    if(process.mainModule.filename.indexOf('app.asar') === -1)
        return path.resolve(__dirname, 'build', '48x48.png');
    else
        return path.resolve(__dirname, '..', '48x48.png');
}

const settings = require(path.join(__dirname,"settings.js"));
const convertToCmdLineFormat = require(path.join(__dirname,"settingsConverter.js"));
const cmdLineOptions = require(path.join(__dirname, 'cmdLine.js'));

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

// var crashReporter = require('crash-reporter');
// crashReporter.start(); // Report crashes to our server: productName: 'Kiosk', companyName: 'IMAGINARY'???

function logAndExit(title,error) {
    logger.error('%s: %O', title, error);

    // unhandled exceptions should be considered fatal
    app.exit(-1);
}
['uncaughtException','unhandledRejection'].forEach(e => process.on(e,error=>logAndExit(e,error)));

// delay all execution until server has been started
urlPrefixPromise.then( urlPrefix => {

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function()
{
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

if (args.menu) {
    // add some entries to the default menu
    const menu = Menu.getApplicationMenu();
    const windowMenu = menu.items.find(item => item.role === 'window').submenu;
    windowMenu.insert(0, new MenuItem({
        label: 'Go forward one page',
        click: (menuItem, window) => window.webContents.goForward()
    }));
    windowMenu.insert(0, new MenuItem({
        label: 'Go back one page',
        click: (menuItem, window) => window.webContents.goBack()
    }));
    Menu.setApplicationMenu(menu);
} else {
    // remove the menu entirely (does nothing on macOS)
    Menu.setApplicationMenu(null);
}

process.on('SIGUSR1', () => mainWindow.webContents.toggleDevTools() );

function _min(a, b){ if(a <= b) return (a); else return (b); }
function _max(a, b){ if(a >= b) return (a); else return (b); }

{
    const webprefs = {
       javascript: true,
       images: true,
       webaudio: true,
       plugins: true,
       webgl: true,
       java: true,
       webSecurity: false, 'web-security': false,
       experimentalFeatures: true, 'experimental-features': true, 
       overlayFullscreenVideo: true, 'overlay-fullscreen-video': true, 
       experimentalCanvasFeatures: true, 'experimental-canvas-features': true, 
       allowRunningInsecureContent: true, 'allow-running-insecure-content': true,
       zoomFactor: args.zoom, 'zoom-factor': args.zoom,
       nodeIntegration: args.integration, 'node-integration': args.integration
    };
    
    if(args.preload)
        webprefs.preload = path.resolve(args.preload);

   const {screen} = electron; // require('screen');
   const size = screen.getPrimaryDisplay().bounds;

   // NOTE: span all enabled displays:
   var _x = size.x; var _y = size.y; var _r = _x + size.width; var _b = _y + size.height;
   const displays = screen.getAllDisplays(); var _d;
   for(var d in displays)
   {  _d = displays[d].bounds;

     _x = _min(_x, _d.x);
     _y = _min(_y, _d.y);
     _r = _max(_r, _d.x + _d.width);
     _b = _max(_b, _d.y + _d.height);
   };
   logger.debug('MAX SCREEN: (' + _x + ' , ' + _y + ') - (' + _r + ' , ' + _b + ')!');

    const options = { show: false
    , x: _x, y: _y, width: _r - _x, height: _b - _y
    , frame: !args.transparent
    , titleBarStyle: 'hidden-inset'
    , fullscreenable: true
    , fullscreen: args.fullscreen
    , icon: getLinuxIcon()
    , kiosk: args.kiosk
    , resizable: !args.transparent
    , transparent: args.transparent
    , alwaysOnTop: args["always-on-top"], 'always-on-top': args["always-on-top"]
    , webPreferences: webprefs, 'web-preferences': webprefs
    , acceptFirstMouse: true, 'accept-first-mouse': true
    };
// ,  resizable: ((!args.kiosk) && (!args.fullscreen))



//       textAreasAreResizable: true,
//    type: 'desktop',    'standard-window': true,
//    fullscreen: true,    frame: false,    kiosk: true,     resizable: false,    'always-on-top': true,    'auto-hide-menu-bar': true,    'title-bar-style': 'hidden' 
 

   mainWindow = new BrowserWindow(options);

   if((!args.menu) || args.kiosk) { mainWindow.setMenu(null); }

   if(args.fullscreen) {
       mainWindow.setMinimumSize(_r - _x,_b - _y);
       mainWindow.setContentSize(_r - _x,_b - _y);
   }

   mainWindow.webContents.on('new-window', function(event, _url) { event.preventDefault(); });

   mainWindow.on('app-command', function(e, cmd) {
      // Navigate the window back when the user hits their mouse back button
      if (cmd === 'browser-backward' && mainWindow.webContents.canGoBack() && (!args.kiosk)) { mainWindow.webContents.goBack(); }
   });

   // In the main process.
   mainWindow.webContents.session.on('will-download', function(event, item, webContents) {
     logger.info("Trying to Download: ");
     logger.info(item.getFilename());
     logger.info(item.getMimeType());
     logger.info(item.getTotalBytes());
     item.cancel(); // Nope... this is a kiosk!
   });

   mainWindow.once('ready-to-show', () => {
     if(args.fullscreen){ mainWindow.maximize(); };
     mainWindow.show();
     mainWindow.focus();
   });

   mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(args.zoom);
    mainWindow.setFullScreen(args.fullscreen);
   });

    // retry loading the page if it failed
    mainWindow.webContents.on('did-fail-load', ( event, errorCode, errorDescription, validatedURL, isMainFrame ) => {
        if( errorCode == -3 || errorCode == 0 )
            return;

        logger.warn(`Loading ${validatedURL} failed with Error ${errorCode}: ${errorDescription}`);
        var errorMsgDiv  = `
            <div style="position:absolute;top:0px;left:0px;width: 100%;color: white;background-color: black;">
                Error ${errorCode}: ${errorDescription}<br />
                URL: ${validatedURL}<br />
        `;

        if(args.retry>0)
            errorMsgDiv += `Reloading in ${args.retry}s`;
            
        errorMsgDiv += `</div>`;

        mainWindow.webContents.once('dom-ready',()=>{
            mainWindow.webContents.executeJavaScript(`document.body.innerHTML += ${JSON.stringify(errorMsgDiv)};`);
            if(args.retry>0) {
                mainWindow.webContents.executeJavaScript(`setTimeout(()=>window.location.reload(),${args.retry*1000});`);
            }
        });
    });

   mainWindow.setFullScreen(args.fullscreen);

   // Open the DevTools?
   if(args.dev){ mainWindow.openDevTools(); } // --remote-debugging-port=8315

   // and load some URL?!
   const partialUrl = (args._.length > 0)? args._[0] : (args.url ? args.url : (args.serve ? 'index.html' : settings.home));
   const parseUrl = require('url').parse;
   const parsedPartialUrl = parseUrl(partialUrl);
   logger.debug('%o', parsedPartialUrl);
   if(parsedPartialUrl.protocol === "kiosk:" ) {
       switch(parsedPartialUrl.hostname) {
           case 'home':
               mainWindow.loadURL('file://'+path.normalize(`${__dirname}/../../html/index.html`));
               break;
           case 'testapp':
               mainWindow.loadURL('file://'+path.normalize(`${__dirname}/../../html/testapp.html`));
               break;
           default:
               logger.error(`Unknown kiosk:// url: ${partialUrl}`);
               app.exit(-1);
       }
   } else {
       const fullUrl = parsedPartialUrl.protocol === null ? ( args.serve ? urlPrefix + partialUrl : `file://${path.resolve(partialUrl)}`) : partialUrl;
       logger.debug(`urlPrefix: ${urlPrefix}`);
       logger.debug(`partialUrl: ${partialUrl}`);
       logger.debug( `Loading ${fullUrl}`);
       mainWindow.loadURL(fullUrl);
   }



//  mainWindow.webContents.setZoomFactor(args.zoom);

//  mainWindow.webContents.executeJavaScript(`
//    module.paths.push(path.resolve('/opt/node_modules'));
//    module.paths.push(path.resolve('node_modules'));
//    module.paths.push(path.resolve('../node_modules'));
//    module.paths.push(path.resolve(__dirname, '..', '..', 'electron', 'node_modules'));
//    module.paths.push(path.resolve(__dirname, '..', '..', 'electron.asar', 'node_modules'));
//    module.paths.push(path.resolve(__dirname, '..', '..', 'app', 'node_modules'));
//    module.paths.push(path.resolve(__dirname, '..', '..', 'app.asar', 'node_modules'));
//    path = undefined;
//  `);



}

});

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());

});