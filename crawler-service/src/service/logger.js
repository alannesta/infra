const winston = require('winston');
const os = require('os');
const path = require('path');

const logger = new (winston.Logger)({
	transports: getTransportConfig(process.env.NODE_ENV),
});

function getTransportConfig(env) {
	if (env === 'production') {
		return [
			new (winston.transports.Console)({
				level: 'info',
				stderrLevels: ['error'],	// this will affect pm2 logs on prod
			}),
			new (winston.transports.File)({
				filename: process.env.SERVER_LOG_FILE || path.join(os.homedir(), 'logs/crawler-service.log'),
				level: 'info',
				maxsize: 500000,
			}),
		];
	} else if (env === 'docker') {
		// do not write to files on docker
		return [
			new (winston.transports.Console)({
				level: 'debug',
				stderrLevels: ['error'],
			}),
		];
	}

	// local dev settings
	return [
		new (winston.transports.Console)({
			level: 'debug',
			stderrLevels: ['error'],
		}),
		 new (winston.transports.File)({
		 	filename: path.join(os.homedir(), 'logs/crawler-service.log'),
		 	level: 'debug',
		 	handleExceptions: true,
		 	maxsize: 500000,
		 }),
	];
}

logger.flushAndExit = function(err) {
	logger.error(err, function() {
		var numFlushes = 0;
		var numFlushed = 0;
		Object.keys(logger.transports).forEach(function(k) {
			if (logger.transports[k]._stream) {
				numFlushes += 1;
				logger.transports[k]._stream.once('finish', function() {
					numFlushed += 1;
					if (numFlushes === numFlushed) {
						process.exit(1);
					}
				});
				logger.transports[k]._stream.end();
			}
		});
		if (numFlushes === 0) {
			process.exit(1);
		}
	});
};

module.exports = logger;
