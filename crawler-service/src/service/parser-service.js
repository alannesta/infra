var spawn = require('child_process').spawn;
var path = require('path');

var logger = require('../utils/logger');
var util = require('../utils/service-util');

var Parser = {
	spawnPhantomProcess: (pageUrl) => {
		var phantomProcess = spawn('phantomjs', [path.join(process.cwd(), 'utils/video-resolver-html5.js'), pageUrl]);
		logger.info(`Start resolving address from ${pageUrl}`);
		return phantomProcess;
	},

	resolveVideoUrl: (phantomProcess, options, callback) => {
		var status;
		var fileUrl;
		var parsedUrl;

		var timeout = true;		// timeout flag
		var STATUS = {
			0: 'SUCCESS',
			1: 'FAIL_OPENPAGE',
			2: 'VIDEO_NOT_FOUND',
			3: 'DAILY_LIMIT_REACHED',
		};

		phantomProcess.stdout.on('data', (data) => {
			logger.debug(`Phantom stdout: ${data}`);
		});
		phantomProcess.stderr.on('data', (data) => {
			logger.debug(`Phantom stderr: ${data}`);
			timeout = false;
			// data is a Buffer
			// TODO: It is very hacky here to communicate the final results through stderr
			if (data && data.indexOf('http') > -1) {
				// solution 1: flash player parser, remove line break '\n' at the end
				// fileUrl = decodeURIComponent(data).split('file=')[1].trim();

				// solution2 : html 5 parser
				fileUrl = data.toString().trim();
				parsedUrl = util.parseFileUrl(fileUrl);
				callback(null, parsedUrl);
				logger.info(`parse file url success: ${parsedUrl}`);
			} else {
				// phantomjs on prod have some different behaviour... Should not rely on stderr anyway
				// callback(new Error('Unable to understand result from phantom stderr'));
			}
		});

		phantomProcess.on('exit', (code, signal) => {
			timeout = false;
			status = STATUS[code];
			logger.info('phantom process exit with code: ' + code);

			if (signal) {
				logger.debug('phantom process terminated with signal: ' + signal);
			}
			// when exit normally (code 0), callback will be called already
			if (code !== 0 && signal !== 'SIGKILL') {
				callback(new Error(status || 'Fail to parse URL, PhantomJS seems not to responding...'));
			}
		});

		// 15s timeout
		setTimeout(function() {
			if (timeout) {
				logger.debug('15s timeout reached, trying to kill phantom');
				callback(new Error('Fail to parse URL, PhantomJS seems not to responding...'));
			}
			logger.info('kill/cleanup phantom process');
			// double kill, triple kill, monster kill, god like...
			phantomProcess.kill('SIGKILL');
			// phantomProcess = null;
		}, options.timeout || 15000);
	},
};

module.exports = Parser;
