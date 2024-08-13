const path = require('path');
const insertCssIntoWebFrame = require('../renderer/src/insertCssIntoWebFrame');

insertCssIntoWebFrame
  .fromFile(path.join(__dirname, '../../css/disable-selection.css'))
  .then();
