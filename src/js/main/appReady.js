const fs = require('fs');
const path = require('path');
const {BrowserWindow, Menu, MenuItem} = require('electron');

const {logger} = require(path.join(__dirname, 'logging.js'));
const preloadModules = require(path.join(__dirname, 'preloadModules.js'));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
global.mainWindow = null;

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

function compareRectangles(r1, r2) {
    return r1.x === r2.x
        && r1.y === r2.y
        && r1.width === r2.width
        && r1.height === r2.height;
}

function computeDisplayCover(displayNums, fullscreen) {
    const {screen} = require('electron');
    const allDisplays = screen.getAllDisplays();

    if (!Array.isArray(displayNums) || displayNums.length === 0) {
        displayNums = [0];
    } else {
        // keep only display nums that are not out of range
        displayNums = displayNums.map(n => Math.min(n, allDisplays.length - 1));
    }

    if (displayNums.length > 1) {
        for (let n = 0; n < displayNums.length; ++n) {
            const {bounds, workArea} = allDisplays[displayNums[n]];
            if (!compareRectangles(bounds, workArea))
                logger.warn("Work area of display %i differs from bounds. Expect incomplete display coverage. (%o vs. %o)", n, workArea, bounds);
        }
    }
    return joinRectangles(displayNums.map(n => fullscreen ? allDisplays[n].bounds : allDisplays[n].workArea));
}

/***
 * Computes the bounds the window will have when it goes to fullscreen on the current display.
 * @param window The window to compute the fullscreen bounds for.
 * @returns {Electron.Rectangle} The bounds the window would have in full screen mode.
 */
function computeFullscreenBounds(window) {
    const {screen} = require('electron');
    return screen.getDisplayMatching(window.getBounds()).bounds;
}

/***
 * Fixed the windows min, max and content size to the specified bounds.
 * This works around a bug in Chrome that causes the window size being 1px off in certain situations, e.g.
 * when no X11 window manager is present on Linux.
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=478133
 * @param window
 * @param bounds
 */
function fixWindowSize(window, bounds) {
    logger.debug("Initial content bounds: %o", window.getContentBounds());

    const oldMin = window.getMinimumSize();

    window.setMinimumSize(bounds.width, bounds.height);

    window.setBounds(bounds);
    window.setContentBounds(bounds);

    window.setMinimumSize(oldMin[0], oldMin[1]);

    logger.debug("Fixed content bounds:   %o", window.getContentBounds());
}

function setOverlayVisible(webContents, visible) {
    const display = visible ? 'unset' : 'none';
    const jsCode = `document.documentElement.style.setProperty('--kiosk-drag-handle-display', '${display}');`;
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

function enableReloadingWhenUnresponsive(responsivenessCheck, reloadCallback, timeoutMs) {
    logger.debug('Will reload pages that are unresponsive for %ims', timeoutMs);
    let lastResponseMs = Date.now();
    setInterval(() => {
        const currentMs = Date.now();
        if (currentMs - lastResponseMs > timeoutMs) {
            logger.debug('Page unresponsive. Reloading.');
            // reload the page
            lastResponseMs = currentMs;
            reloadCallback();
        } else {
            // apply responsiveness check
            responsivenessCheck().then(() => {
                logger.debug('Page responsiveness test succeeded.');
                lastResponseMs = Date.now();
            });
        }
    }, 500);
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
        backgroundColor: args.transparent ? '#0fff' : '#fff',
        show: false,
        frame: !(args.transparent || args['cover-displays']),
        titleBarStyle: 'hidden',
        fullscreenWindowTitle: true,
        fullscreenable: true,
        resizable: !args.transparent,
        transparent: args.transparent,
        alwaysOnTop: args["always-on-top"],
        webPreferences: webprefs,
        acceptFirstMouse: true,
    };

    if (process.platform === 'linux')
        options.icon = path.resolve(__dirname, '../../../build/fallbackicon.png');

    global.mainWindow = createMainWindow(args, options);
    const responsivenessCheck = () => global.mainWindow.webContents.executeJavaScript('true;');
    const reloadCallback = () => {
        // create new window before the old one is destroyed to avoid window-all-closed event from being triggered
        const newWindow = createMainWindow(args, options);
        global.mainWindow.destroy();
        global.mainWindow = newWindow;
    };
    if (args['reload-unresponsive'])
        enableReloadingWhenUnresponsive(responsivenessCheck, reloadCallback, args['reload-unresponsive'] * 1000);

    // toggle developer tools on SIGUSR1
    logger.info('Send SIGUSR1 to PID %i to open developer Tools', process.pid);
    process.on('SIGUSR1', () => global.mainWindow.webContents.toggleDevTools());
}

function createMainWindow(args, options) {
    const mainWindow = new BrowserWindow(options);
    const webContents = mainWindow.webContents;

    const adjustWindowBounds = (() => {
        if (args['cover-displays']) {
            const displayCover = computeDisplayCover(args['cover-displays'], args.fullscreen);
            logger.debug('Trying to cover display area {}', displayCover);
            return () => fixWindowSize(mainWindow, displayCover);
        } else if (args.fullscreen) {
            const fullscreenBounds = computeFullscreenBounds(mainWindow);
            return () => fixWindowSize(mainWindow, fullscreenBounds);
        } else {
            return () => undefined; // NOOP
        }
    })();

    adjustWindowBounds();

    // open the developer tools now if requested
    if (args.dev)
        mainWindow.openDevTools();

    webContents.on('new-window', event => event.preventDefault());

    webContents.session.on('will-download', (event, item) => {
        logger.info('Preventing download of %s (%s, %i Bytes)', item.getURL(), item.getMimeType(), item.getTotalBytes());
        event.preventDefault();
    });

    mainWindow.once('ready-to-show', () => {
        if (args.kiosk)
            mainWindow.setKiosk(args.kiosk);

        if (args.fullscreen) {
            // setting this to false will also disable the fullscreen button on macOS, so better don't call it at all
            // if args.fullscreen is false
            mainWindow.setFullScreen(true);
        }

        adjustWindowBounds();

        // also adjust the zoom of the draggable area
        setZoomFactor(webContents, webContents.getZoomFactor());
        mainWindow.show();
    });

    if (args.fit.forceZoomFactor)
        mainWindow.on('resize', () => setZoomFactor(webContents, computeZoomFactor(mainWindow.getContentBounds(), args.fit, args.zoom)));

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
