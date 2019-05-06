const winston = require('winston');
const {format} = winston;


// use the default logging for now
const logger = winston;

// log to console (stderr)
const stderrLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
const transportConfig = {
    stderrLevels: stderrLevels,
    format: format.combine(
        winston.format.splat(),
        winston.format.colorize(),
        winston.format.simple(),
    )
};
const consoleTransport = new winston.transports.Console(transportConfig);
logger.add(consoleTransport);

// uncaught exceptions should be handled elsewhere
logger.exitOnError = false;

function setLevelNumeric(levelNum) {
    const levels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
    levelNum = Math.max(0, Math.min(levelNum, levels.length - 1));
    setLevel(levels[levelNum]);
}

function setLevel(level) {
    logger.level = level;
}


module.exports = {logger: logger, setLevel: setLevel, setLevelNumeric: setLevelNumeric};