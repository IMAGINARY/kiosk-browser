global.shellStartTime = Date.now();

var app = require('app'); // Module to control application life.

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


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() 
{   
   var screen = require('screen');
   var size = screen.getPrimaryDisplay().workAreaSize;
   
   // Create the browser window.   
   mainWindow = new BrowserWindow({
    show: false,
    x: 0, y: 0, 
    width: size.width, height: size.height,
    fullscreen: true,
    frame: false, 
    kiosk: true, 
    resizable: false,
    type: 'desktop', 
    'always-on-top': true,
    'accept-first-mouse': true,
    'auto-hide-menu-bar': true, 
    'standard-window': true,
    'title-bar-style': 'hidden' 
   });
   
   // Emitted when the window is closed.
   mainWindow.on('closed', function() {
     // Dereference the window object, usually you would store windows
     // in an array if your app supports multi windows, this is the time
     // when you should delete the corresponding element.
     mainWindow = null;
   });
   
   mainWindow.webContents.on('new-window', function(event, url) { event.preventDefault(); });
  
   // and load some URL?!
   mainWindow.loadUrl(url);

  // Open the DevTools?
  if(args.dev){ mainWindow.openDevTools(); }

  mainWindow.show();
});
