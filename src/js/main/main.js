#!/usr/bin/env electron
// -*- mode: js -*-
// vim: set filetype=javascript :

'use strict';

global.shellStartTime = Date.now();

const electron = require('electron');

// Module to control application life.
const app = electron.app;

const path = require('path');
const fsExtra = require('fs-extra');
const settings = require('electron-settings');
const settingsPath = app.getPath('userData');

// ensure that the directory for the settings actually exists
// otherwise, electron-settings may fail if used before the 'ready' event
fsExtra.ensureDirSync(settingsPath);

// write defautl settings to Settings only file if it is empty
const defaultSettings = require(path.join(__dirname,"../../json/defaults.json"));
if(Object.keys(settings.getAll()).length==0)
    settings.setAll(defaultSettings,{ prettify: true });

// like get() function, but with automatic fallback to defaults
settings.getWithDefault = function(keyPath) {
    if(this.has(keyPath)) {
        // return value from the Settings
        return this.get(keyPath);
    } else {
        // return value from the defaults
        var obj = defaultSettings;
        const keys = keyPath.split(/\./);

        for(let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];

            if(Object.prototype.hasOwnProperty.call(obj, key)) {
                obj = obj[key];
            } else {
                return undefined;
            }
        }

        return obj;
    }
}

function getLinuxIcon() {
    if(process.mainModule.filename.indexOf('app.asar') === -1)
        return path.resolve(__dirname, 'build', '48x48.png');
    else
        return path.resolve(__dirname, '..', '48x48.png');
}

const cmdLineDefauls = {
    'verbose': settings.getWithDefault('verbose'),
    'dev': settings.getWithDefault('devTools'),
    'port': settings.getWithDefault('remoteDebuggingPort'),
    'menu': settings.getWithDefault('menu'),
    'kiosk': settings.getWithDefault('kiosk'),
    'always-on-top': settings.getWithDefault('alwaysOnTop'),
    'fullscreen': settings.getWithDefault('fullscreen'),
    'integration': settings.getWithDefault('integration'),
    'localhost': settings.getWithDefault('localhost'),
    'zoom': settings.getWithDefault('zoom'),
    'transparent': settings.getWithDefault('transparent'),
    'retry': settings.getWithDefault('retryTimeout'),
    'append-chrome-switch': [],
    'append-chrome-argument': [],
};
const cmdLineOptions = require(path.join(__dirname, 'cmdLine.js'));

const yargs = require('yargs');

function onYargsFailure(msg, err) {
    yargs.showHelp();
    console.error(msg);
    throw(err ? err : new Error("CLI option parsing failed"));
}

const yargsOptions = yargs
    .usage('Kiosk Web Browser\n    Usage: $0 [options] [url]')
    .wrap(yargs.terminalWidth())
    .help(false)
    .version(false)
    .strict()
    .fail(onYargsFailure)
    .options(cmdLineOptions.getOptions(cmdLineDefauls));

var args;
try {

    // running electron via npm/yarn adds an extra '.' cli argument after the exe path
    // and we need to strip that away.
    args = yargsOptions.parse(process.argv.slice(app.isPackaged ? 1 : 2));
} catch (err) {
    console.error(err.msg);
    app.exit(1);
    return;
}

var VERBOSE_LEVEL = args.verbose;

function WARN()  { VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments); }
function INFO()  { VERBOSE_LEVEL >= 1 && console.log.apply(console, arguments); }
function DEBUG() { VERBOSE_LEVEL >= 2 && console.log.apply(console, arguments); }
function TRACE(a) { VERBOSE_LEVEL >= 2 && console.trace(a); }
DEBUG(process.argv); // [1..]; // ????

DEBUG('Help: ' + (args.help) );
DEBUG('Version: ' + (args.version) );
DEBUG('Verbose: ' + (args.verbose) );
DEBUG('Dirname: ' + (__dirname) );
DEBUG('Dev: ' + (args.dev) );
DEBUG('RemoteDebuggingPort: ' + (args.port) );
DEBUG('Cursor: ' + (args.cursor) );

DEBUG('Menu: ' + (args.menu) );
DEBUG('Fullscreen Mode: ' + (args.fullscreen));
DEBUG('Testing?: ' + (args.testapp));
DEBUG('Kiosk Mode: ' + (args.kiosk));
DEBUG('Always On Top: ' + (args["always-on-top"]));
DEBUG('Zoom Factor: ' + (args.zoom));
DEBUG('Node Integration: ' + (args.integration));
DEBUG('Serve files: ' + (args.serve));
DEBUG('--url: ' + (args.url) );
DEBUG('Retry: ' + (args.retry));
DEBUG('Preload: ' + (args.preload));
DEBUG('Minimal Chrome CLI: ' + (args["use-minimal-chrome-cli"]));
DEBUG('Chrome options to append: ' + JSON.stringify(args["append-chrome-switch"]));
DEBUG('Chrome arguments to append: ' + JSON.stringify(args["append-chrome-argument"]));

DEBUG('Further Args: [' + (args._) + '], #: [' + args._.length + ']');

if(args.help){ yargsOptions.showHelp(); app.quit(); return; };

if(args.version){
    if( VERBOSE_LEVEL == 0 ) {
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
const htmlPath = args.serve ? typeof settings.getWithDefault("serve") === "undefined" : args.serve;
const urlPrefixPromise = typeof htmlPath === "undefined" ? Promise.resolve("") : httpServer.initHttpServer(args.serve);

if (args.port)
    args['append-chrome-switch'].push({key: 'remote-debugging-port', value: args.port});

if (args.localhost)
    args['append-chrome-switch'].push({key: 'host-rules', value: 'MAP * 127.0.0.1'});

const applyChromiumCmdLine = require(path.join(__dirname,'applyChromiumCmdLine.js'));
applyChromiumCmdLine(args['use-minimal-chrome-cli'],args['append-chrome-switch'],args['append-chrome-argument']);

// var crashReporter = require('crash-reporter');
// crashReporter.start(); // Report crashes to our server: productName: 'Kiosk', companyName: 'IMAGINARY'???

function logAndExit(title,error) {
    WARN(title);
    WARN(error);

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
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

var {Menu} = electron; //require('menu'); // var MenuItem = require('menu-item');

if(!args.menu) 
{
  menu = Menu.buildFromTemplate([]);
  Menu.setApplicationMenu(menu);
} else 
{
 var template = 
 [
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
      },
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.reload();
        }
      },
      {
        label: 'Toggle Full Screen',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Ctrl+Command+F';
          else
            return 'F11';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Alt+Command+I';
          else
            return 'Ctrl+Shift+I';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.toggleDevTools();
        }
      },
    ]
  },
  {
    label: 'Window',
    role: 'window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'GoBack',
        click: function(item, focusedWindow) {
//      console.log(focusedWindow);
          if (focusedWindow) { // .webContents.canGoBack()
            focusedWindow.webContents.goBack();
          }
        }
      },
//      {
//        label: 'Index',
//        click: function(item, focusedWindow) {
////      console.log(focusedWindow);
//          if (focusedWindow) {
//            focusedWindow.loadURL(`kiosk://home`);
//          }
//        }
//      },
//      {
//        label: 'Learn More',
//        click: function(item, focusedWindow) {
//          if (focusedWindow) {
//           focusedWindow.loadURL(`https://github.com/hilbert/hilbert-docker-images/`);
//        // require('shell').openExternal('https://github.com/hilbert/hilbert-docker-images/tree/devel/images/kiosk') ;
//           }
//        }
//      },
    ]
  },
  {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
  },
  {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        role: 'quit'
  },
 ];
  var menu = Menu.getApplicationMenu();

  if( menu ) {
    Menu.buildFromTemplate(template).items.forEach((val, index) => {
      // console.log(`${index}: ${val}`);
      menu.append(val);
    });
  } else { menu = Menu.buildFromTemplate(template); }

  Menu.setApplicationMenu(menu);
};

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
   DEBUG('MAX SCREEN: (' + _x + ' , ' + _y + ') - (' + _r + ' , ' + _b + ')!');

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
     INFO("Trying to Download: ");
     INFO(item.getFilename());
     INFO(item.getMimeType());
     INFO(item.getTotalBytes());
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

        WARN(`Loading ${validatedURL} failed with Error ${errorCode}: ${errorDescription}`);
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
   const partialUrl = (args._.length > 0)? args._[0] : (args.url ? args.url : (args.serve ? 'index.html' : settings.getWithDefault('home')));
   const parseUrl = require('url').parse;
   const parsedPartialUrl = parseUrl(partialUrl);
   DEBUG(parsedPartialUrl);
   if(parsedPartialUrl.protocol === "kiosk:" ) {
       switch(parsedPartialUrl.hostname) {
           case 'home':
               mainWindow.loadURL('file://'+path.normalize(`${__dirname}/../../html/index.html`));
               break;
           case 'testapp':
               mainWindow.loadURL('file://'+path.normalize(`${__dirname}/../../html/testapp.html`));
               break;
           default:
               console.error(`Unknown kiosk:// url: ${partialUrl}`);
               app.exit(-1);
       }
   } else {
       const fullUrl = parsedPartialUrl.protocol === null ? ( args.serve ? urlPrefix + partialUrl : `file://${path.resolve(partialUrl)}`) : partialUrl;
       DEBUG(`urlPrefix: ${urlPrefix}`);
       DEBUG(`partialUrl: ${partialUrl}`);
       DEBUG( `Loading ${fullUrl}`);
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