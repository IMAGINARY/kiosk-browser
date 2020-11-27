const {app} = require('electron');
const settingsPath = app.getPath('userData');
const fsExtra = require('fs-extra');
const path = require('path');
const hjson = require('hjson');

const { logger } = require('./logging');

// read defaults.json
const defaultsFileContents = fsExtra.readFileSync(path.join(__dirname, '../../json/defaults.json'), 'utf8');
const defaults = hjson.parse(defaultsFileContents);

// ensure that the directory for the settings actually exists
fsExtra.ensureDirSync(settingsPath);

// read the settings file or create it if it does not exist
const settingsFilePath = path.join(settingsPath, 'Settings');
const settingsFileContents = (() => {
    if (fsExtra.existsSync(settingsFilePath)) {
        // just read the settings file
        return fsExtra.readFileSync(settingsFilePath, 'utf8');
    } else {
        // create a new settings file with just comments based on the default settings
        const regex = /^(\s*)([^{}])/gm;
        const settingsDefaultFileContents = defaultsFileContents.replace(regex, "$1// $2");
        fsExtra.writeFileSync(settingsFilePath, settingsDefaultFileContents, 'utf8');
        return settingsDefaultFileContents;
    }
})();

// parse the settings
const settings = hjson.parse(settingsFileContents);

// overwrite defaults
const settingsWithDefault = Object.assign(defaults, settings);

module.exports = settingsWithDefault;
