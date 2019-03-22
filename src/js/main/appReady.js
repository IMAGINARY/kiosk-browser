const fs = require('fs');
const path = require('path');
const {BrowserWindow, Menu, MenuItem} = require('electron');

const {logger} = require(path.join(__dirname, 'logging.js'));
const preloadModules = require(path.join(__dirname, 'preloadModules.js'));

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

function joinRectangles(rectangles) {
    let l = Number.POSITIVE_INFINITY;
    let t = Number.POSITIVE_INFINITY;
    let r = Number.NEGATIVE_INFINITY;
    let b = Number.NEGATIVE_INFINITY;
    for (let rect of rectangles) {
        l = Math.min(l, rect.x);
        t = Math.min(t, rect.y);
        r = Math.max(r, rect.x + rect.width);
        b = Math.max(b, rect.y + rect.height);
    }
    return {x: l, y: t, width: r - l, height: b - t};
}

function computeDisplayCover(displayNums) {
    if (!Array.isArray(displayNums) || displayNums.length === 0)
        displayNums = [0];

    const {screen} = require('electron');
    const allDisplays = screen.getAllDisplays();
    const displayBounds = displayNums.map(n => allDisplays[Math.min(n, allDisplays.length - 1)].bounds);
    return joinRectangles(displayBounds);
}

/***
 * Fixed the windows min, max and content size to the current bounds.
 * This works around a bug in Chrome that causes a 1px wide frame around the window in fullscreen mode
 * when no window manager is used.
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=478133
 * @param window
 */
function fixFullscreenModeLinux(window) {
    const bounds = window.getBounds();
    window.setMinimumSize(bounds.width, bounds.height);
    window.setMaximumSize(bounds.width, bounds.height);
    window.setContentSize(bounds.width, bounds.height);
}

function setOverlayVisible(webContents, visible) {
    const display = visible ? 'unset' : 'none';
    const jsCode = `document.documentElement.style.setProperty('--kiosk-drag-handle-display', '${display}');`
    webContents.executeJavaScript(jsCode)
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

function setZoomFactor(webContents, zoomFactor) {
    zoomFactor = Math.max(0.25, Math.min(zoomFactor, 5.0));
    webContents.setZoomFactor(zoomFactor);
    if (process.platform === 'darwin') {
        const jsCode = `document.documentElement.style.setProperty('--kiosk-zoom', ${zoomFactor});`;
        webContents.executeJavaScript(jsCode);
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
        preload: path.join(__dirname, '../renderer/preload.js')
    };

    if (args.preload)
        preloadModules.push(path.resolve(args.preload));

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
        options.icon = path.resolve(__dirname, '../../../build/fallbackicon.png');

    mainWindow = new BrowserWindow(options);
    const webContents = mainWindow.webContents;

    if (args['cover-displays']) {
        const displayCover = computeDisplayCover(args['cover-displays']);
        logger.debug('Trying to cover display area {}', displayCover);
        mainWindow.setBounds(displayCover);
    }

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
                fixFullscreenModeLinux(mainWindow);
        }
        // also adjust the zoom of the draggable area
        setZoomFactor(webContents, webContents.getZoomFactor());
        mainWindow.show();
    });

    if (args.fit.forceZoomFactor)
        mainWindow.on('resize', (event, newBounds) => setZoomFactor(webContents, computeZoomFactor(mainWindow.getContentBounds(), args.fit, args.zoom)));

    /***
     * Add a handle for dragging windows on macOS due to hidden title bar.
     */
    if (process.platform === 'darwin') {
        const appRegionOverlayCss = fs.readFileSync(path.join(__dirname, '../../css/app-region-overlay.css'), 'utf8');
        webContents.on('dom-ready', () => {
            webContents.insertCSS(appRegionOverlayCss);
            setOverlayVisible(webContents, !mainWindow.isFullScreen());
        });

        /***
         * Hide handle in fullscreen mode.
         */
        mainWindow.on('enter-full-screen', () => setOverlayVisible(webContents, !mainWindow.isFullScreen()));
        mainWindow.on('leave-full-screen', () => setOverlayVisible(webContents, !mainWindow.isFullScreen()));
    }

    /***
     * Work around a Chrome bug that caches previously used zoom factors on a per page basis
     * @see https://github.com/electron/electron/issues/10572
     */
    webContents.on('dom-ready', () => setZoomFactor(webContents, computeZoomFactor(mainWindow.getContentBounds(), args.fit, args.zoom)));

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
