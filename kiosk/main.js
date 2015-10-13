global.shellStartTime = Date.now();

var app = require('app'); // Module to control application life.

//// http://peter.sh/experiments/chromium-command-line-switches/

/// --enable-pinch --flag-switches-begin 
//--enable-experimental-canvas-features --enable-gpu-rasterization --javascript-harmony --enable-touch-editing --enable-webgl-draft-extensions --enable-experimental-extension-apis --ignore-gpu-blacklist --show-fps-counter --ash-touch-hud --touch-events=enabled
// --flag-switches-end

app.commandLine.appendArgument('--ignore-gpu-blacklist');
app.commandLine.appendArgument('--enable-gpu');
app.commandLine.appendArgument('--enable-webgl');

app.commandLine.appendArgument('--enable-pinch');
app.commandLine.appendArgument('--enable-unsafe-es3-apis');
app.commandLine.appendArgument('--disable-gpu-sandbox');
app.commandLine.appendArgument('--enable-experimental-canvas-features');
app.commandLine.appendArgument('--enable-gpu-rasterization');
app.commandLine.appendArgument('--javascript-harmony');
app.commandLine.appendArgument('--enable-touch-editing');

app.commandLine.appendArgument('--enable-webgl-draft-extensions');
app.commandLine.appendArgument('--enable-webgl-image-chromium');
app.commandLine.appendArgument('--enable-subscribe-uniform-extension');

app.commandLine.appendArgument('--enable-experimental-extension-apis');
app.commandLine.appendArgument('--show-fps-counter');
app.commandLine.appendArgument('--ash-touch-hud');
app.commandLine.appendArgument('--touch-events=enabled');


app.commandLine.appendArgument('--auto');
app.commandLine.appendArgument('--ash-enable-touch-view-testing');

app.commandLine.appendArgument('--blacklist-accelerated-compositing');

app.commandLine.appendArgument('--compensate-for-unstable-pinch-zoom');
app.commandLine.appendArgument('--enable-touch-drag-drop');
app.commandLine.appendArgument('--enable-touchview');
app.commandLine.appendArgument('--enable-viewport');
// app.commandLine.appendArgument('--touch-events');

//https://github.com/atom/electron/issues/1277
//https://bugs.launchpad.net/ubuntu/+source/chromium-browser/+bug/1463598
//https://code.google.com/p/chromium/issues/detail?id=121183
// app.commandLine.appendArgument('disable-gpu-sandbox');
// app.commandLine.appendArgument('ignore-gpu-blacklist');

// app.commandLine.appendArgument('enable-pinch');
app.commandLine.appendArgument('--flag-switches-begin');

app.commandLine.appendArgument('--enable-pinch');
app.commandLine.appendArgument('--enable-unsafe-es3-apis');
app.commandLine.appendArgument('--disable-gpu-sandbox');
app.commandLine.appendArgument('--ignore-gpu-blacklist');
app.commandLine.appendArgument('--enable-experimental-canvas-features');
app.commandLine.appendArgument('--enable-gpu-rasterization');
app.commandLine.appendArgument('--javascript-harmony');
app.commandLine.appendArgument('--enable-touch-editing');

app.commandLine.appendArgument('--enable-webgl-draft-extensions');
app.commandLine.appendArgument('--enable-webgl-image-chromium');
app.commandLine.appendArgument('--enable-subscribe-uniform-extension');

app.commandLine.appendArgument('--enable-experimental-extension-apis');
app.commandLine.appendArgument('--show-fps-counter');
app.commandLine.appendArgument('--ash-touch-hud');
app.commandLine.appendArgument('--touch-events=enabled');

app.commandLine.appendArgument('--enable-gpu');
app.commandLine.appendArgument('--enable-webgl');

app.commandLine.appendArgument('--auto');
app.commandLine.appendArgument('--ash-enable-touch-view-testing');

app.commandLine.appendArgument('--blacklist-accelerated-compositing');

app.commandLine.appendArgument('--compensate-for-unstable-pinch-zoom');
app.commandLine.appendArgument('--enable-touch-drag-drop');
app.commandLine.appendArgument('--enable-touchview');
app.commandLine.appendArgument('--enable-viewport');
// app.commandLine.appendArgument('--touch-events');

// --touch-devices ::  xinput list
//// --material-hybrid  --touch-calibration

app.commandLine.appendArgument('--flag-switches-end');


// app.commandLine.appendSwitch('remote-debugging-port', '8315');
// app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1');


var crashReporter = require('crash-reporter');
crashReporter.start(); // Report crashes to our server: productName: 'Kiosk', companyName: 'IMAGINARY'???

// var nslog = require('nslog');
// console.log = nslog;
process.on('uncaughtException', function(error) { // '='? '{}'?
   console.log('uncaughtException! :(');
   console.log(error);
});  

// var path = require('path');

var BrowserWindow = require('browser-window'); // Module to create native browser window.

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() { app.quit(); }); // also on MAC OS X?
// if (process.platform != 'darwin') // ?

console.log(process.argv); // [1..]; // ????

var yargs = require('yargs'); // https://www.npmjs.com/package/yargs

var options = yargs.wrap(yargs.terminalWidth())
.alias('h', 'help').boolean('h').describe('h', 'Print this usage message.')
.alias('v', 'version').boolean('v').describe('v', 'Print the version.')
.alias('d', 'dev').boolean('d').describe('d', 'Run in development mode.')
.alias('l', 'url').string('l').default('l', 'file://' + __dirname + '/index.html')
.usage('Kiosk\n    Usage: kiosk [options]' );

var args = options.argv;

if(args.help){ process.stdout.write(options.help()); process.exit(0); };
if(args.version){ process.stdout.write(app.getVersion()); process.stdout.write('\n'); process.exit(0); };

var url = args.url;
console.log(url);

var Menu = require('menu'); var MenuItem = require('menu-item');
var menu = Menu.getApplicationMenu();
if( !menu )
{
var template = [
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
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
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
            focusedWindow.loadUrl('file://' + __dirname + '/index.html');
        }
    }
  },
  {
        label: 'Learn More',
        click: function(item, focusedWindow) { 
          if (focusedWindow) {
           focusedWindow.loadUrl('https://github.com/malex984/dockapp/tree/master/kiosk'); 
        // require('shell').openExternal('https://github.com/malex984/dockapp/tree/master/kiosk') ;
           }
        }
  },
 ] 
 }
];

  menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() 
{   

//   var screen = require('screen');
//   var size = screen.getPrimaryDisplay().workAreaSize;
//       width: size.width, height: size.height,
   
   // Create the browser window.   
   mainWindow = new BrowserWindow({
    show: false, x: 0, y: 0,
    'accept-first-mouse': true,
    'always-on-top': true,
    width: 1024, height: 768,
    resizable: true,
    frame: true,
    kiosk: false,
    fullscreen: true,
    'web-preferences': { 
       'web-security': false,
       'javascript': true,
       'images': true,
       'webaudio': true,
       'plugins': true,
       'webgl': true,
       'java': true,
       'overlay-fullscreen-video': true,
       'experimental-features': true,       
       'experimental-canvas-features': true
    }
   });
//    type: 'desktop',    'standard-window': true,
//    fullscreen: true,    frame: false,    kiosk: true,     resizable: false,    'always-on-top': true,    'auto-hide-menu-bar': true,    'title-bar-style': 'hidden' 
   // TODO: Switch to kiosk mode upon some option?!
   
   // Emitted when the window is closed.
   mainWindow.on('closed', function() {
     // Dereference the window object, usually you would store windows
     // in an array if your app supports multi windows, this is the time
     // when you should delete the corresponding element.
     mainWindow = null;
   });
   
//   mainWindow.webContents.on('new-window', function(event, url) { event.preventDefault(); });

//   mainWindow.on('app-command', function(e, cmd) {
//      // Navigate the window back when the user hits their mouse back button
//      if (cmd === 'browser-backward' && mainWindow.webContents.canGoBack()) { mainWindow.webContents.goBack(); }
//   });

   // and load some URL?!
   mainWindow.loadUrl(url);

  // Open the DevTools?
  if(args.dev){ mainWindow.openDevTools(); }

  mainWindow.show();
});
