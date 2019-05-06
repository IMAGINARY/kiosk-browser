// Preload the modules by path supplied to the main process
const path = require('path');
const {remote} = require('electron');
const preloadModulesPaths = remote.require(path.join(__dirname, '../main/preloadModules.js'));
preloadModulesPaths.forEach(p => require(p));
