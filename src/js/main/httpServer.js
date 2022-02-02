const finalhandler = require('finalhandler');
const http = require('http');
const path = require('path');
const serveStatic = require('serve-static');

const { logger } = require('./logging');

const minPort = 8000;
const servers = [];

/**
 * Initializes a HTTP server on an internally chosen port to serve wwwRootDir.
 * @param wwwRootDir The directory that will be served via HTTP.
 * @returns {Promise<string | never>} A promise that resolves to the URL of the server (typically http://localhost:port).
 */
async function init(wwwRootDir) {
  // Serve up folder provided via CLI option
  const absoluteWwwRootDir = path.resolve(process.cwd(), wwwRootDir);
  const serve = serveStatic(absoluteWwwRootDir, {
    index: ['index.html', 'index.htm'],
  });

  // Create server
  const server = http.createServer(function onRequest(req, res) {
    const errorHandler = (err) =>
      logger.warn('HTTP %i, %s', err.statusCode, err.message);
    serve(req, res, finalhandler(req, res, { onerror: errorHandler }));
  });

  const connect = async (server, port, host) => {
    return await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => {
        server.off('error', reject);
        resolve(server);
      });
    });
  };

  const host = 'localhost';
  let port = minPort;
  while (!server.listening) {
    try {
      await connect(server, port, host);
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        logger.debug(`Address in use ${host}:${port}, incrementing port...`);
        await new Promise((resolve) => server.close(resolve));
        port += 1;
      } else {
        throw err;
      }
    }
  }

  // Keep reference to the server to avoid garbage collection
  servers.push(server);

  // Do something about errors occurring after initialization
  server.on('error', (err) =>
    logger.error('Error in built-in HTTP server: %O', err)
  );

  const urlPrefix = `http://${host}:${port}/`;
  logger.info('Serving %s at %s', wwwRootDir, urlPrefix);

  return urlPrefix;
}

module.exports = { init };
