const { exec } = require('child_process');
const os = require('os');
const remoteRequire = require('@electron/remote').require;

const remote = remoteRequire('./kiosk-sites/testapp');

window.testapp = {
  screen: remote.screen,
  os,
  exec,
};
