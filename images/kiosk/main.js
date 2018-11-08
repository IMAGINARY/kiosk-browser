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
console.log(settingsPath);
// write defautl settings to Settings only file if it is empty
const defaultSettings = require("./defaults.json");
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

const yargs = require('yargs'); // https://www.npmjs.com/package/yargs

//   if(args.dev){ mainWindow.openDevTools(); } // --remote-debugging-port=8315 .port

// TODO: mouse cursor? language?
const options = yargs.wrap(yargs.terminalWidth())
.alias('h', 'help').boolean('h').describe('h', 'Print this usage message.')
.alias('V', 'version').boolean('V').describe('V', 'Print the version.')
.alias('v', 'verbose').count('v').describe('v', 'Increase Verbosity').default('v', settings.getWithDefault("verbose"))
.alias('d', 'dev').boolean('d').describe('d', 'Run in development mode.').default('d', settings.getWithDefault("devTools"))
.alias('p', 'port').number('p').describe('p', 'Specify remote debugging port.').default('p', settings.getWithDefault("remoteDebuggingPort"))
.alias('c', 'cursor').boolean('c').describe('c', 'Toggle Mouse Cursor (TODO)').default('m', settings.getWithDefault("cursor"))
.alias('m', 'menu').boolean('m').describe('m', 'Toggle Main Menu').default('m', settings.getWithDefault("menu"))
.alias('k', 'kiosk').boolean('k').describe('k', 'Toggle Kiosk Mode').default('k', settings.getWithDefault("kiosk"))
.alias('T', 'always-on-top').boolean('T').describe('T', 'Toggle Always On Top').default('T', settings.getWithDefault("alwaysOnTop"))
.alias('f', 'fullscreen').boolean('f').describe('f', 'Toggle Fullscreen Mode').default('f', settings.getWithDefault("fullscreen"))
.alias('i', 'integration').boolean('i').describe('i', 'node Integration').default('i', settings.getWithDefault("integration"))
.boolean('testapp').describe('testapp', 'Testing application').default('testapp', settings.getWithDefault("testapp"))
.boolean('localhost').describe('localhost', 'Restrict to LocalHost').default('localhost', settings.getWithDefault("localhost"))
.alias('z', 'zoom').number('z').describe('z', 'Set Zoom Factor').default('z', settings.getWithDefault("zoom"))
.alias('l', 'url').string('l').describe('l', 'URL to load').default('l', 'file://' + __dirname + '/' + settings.getWithDefault("index_url"))
.alias('t', 'transparent').boolean('t').describe('t', 'Transparent Browser Window').default('t', settings.getWithDefault("transparent"))
.number('retry').describe('retry', 'Retry after given number of seconds if loading the page failed (0 to disable)').default('retry',settings.getWithDefault('retryTimeout'))
.string('preload').describe('preload', 'preload a JavaScript file')
.string('append-chrome-switch').coerce('append-chrome-switch',function(xs){
    function processSwitch(s) {
        if(s.length==0)
            throw new Error("Empty Chrome CLI switch");
        
        if(!s.startsWith('--'))
            throw new Error("Chrome CLI switch must start with '--'");
            
        var parts = s.substr(2).split("=",2);
        return parts.length == 1 ? { key: parts[0] } : { key: parts[0], value: parts[1] };
    };
    xs = typeof xs == 'string' ? [xs] : xs;
    return xs.map(processSwitch);
}).describe('append-chrome-switch', 'Append switch to internal Chrome browser switches')
.string('append-chrome-argument').coerce('append-chrome-argument', xs=>typeof xs == 'string' ? [xs] : xs ).describe('append-chrome-argument', 'Append positional argument to internal Chrome browser argument')
.boolean('use-minimal-chrome-cli').describe('use-minimal-chrome-cli', 'Don\'t append anything to the internal Chrome command line by default')
.usage('Kiosk Web Browser\n    Usage: $0 [options] [url]' )
.fail((msg,err,yargs) => {
    yargs.showHelp();
    console.error(msg);
    throw( err ? err : new Error("CLI option parsing failed") );
})
.help(false) // automatic exit after help doesn't work after app.onReady
.version(false) // automatic exit after version doesn't work after app.onReady
.strict();
/*.fail(function (msg, err, yargs) { f (err) throw err // preserve stack
    console.error('You broke it!'); console.error(msg); console.error('You should be doing', yargs.help()); process.exit(1); })*/

// settings.getWithDefault("default_html")

var args;
try {
    args = options.argv;
} catch(err) {
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
DEBUG('--url: ' + (args.url) );
DEBUG('Retry: ' + (args.retry));
DEBUG('Preload: ' + (args.preload));
DEBUG('Minimal Chrome CLI: ' + (args["use-minimal-chrome-cli"]));
DEBUG('Chrome options to append: ' + JSON.stringify(args["append-chrome-switch"]));
DEBUG('Chrome arguments to append: ' + JSON.stringify(args["append-chrome-argument"]));

DEBUG('Further Args: [' + (args._) + '], #: [' + args._.length + ']');

if(args.help){ options.showHelp(); process.exit(0); return; };

if(args.version){ console.log(app.getVersion()); process.exit(0); return; };


var url = (args._.length > 0)? args._[0] : args.url;
url = args.testapp ? 'file://' + __dirname + '/' + settings.getWithDefault("testapp_url") : url;

if((!args.testapp) && (args._.length > 1)){ WARN('Multiple arguments were given: [' + (args._) + ']!'); process.exit(1); return; }

DEBUG('Resulting URL to load: [' + (url) + ']');


// --enable-pinch --flag-switches-begin 
//--enable-experimental-canvas-features --enable-gpu-rasterization --javascript-harmony --enable-touch-editing --enable-webgl-draft-extensions --enable-experimental-extension-apis --ignore-gpu-blacklist --show-fps-counter --ash-touch-hud --touch-events=enabled
// --flag-switches-end

function sw() 
{
  // https://github.com/atom/electron/issues/1277
  // https://bugs.launchpad.net/ubuntu/+source/chromium-browser/+bug/1463598
  // https://code.google.com/p/chromium/issues/detail?id=121183
  // http://peter.sh/experiments/chromium-command-line-switches/
  // https://xwartz.gitbooks.io/electron-gitbook/content/en/api/chrome-command-line-switches.html

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

//app.commandLine.appendSwitch('touch-events');
//app.commandLine.appendSwitch('touch-events-enabled');
//app.commandLine.appendSwitch('touch-events', 'enabled');

app.commandLine.appendSwitch('disabled');
app.commandLine.appendSwitch('disable-touch-events');
app.commandLine.appendSwitch('touch-events-disabled');
app.commandLine.appendSwitch('touch-events', 'disabled'); // --touch-events=disabled 
app.commandLine.appendSwitch('disable-features', 'PassiveDocumentEventListeners,PassiveEventListenersDueToFling'); // --disable-features=PassiveDocumentEventListeners,PassiveEventListenersDueToFling


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

//    '--js-flags="--max_old_space_size=4096"',
//    'disable-threaded-scrolling',
//    'javascript-harmony',
//    'disable-pinch',

  [
    'disable-pinch',
    'allow-file-access-from-files',
    'enable_hidpi', 
    'enable-hidpi', 
    'disable-background-timer-throttling',
    'enable-transparent-visuals',
    'incognito'
  ].forEach(app.commandLine.appendSwitch); 

  app.commandLine.appendSwitch('high-dpi-support', '1');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');
  app.commandLine.appendSwitch('set-base-background-color', '0x00000000');

  /// 'enable-pinch',  // ?
  // --disable-gpu


}


// Append Chromium command line switches
if(args.dev){ app.commandLine.appendSwitch('remote-debugging-port', args.port); }
if(args.localhost){ app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1'); }

if(!args["use-minimal-chrome-cli"]) {
    sw(); app.commandLine.appendSwitch('flag-switches-begin'); sw(); app.commandLine.appendSwitch('flag-switches-end');
}

if(args["append-chrome-switch"])
    args["append-chrome-switch"].forEach(s => s.hasOwnProperty("value") ? app.commandLine.appendSwitch(s.key,s.value) : app.commandLine.appendSwitch(s.key));

if(args["append-chrome-argument"])
    args["append-chrome-argument"].forEach(a => app.commandLine.appendArgument(a));


// var crashReporter = require('crash-reporter');
// crashReporter.start(); // Report crashes to our server: productName: 'Kiosk', companyName: 'IMAGINARY'???

// var nslog = require('nslog');
// console.log = nslog;
process.on('uncaughtException', function(error) { // '='? '{}'?
   WARN('uncaughtException! :(');
   WARN(error);
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function()
{

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

// Quit when all windows are closed.
function Finish(msg)
{
  DEBUG('Finish(' + msg + ')...'); 
  if(mainWindow)
  { 
    DEBUG('['+msg+'] Closing the main window...'); 
    mainWindow.hide(); 
    mainWindow.close(); 
    mainWindow = null; 
  };
  setTimeout(() => { process.exit(0); }, 5000);
}

app.on('window-all-closed', function() { Finish('app::window-all-closed'); app.quit(); }); // also on MAC OS X?

// if (process.platform != 'darwin') // 

app.on('before-quit', function() { Finish('app::before-quit'); });
app.on('will-quit', function() { Finish('app::will-quit'); });

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
      {
        label: 'Index',
        click: function(item, focusedWindow) {
//      console.log(focusedWindow);
          if (focusedWindow) {
            focusedWindow.loadURL(`file://${ __dirname}/` + settings.getWithDefault("index_url"));
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
  var menu = Menu.getApplicationMenu();

  if( menu ) {
    Menu.buildFromTemplate(template).items.forEach((val, index) => {
      // console.log(`${index}: ${val}`);
      menu.append(val);
    });
  } else { menu = Menu.buildFromTemplate(template); }

  Menu.setApplicationMenu(menu);
};

var signals = {
  'SIGINT': 2,
  'SIGTERM': 15
};

function shutdown(signal, value) {
  DEBUG('shutdown(signal: ' + signal + ', value: ' + value + ')...'); //  DEBUG('Kiosk stopped due to [' + signal + '] signal');
//    app.quit();
  process.exit(128 + value);
}

Object.keys(signals).forEach(function (signal) {
  process.on(signal, function () {
    shutdown(signal, signals[signal]);
  });
});

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

   // Emitted when the window is closed.
   mainWindow.on('closed', function() {
     // Dereference the window object, usually you would store windows
     // in an array if your app supports multi windows, this is the time
     // when you should delete the corresponding element.
     Finish('mainWindow::closed');
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



}

});