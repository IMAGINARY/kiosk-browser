import { screen } from 'electron';

const screenWrapper = {
  getPrimaryDisplay: () => screen.getPrimaryDisplay(),
  getAllDisplays: () => screen.getAllDisplays(),
};

const testapp = {
  screen: screenWrapper,
};
export default testapp;
