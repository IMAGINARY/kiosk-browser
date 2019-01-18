const path = require('path');
const {app, BrowserWindow, Menu, MenuItem} = require('electron');

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

function appReady(settings, args, urlPrefix) {
    // either disable default menu (noop on macOS) or set custom menu (based on default)
    Menu.setApplicationMenu(args.menu && !args.kiosk ? extendMenu(Menu.getApplicationMenu()) : null);

    {
        const webprefs = {
            plugins: true,
            webSecurity: false,
            experimentalFeatures: true,
            allowRunningInsecureContent: true,
            zoomFactor: args.zoom,
            nodeIntegration: args.integration,
        };

        if (args.preload)
            webprefs.preload = path.resolve(args.preload);

        const options = {
            show: false,
            frame: !args.transparent,
            titleBarStyle: 'hidden-inset',
            fullscreenable: true,
            fullscreen: args.fullscreen,
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

        process.on('SIGUSR1', () => mainWindow.webContents.toggleDevTools());

        mainWindow.webContents.on('new-window', event => event.preventDefault());

        // In the main process.
        mainWindow.webContents.session.on('will-download', (event, item) => {
            logger.info("Trying to Download: ");
            logger.info(item.getFilename());
            logger.info(item.getMimeType());
            logger.info(item.getTotalBytes());
            item.cancel(); // Nope... this is a kiosk!
        });

        mainWindow.once('ready-to-show', () => {
            if (args.fullscreen)
                fixFullscreenMode(mainWindow);
            mainWindow.show();
            mainWindow.focus();
        });

        mainWindow.webContents.on('did-finish-load', () => mainWindow.webContents.setZoomFactor(args.zoom));

        // retry loading the page if it failed
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            if (errorCode === -3 || errorCode === 0)
                return;

            logger.warn(`Loading ${validatedURL} failed with Error ${errorCode}: ${errorDescription}`);
            let errorMsgDiv = `
            <div style="position:absolute;top:0;left:0;width: 100%;color: white;background-color: black;">
                Error ${errorCode}: ${errorDescription}<br />
                URL: ${validatedURL}<br />
        `;

            if (args.retry > 0)
                errorMsgDiv += `Reloading in ${args.retry}s`;

            errorMsgDiv += `</div>`;

            mainWindow.webContents.once('dom-ready', () => {
                mainWindow.webContents.executeJavaScript(`document.body.innerHTML += ${JSON.stringify(errorMsgDiv)};`);
                if (args.retry > 0) {
                    mainWindow.webContents.executeJavaScript(`setTimeout(()=>window.location.reload(),${args.retry * 1000});`);
                }
            });
        });

        // Open the DevTools?
        if (args.dev) {
            mainWindow.openDevTools();
        } // --remote-debugging-port=8315

        // and load some URL?!
        const partialUrl = (args._.length > 0) ? args._[0] : (args.url ? args.url : (args.serve ? 'index.html' : settings['home']));
        const parseUrl = require('url').parse;
        const parsedPartialUrl = parseUrl(partialUrl);
        logger.debug('%o', parsedPartialUrl);
        if (parsedPartialUrl.protocol === "kiosk:") {
            switch (parsedPartialUrl.hostname) {
                case 'home':
                    mainWindow.loadURL('file://' + path.normalize(`${__dirname}/../../html/index.html`));
                    break;
                case 'testapp':
                    mainWindow.loadURL('file://' + path.normalize(`${__dirname}/../../html/testapp.html`));
                    break;
                default:
                    logger.error(`Unknown kiosk:// url: ${partialUrl}`);
                    app.exit(-1);
            }
        } else {
            const fullUrl = parsedPartialUrl.protocol === null ? (args.serve ? urlPrefix + partialUrl : `file://${path.resolve(partialUrl)}`) : partialUrl;
            logger.debug(`urlPrefix: ${urlPrefix}`);
            logger.debug(`partialUrl: ${partialUrl}`);
            logger.debug(`Loading ${fullUrl}`);
            mainWindow.loadURL(fullUrl);
        }
    }

    return mainWindow;
}

module.exports = appReady;
