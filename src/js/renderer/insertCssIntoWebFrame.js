const fsPromises = require('fs').promises;
const {webFrame} = require('electron');

const domReady = require('./domReady.js');

async function fromString(css) {
    await domReady;
    return webFrame.insertCSS(css, {cssOrigin: 'user'});
}

async function fromFile(path) {
    const css = await fsPromises.readFile(path, 'utf8');
    return await fromString(css);
}

module.exports = {
    fromFile: fromFile,
    fromString: fromString,
};
