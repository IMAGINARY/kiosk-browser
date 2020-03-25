const fsPromises = require('fs').promises;
const path = require('path');
const {webFrame} = require('electron');

const domReady = new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve));
const cssPromise = fsPromises.readFile(path.join(__dirname, '../../css/disable-selection.css'), 'utf8');

domReady
    .then(() => cssPromise)
    .then(css => webFrame.insertCSS(css, {cssOrigin: 'user'}));
