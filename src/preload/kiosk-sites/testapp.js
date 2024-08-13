import { exec } from 'child_process';
import os from 'os';
import { require as remoteRequire } from '@electron/remote';

const remote = remoteRequire('./kiosk-sites/testapp');

window.testapp = {
  screen: remote.screen,
  os,
  exec,
};
