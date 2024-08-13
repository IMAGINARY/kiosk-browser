import path from 'path';

const preloadModules = [
  path.join(__dirname, '../preload/addAppVersion.js'),
  path.join(__dirname, '../preload/gamepadInputDetector.js'),
  path.join(__dirname, '../preload/midiInputDetector.js'),
];

export default preloadModules;
