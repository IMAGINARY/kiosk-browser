#!/usr/bin/env electron
// -*- mode: js -*-
// vim: set filetype=javascript :

'use strict';

global.shellStartTime = Date.now();

const electron = require('electron');

const path = require('path');
const settings = require('electron-settings');
settings.defaults(require("./defaults.json"));
settings.applyDefaultsSync({
    prettify: true
});

function getLinuxIcon() {
    if(process.mainModule.filename.indexOf('app.asar') === -1)
        return path.resolve(__dirname, 'build', '48x48.png');
    else
        return path.resolve(__dirname, '..', '48x48.png');
}

const yargs = require('yargs'); // https://www.npmjs.com/package/yargs

// TODO: mouse cursor? language?
const options = yargs.wrap(yargs.terminalWidth())
.alias('h', 'help').boolean('h').describe('h', 'Print this usage message.')
.alias('V', 'version').boolean('V').describe('V', 'Print the version.')
.alias('v', 'verbose').count('v').describe('v', 'Increase Verbosity').default('v', settings.getSync("verbose"))
.alias('d', 'dev').boolean('d').describe('d', 'Run in development mode.').default('d', settings.getSync("devTools"))
.alias('c', 'cursor').boolean('c').describe('c', 'Toggle Mouse Cursor (TODO)').default('m', settings.getSync("cursor"))
.alias('m', 'menu').boolean('m').describe('m', 'Toggle Main Menu').default('m', settings.getSync("menu"))
.alias('k', 'kiosk').boolean('k').describe('k', 'Toggle Kiosk Mode').default('k', settings.getSync("kiosk"))
.alias('f', 'fullscreen').boolean('f').describe('f', 'Toggle Fullscreen Mode').default('f', settings.getSync("fullscreen"))
.alias('i', 'integration').boolean('i').describe('i', 'node Integration').default('i', settings.getSync("integration"))
.boolean('testapp').describe('testapp', 'Testing application').default('testapp', settings.getSync("testapp"))
.alias('z', 'zoom').number('z').describe('z', 'Set Zoom Factor').default('z', settings.getSync("zoom"))
.alias('l', 'url').string('l').describe('l', 'URL to load').default('l', 'file://' + __dirname + '/' + 'index.html')
.alias('t', 'transparent').boolean('t').describe('t', 'Transparent Browser Window').default('t', settings.getSync("transparent"))
.usage('Kiosk Web Browser\n    Usage: $0 [options] [args]' );

// settings.getSync("default_html")

const args = options.argv;

var VERBOSE_LEVEL = args.verbose;

function WARN()  { VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments); }
function INFO()  { VERBOSE_LEVEL >= 1 && console.log.apply(console, arguments); }
function DEBUG() { VERBOSE_LEVEL >= 2 && console.log.apply(console, arguments); }

DEBUG(process.argv); // [1..]; // ????

DEBUG('Help: ' + (args.help) );
DEBUG('Version: ' + (args.version) );
DEBUG('Verbose: ' + (args.verbose) );
DEBUG('Dev: ' + (args.dev) );
DEBUG('Cursor: ' + (args.cursor) );

DEBUG('Menu: ' + (args.menu) );
DEBUG('Fullscreen Mode: ' + (args.fullscreen));
DEBUG('Testing?: ' + (args.testapp));
DEBUG('Kiosk Mode: ' + (args.kiosk));
DEBUG('Zoom Factor: ' + (args.zoom));
DEBUG('Node Integration: ' + (args.integration));
DEBUG('URL: ' + (args.url) );

if(args.help){ options.showHelp(); process.exit(0); };

// Module to control application life.
const app = electron.app;

if(args.version){ console.log(app.getVersion()); process.exit(0); };

const url = args.testapp ? 'file://' + __dirname + '/' + 'testapp.html' : args.url;

// http://peter.sh/experiments/chromium-command-line-switches/

// --enable-pinch --flag-switches-begin 
//--enable-experimental-canvas-features --enable-gpu-rasterization --javascript-harmony --enable-touch-editing --enable-webgl-draft-extensions --enable-experimental-extension-apis --ignore-gpu-blacklist --show-fps-counter --ash-touch-hud --touch-events=enabled
// --flag-switches-end

function sw() 
{

app.commandLine.appendSwitch('--js-flags="--max_old_space_size=4096"');

app.commandLine.appendSwitch('disable-threaded-scrolling');

// app.commandLine.appendSwitch('enable-apps-show-on-first-paint');
// app.commandLine.appendSwitch('enable-embedded-extension-options');
// app.commandLine.appendSwitch('enable-experimental-canvas-features');
// app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('javascript-harmony');

// app.commandLine.appendSwitch('enable-pinch');
app.commandLine.appendSwitch('disable-pinch');

app.commandLine.appendSwitch('enable-settings-window');
app.commandLine.appendSwitch('enable-touch-editing');
// app.commandLine.appendSwitch('enable-webgl-draft-extensions');
// app.commandLine.appendSwitch('enable-experimental-extension-apis');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
// app.commandLine.appendSwitch('disable-overlay-scrollbar');
// app.commandLine.appendSwitch('show-fps-counter');
// app.commandLine.appendSwitch('ash-touch-hud');

app.commandLine.appendSwitch('touch-events');
app.commandLine.appendSwitch('touch-events-enabled');
app.commandLine.appendSwitch('touch-events', 'enabled');

/// app.commandLine.appendSwitch('ignore-gpu-blacklist');
/// app.commandLine.appendSwitch('enable-gpu');
// app.commandLine.appendSwitch('disable-gpu-sandbox');
// app.commandLine.appendSwitch('enable-gpu-rasterization');
/// app.commandLine.appendSwitch('enable-pinch');

// app.commandLine.appendSwitch('blacklist-accelerated-compositing');

app.commandLine.appendSwitch('disable-web-security');
/// app.commandLine.appendSwitch('enable-webgl');

// app.commandLine.appendSwitch('enable-webgl-draft-extensions');
/// app.commandLine.appendSwitch('enable-webgl-image-chromium');

// app.commandLine.appendSwitch('enable-touch-editing');
// app.commandLine.appendSwitch('enable-touch-drag-drop');
/// app.commandLine.appendSwitch('enable-touchview');

/// app.commandLine.appendSwitch('compensate-for-unstable-pinch-zoom');

/// app.commandLine.appendSwitch('enable-viewport');
// app.commandLine.appendSwitch('enable-unsafe-es3-apis');
// app.commandLine.appendSwitch('enable-experimental-canvas-features');
// app.commandLine.appendSwitch('enable-experimental-extension-apis');
// app.commandLine.appendSwitch('javascript-harmony');
// app.commandLine.appendSwitch('enable-subscribe-uniform-extension');

/// app.commandLine.appendSwitch('show-fps-counter');
/// app.commandLine.appendSwitch('ash-touch-hud');
// app.commandLine.appendSwitch('ash-enable-touch-view-testing');

/// app.commandLine.appendSwitch('auto');
app.commandLine.appendSwitch('allow-file-access-from-files');

//    '--js-flags="--max_old_space_size=4096"',
//    'disable-threaded-scrolling',
//    'javascript-harmony',
//    'disable-pinch',
[
    'enable_hidpi', 'enable-hidpi',
    '--high-dpi-support=1', '--high-dpi-support', 'high-dpi-support',
    '--force-device-scale-factor=1'
].forEach(app.commandLine.appendSwitch);
app.commandLine.appendSwitch('force-device-scale-factor', '1');
//    '--force-device-scale-factor', 'force-device-scale-factor'

[
    'enable-transparent-visuals', '--enable-transparent-visuals',
].forEach(app.commandLine.appendSwitch);



}

//https://github.com/atom/electron/issues/1277
//https://bugs.launchpad.net/ubuntu/+source/chromium-browser/+bug/1463598
//https://code.google.com/p/chromium/issues/detail?id=121183



// Append Chromium command line switches
/// 'enable-pinch',  // ?
[
    'enable_hidpi', 'enable-hidpi',
    '--high-dpi-support=1', '--high-dpi-support', 'high-dpi-support',
    '--force-device-scale-factor=1',
    'enable-transparent-visuals', '--enable-transparent-visuals',
    'disable-pinch',
    'allow-file-access-from-files'
].forEach(app.commandLine.appendSwitch);
// --disable-gpu
//    , 'force-device-scale-factor', '--force-device-scale-factor',
app.commandLine.appendSwitch('force-device-scale-factor', '1');

// sw();
app.commandLine.appendSwitch('flag-switches-begin');
sw();
app.commandLine.appendSwitch('flag-switches-end');




// app.commandLine.appendSwitch('remote-debugging-port', '8315');
// app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1');

// var crashReporter = require('crash-reporter');
// crashReporter.start(); // Report crashes to our server: productName: 'Kiosk', companyName: 'IMAGINARY'???

// var nslog = require('nslog');
// console.log = nslog;
process.on('uncaughtException', function(error) { // '='? '{}'?
   WARN('uncaughtException! :(');
   WARN(error);
});

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() { DEBUG('window-all-closed!'); app.quit(); }); // also on MAC OS X?
// if (process.platform != 'darwin') // ?

var {Menu} = electron; //require('menu'); // var MenuItem = require('menu-item');

if(!args.menu) 
{

  menu = Menu.buildFromTemplate([]);
  Menu.setApplicationMenu(menu);

} else 
{
// Menu.setApplicationMenu(null);

var menu = Menu.getApplicationMenu();
if( !menu ) // ???
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
      {
	label: 'Index',
 	click: function(item, focusedWindow) {
//      console.log(focusedWindow);
          if (focusedWindow) {
            focusedWindow.loadURL(`file://${ __dirname}/index.html`);
          }
        }
      },
      {
        label: 'Learn More',
        click: function(item, focusedWindow) {
          if (focusedWindow) {
           focusedWindow.loadURL(`https://github.com/hilbert/hilbert-docker-images/tree/devel/images/kiosk`);
        // require('shell').openExternal('https://github.com/hilbert/hilbert-docker-images/tree/devel/images/kiosk') ;
           }
        }
      },
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

  menu = Menu.buildFromTemplate(template);
//  menu = Menu.buildFromTemplate([]);
  Menu.setApplicationMenu(menu);
};
};

var signals = {
  'SIGINT': 2,
  'SIGTERM': 15
};

function shutdown(signal, value) {
  server.close(function () {
    console.log('Kiosk stopped due to [' + signal + '] signal');
    process.exit(128 + value);
  });
}

Object.keys(signals).forEach(function (signal) {
  process.on(signal, function () {
    shutdown(signal, signals[signal]);
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function()
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

   const {screen} = electron; // require('screen');
   const size = screen.getPrimaryDisplay().workAreaSize;

    const options = { show: false
    , x: 0, y: 0, width: size.width, height: size.height
    , frame: !args.transparent
    , titleBarStyle: 'hidden-inset'
    , fullscreenable: true
    , fullscreen: args.fullscreen
    , icon: getLinuxIcon()
    , kiosk: args.kiosk
    , resizable: !args.transparent
    , transparent: args.transparent
    , alwaysOnTop: true, 'always-on-top': true
    , webPreferences: webprefs, 'web-preferences': webprefs
    , acceptFirstMouse: true, 'accept-first-mouse': true
    };
// ,  resizable: ((!args.kiosk) && (!args.fullscreen))



//       textAreasAreResizable: true,
//    type: 'desktop',    'standard-window': true,
//    fullscreen: true,    frame: false,    kiosk: true,     resizable: false,    'always-on-top': true,    'auto-hide-menu-bar': true,    'title-bar-style': 'hidden' 
 

   mainWindow = new BrowserWindow(options);

   if((!args.menu) || args.kiosk) { mainWindow.setMenu(null); }


   // Emitted when the window is closed.
   mainWindow.on('closed', function() {
     // Dereference the window object, usually you would store windows
     // in an array if your app supports multi windows, this is the time
     // when you should delete the corresponding element.
     DEBUG("closing main window...");
     mainWindow = null;
     app.quit();
   });

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
   });

   mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(args.zoom);
    mainWindow.setFullScreen(args.fullscreen);
   });

   mainWindow.setFullScreen(args.fullscreen);

   // Open the DevTools?
   if(args.dev){ mainWindow.openDevTools(); }

   // and load some URL?!
   mainWindow.loadURL(`${url}`);

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



});
