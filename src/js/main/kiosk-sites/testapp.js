const { screen } = require('electron');

const screenWrapper = {
  getPrimaryDisplay: () => screen.getPrimaryDisplay(),
  getAllDisplays: () => screen.getAllDisplays(),
};

module.exports = {
  screen: screenWrapper,
};
