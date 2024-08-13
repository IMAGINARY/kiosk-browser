import { app } from 'electron';
import fsExtra from 'fs-extra';
import path from 'path';
import json5 from 'json5';

const settingsPath = app.getPath('userData');

// read defaults.json5
import defaultsFileContents from '../json/defaults.json5?raw';
const defaults = json5.parse(defaultsFileContents);

// ensure that the directory for the settings actually exists
fsExtra.ensureDirSync(settingsPath);

// read the settings file or create it if it does not exist
const settingsFilePath = path.join(settingsPath, 'Settings');
const settingsFileContents = (() => {
  if (fsExtra.existsSync(settingsFilePath)) {
    // just read the settings file
    return fsExtra.readFileSync(settingsFilePath, 'utf8');
  }
  // create a new settings file with just comments based on the default settings
  const regex = /^(\s*)([^{}])/gm;
  const settingsDefaultFileContents = defaultsFileContents.replace(
    regex,
    '$1// $2',
  );
  fsExtra.writeFileSync(settingsFilePath, settingsDefaultFileContents, 'utf8');
  return settingsDefaultFileContents;
})();

// parse the settings
const settings = json5.parse(settingsFileContents);

// overwrite defaults
const settingsWithDefault = Object.assign(defaults, settings);

export default settingsWithDefault;
