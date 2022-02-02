const domReady = new Promise((resolve) => {
  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    resolve();
  } else {
    window.addEventListener('DOMContentLoaded', () => resolve());
  }
});

module.exports = domReady;
