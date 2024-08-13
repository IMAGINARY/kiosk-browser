const fsPromises = require('fs').promises;
const { webFrame } = require('electron');

const domReady = require('./domReady');

async function fromString(css) {
  await domReady;
  return webFrame.insertCSS(css);
}

async function fromFile(path) {
  const css = await fsPromises.readFile(path, 'utf8');
  return fromString(css);
}

module.exports = { fromFile, fromString };
