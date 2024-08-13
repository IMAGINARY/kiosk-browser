import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        // TODO: automatically generate this list through globbing
        // see https://rollupjs.org/configuration-options/#input
        entry: {
          'index': 'src/preload/index.ts',
          'preload': 'src/preload/preload.js',
          'addAppVersion': 'src/preload/addAppVersion.js',
          'disableDrag': 'src/preload/disableDrag.js',
          'disableSelection': 'src/preload/disableSelection.js',
          'gamepadInputDetector': 'src/preload/gamepadInputDetector.js',
          'hideCursor': 'src/preload/hideCursor.js',
          'midiInputDetector': 'src/preload/midiInputDetector.js',
          'kiosk-sites/home': 'src/preload/kiosk-sites/home.js',
          'kiosk-sites/testapp': 'src/preload/kiosk-sites/testapp.js',
        },
      },
    },
  },
  renderer: {
    build: {
      rollupOptions: {
        input: [
          '\\src\\renderer\\index.html',
          // TODO: automatically generate this list through globbing
          // see https://rollupjs.org/configuration-options/#input
          'src/renderer/error.html',
          'src/renderer/home.html',
          'src/renderer/sound-test.html',
          'src/renderer/testapp.html',
        ],
      },
    },
  },
});
