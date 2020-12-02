const finalhandler = require('finalhandler');
const http = require('http');
const path = require('path');
const portfinder = require('portfinder');
const serveStatic = require('serve-static');

const { logger } = require('./logging');

const servers = [];

/**
 * Initializes a HTTP server on an internally chosen port to serve wwwRootDir.
 * @param wwwRootDir The directory that will be served via HTTP.
 * @returns {Promise<string | never>} A promise that resolves to the URL of the server (typically http://localhost:port).
 */
async function init(wwwRootDir) {
  const port = await portfinder.getPortPromise();
  // `port` is guaranteed to be a free port in this scope (or until next await).

  // Serve up folder provided via CLI option
  const absoluteWwwRootDir = path.resolve(process.cwd(), wwwRootDir);
  const serve = serveStatic(absoluteWwwRootDir, { 'index': ['index.html', 'index.htm'] });

  // Create server
  const server = http.createServer(function onRequest(req, res) {
    const errorHandler = err => logger.warn('HTTP %i, %s', err.statusCode, err.message);
    serve(req, res, finalhandler(req, res, { onerror: errorHandler }));
  });

  const host = 'localhost';
  const urlPrefix = `http://${host}:${port}/`;

  // Error handling is a bit convoluted because the server uses a mix of callbacks and event handlers
  const listen = async (port, host) => {
    await new Promise((resolve, reject) => {
      const resolveWrapper = (...args) => {
        server.off('error', reject);
        return resolve(...args);
      };
      server.once('error', reject);
      server.listen(port, host, resolveWrapper);
    });
  };

  // Listen
  await listen(port, host);

  // Keep reference to the server to avoid garbage collection
  servers.push(server);

  // Do something about errors occurring after initialization
  server.on('error', err => logger.error('Error in built-in HTTP server: %O', err));

  logger.info('Serving %s at %s', wwwRootDir, urlPrefix);

  return urlPrefix;
}

module.exports = { init };
