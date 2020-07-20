const path = require('path');
const insertCssIntoWebFrame = require('./insertCssIntoWebFrame.js');

insertCssIntoWebFrame.fromFile(path.join(__dirname, '../../css/disable-selection.css'));
