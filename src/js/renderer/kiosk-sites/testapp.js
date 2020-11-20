const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const remoteRequire = require('electron').remote.require;

const remote = remoteRequire(path.join(__dirname, '../../main/kiosk-sites/testapp.js'));


window.testapp = {
  screen: remote.screen,
  os,
  exec,
};
