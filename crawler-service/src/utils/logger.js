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
				handleExceptions: true,
				humanReadableUnhandledException: true,
				stderrLevels: ['error'],	// this will affect pm2 logs on prod
			}),
			new (winston.transports.File)({
				filename: process.env.SERVER_LOG_FILE || path.join(os.homedir(), 'logs/crawler-service.log'),
				level: 'info',
				handleExceptions: true,
				humanReadableUnhandledException: true,
				json: false,
				maxsize: 500000,
			}),
		];
	} else if (env === 'docker') {
		// do not write to files on docker
		return [
			new (winston.transports.Console)({
				level: 'debug',
				handleExceptions: true,
				humanReadableUnhandledException: true,
				stderrLevels: ['error'],
			}),
		];
	}

	// local dev settings
	return [
		new (winston.transports.Console)({
			level: 'debug',
			handleExceptions: true,
			humanReadableUnhandledException: true,
			stderrLevels: ['error'],	// this will affect pm2 logs on prod
		}),
		new (winston.transports.File)({
			filename: path.join(os.homedir(), 'logs/crawler-service.log'),
			level: 'debug',
			handleExceptions: true,
			humanReadableUnhandledException: true,
			maxsize: 500000,
			json: false,
		}),
	];
}

module.exports = logger;
