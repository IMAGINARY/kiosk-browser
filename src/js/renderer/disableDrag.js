const path = require('path');
const insertCssIntoWebFrame = require('./insertCssIntoWebFrame');

insertCssIntoWebFrame.fromFile(
  path.join(__dirname, '../../css/disable-drag.css')
);

function isSelectedElement(elem) {
  return window.getSelection().containsNode(elem, true);
}

function isSelectionInFormField(elem) {
  return (
    document.activeElement === elem &&
    (elem.tagName === 'TEXTAREA' || elem.tagName === 'INPUT') &&
    elem.selectionStart !== elem.selectionEnd
  );
}

function preventDragOnSelection(event) {
  if (isSelectedElement(event.target) || isSelectionInFormField(event.target))
    event.preventDefault();
}

document.addEventListener('dragstart', preventDragOnSelection, true);
