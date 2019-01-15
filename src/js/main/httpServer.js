const finalhandler = require('finalhandler');
const http = require('http');
const path = require('path');
const portfinder = require('portfinder');
const serveStatic = require('serve-static');

const {logger} = require(path.join(__dirname, 'logging.js'));

// reference to server needs to be kept to avoid garbage collecting
let server;

/**
 * Initializes a HTTP server on an internally chosen port to serve wwwRootDir.
 * @param wwwRootDir The directory that will be served via HTTP.
 * @returns {Promise<string | never>} A promise that resolves to the URL of the server (typically http://localhost:port).
 */
function init(wwwRootDir) {
    return portfinder.getPortPromise()
        .then(port => {
            // `port` is guaranteed to be a free port in this scope.
            // -> start HTTP server on that port

            // Serve up folder provided via CLI option
            const serve = serveStatic(path.resolve(wwwRootDir), {'index': ['index.html', 'index.htm']});

            // Create server
            server = http.createServer(function onRequest(req, res) {
                serve(req, res, finalhandler(req, res))
            });

            // Do something about errors
            server.on('error', err => {
                throw err;
            });

            const host = 'localhost';
            const urlPrefix = `http://${host}:${port}/`;

            // Listen
            server.listen(port, host);

            logger.info('Serving %s at %s', wwwRootDir, urlPrefix);

            return urlPrefix;
        });
}

module.exports = {init: init};
