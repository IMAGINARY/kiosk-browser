const fs = require('fs');
const path = require('path');
const {BrowserWindow, Menu, MenuItem} = require('electron');

const {logger} = require(path.join(__dirname, 'logging.js'));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function extendMenu(menu) {
    // add some entries to the supplied menu
    let windowMenuItem = menu.items.find(item => item.role === 'window');
    if (windowMenuItem === undefined) {
        windowMenuItem = new MenuItem({role: 'window', submenu: new Menu()});
        menu.append(windowMenuItem);
    }
    const windowSubmenu = windowMenuItem.submenu;
    windowSubmenu.insert(0, new MenuItem({
        label: 'Go forward one page',
        click: (menuItem, window) => window.webContents.goForward()
    }));
    windowSubmenu.insert(0, new MenuItem({
        label: 'Go back one page',
        click: (menuItem, window) => window.webContents.goBack()
    }));
    return menu;
}

/***
 * Tries to ensure that the window spans all available displays in fullscreen mode.
 * Also works around a bug in Chrome that causes a 1px wide frame around the window when no window manager is used.
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=478133
 * @param window
 * @todo Factor out the part the resizes the window to cover all available displays and make it configurable via the command line
 */
function fixFullscreenMode(window) {
    const {screen} = require('electron');

    const size = screen.getPrimaryDisplay().bounds;

    let _x = size.x;
    let _y = size.y;
    let _r = _x + size.width;
    let _b = _y + size.height;
    const displays = screen.getAllDisplays();
    for (let d in displays) {
        const _d = displays[d].bounds;

        _x = Math.min(_x, _d.x);
        _y = Math.min(_y, _d.y);
        _r = Math.max(_r, _d.x + _d.width);
        _b = Math.max(_b, _d.y + _d.height);
    }

    logger.debug('MAX SCREEN: (' + _x + ' , ' + _y + ') - (' + _r + ' , ' + _b + ')!');

    window.setMinimumSize(_r - _x, _b - _y);
    window.setMinimumSize(_r - _x, _b - _y);
    window.setContentSize(_r - _x, _b - _y);

    window.setFullScreen(true);

    window.maximize();
}

function handleFailedLoad(mainWindow, errorCode, errorDescription, validatedUrl, retry) {
    const ignoredErrorCodes = [-3, 0];
    if (!ignoredErrorCodes.includes(errorCode)) {
        const errorPageUrl = new URL('file://' + path.join(__dirname, '/../..', 'html/error.html'));
        errorPageUrl.searchParams.set('errorCode', errorCode);
        errorPageUrl.searchParams.set('errorDescription', errorDescription);
        errorPageUrl.searchParams.set('validatedUrl', validatedUrl);
        errorPageUrl.searchParams.set('retry', retry);
        logger.warn("Unable to load %s (Error %i: %s)", validatedUrl, errorCode, errorDescription);
        mainWindow.loadURL(errorPageUrl.href);
    }
}

function computeZoomFactor(newBounds, fit, zoom) {
    if (fit.forceZoomFactor) {
        let zoomFactor = Number.MAX_VALUE;
        if (fit.width !== '_') {
            zoomFactor = Math.min(zoomFactor, newBounds.width / fit.width);
        }
        if (fit.height !== '_') {
            zoomFactor = Math.min(zoomFactor, newBounds.height / fit.height);
        }
        return zoomFactor * zoom;
    } else {
        return zoom;
    }
}

function appReady(args) {
    // either disable default menu (noop on macOS) or set custom menu (based on default)
    Menu.setApplicationMenu(args.menu && !args.kiosk ? extendMenu(Menu.getApplicationMenu()) : null);

    const webprefs = {
        plugins: true,
        webSecurity: false,
        experimentalFeatures: true,
        allowRunningInsecureContent: true,
        zoomFactor: computeZoomFactor({width: 800, height: 600}, args.fit, args.zoom),
        nodeIntegration: args.integration,
    };

    if (args.preload)
        webprefs.preload = path.resolve(args.preload);

    const options = {
        show: false,
        frame: !args.transparent,
        titleBarStyle: 'hidden',
        fullscreenWindowTitle: true,
        fullscreenable: true,
        kiosk: args.kiosk,
        resizable: !args.transparent,
        transparent: args.transparent,
        alwaysOnTop: args["always-on-top"],
        webPreferences: webprefs,
        acceptFirstMouse: true,
    };
    if (process.platform === 'linux')
        options.icon = path.resolve(__dirname, '../../../build/48x48.png');

    mainWindow = new BrowserWindow(options);
    const webContents = mainWindow.webContents;

    // open the developers now if requested or toggle them when SIGUSR1 is received
    if (args.dev)
        mainWindow.openDevTools();
    process.on('SIGUSR1', () => webContents.toggleDevTools());

    webContents.on('new-window', event => event.preventDefault());

    webContents.session.on('will-download', (event, item) => {
        logger.info('Preventing download of %s (%s, %i Bytes)', item.getURL(), item.getMimeType(), item.getTotalBytes());
        event.preventDefault();
    });

    mainWindow.once('ready-to-show', () => {
        if (args.fullscreen) {
            // setting this to false will also disable the fullscreen button on macOS, so better don't call it at all
            // if args.fullscreen is false
            mainWindow.setFullScreen(true);

            // work around a fullscreen-related bug imn Chrome on Linux when no window manager is used
            if (process.platform === 'linux')
                fixFullscreenMode(mainWindow);
        }
        mainWindow.show();
    });

    if (args.fit.forceZoomFactor)
        mainWindow.on('resize', (event, newBounds) => webContents.setZoomFactor(computeZoomFactor(mainWindow.getContentBounds(), args.fit, args.zoom)));


    /***
     * Work around a Chrome bug that caches previously used zoom factors on a per page basis
     * @see https://github.com/electron/electron/issues/10572
     */
    webContents.on('did-finish-load', () => webContents.setZoomFactor(computeZoomFactor(mainWindow.getContentBounds(), args.fit, args.zoom)));

    /***
     * Add a handle for dragging the frameless window.
     */
    const appRegionOverlayCss = fs.readFileSync(path.join(__dirname, '../../css/app-region-overlay.css'), 'utf8');
    webContents.on('did-finish-load', () => webContents.insertCSS(appRegionOverlayCss));

    /***
     * Display error on failed page loads and reload the page after a certain delay if requested.
     */
    webContents.on('did-fail-load', (e, code, desc, url) => handleFailedLoad(mainWindow, code, desc, url, args.retry));

    /***
     * Load the page into the main window
     */
    mainWindow.loadURL(args.url);

    return mainWindow;
}

module.exports = appReady;
