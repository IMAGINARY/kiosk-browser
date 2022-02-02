const path = require('path');
const insertCssIntoWebFrame = require('./insertCssIntoWebFrame');

insertCssIntoWebFrame.fromFile(
  path.join(__dirname, '../../css/disable-selection.css')
);
