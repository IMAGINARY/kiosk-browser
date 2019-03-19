// Add the version of the kiosk browser to process.versions
const {remote} = require('electron');
process.versions.app = remote.app.getVersion();
