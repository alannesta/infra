const async = require('async');

const crawlerService = require('./service/crawler-service');
const miningService = require('./service/mining-service');
const parserService = require('./service/parser-service');
const createRedisConnection = require('./redis-connector');

const subClient = createRedisConnection();	// redis connection for subscribe
const logger = require('./utils/logger');

subClient.subscribe('crawl-job');
subClient.subscribe('parse-job');
// TODO: init freq map from persistence file?

subClient.on("message", function (channel, message) {
	let pubClient = createRedisConnection();
	if (channel === 'crawl-job') {
		crawlJob(function notify(err, result) {
			if (err) {
				return logger.error(err);
			}
			// !!! A client subscribed to one or more channels could not issue commands (GET, PUBLISH, SET)
			pubClient.publish('crawl-report', JSON.stringify(result));
			pubClient.quit();
			logger.debug('crawl results: ', result.length);
		});
	} else if (channel === 'parse-job') {
		let process = parserService.spawnPhantomProcess(message);
		parserService.resolveVideoUrl(process, {}, (err, result) => {
			if (err) {
				pubClient.quit();
				return logger.error(err);
			}
			pubClient.publish('parse-report', result);
			pubClient.quit();
			logger.debug('parse results: ', result);
		});
	}

});

function crawlJob(callback) {
	let urlPool = [ ];
	let fetchedVideos = [];

	const crawlStatistic = {
		added: 0,
		updated: 0
	};

	async.eachSeries(urlPool, fetchVideo, function(err) {
		if (err) {
			// logger.error('Main::aynsc series task err -> ', err);
			callback(err);
			// process.exit(err);
		}

		miningService.dedupeVideos(fetchedVideos.map((video) => {
			return video['片名'];
		}), function dedupeCB(err, dedupedTitles) {
			const dedupedVideos = fetchedVideos.filter((video) => {
				return dedupedTitles.indexOf(video['片名']) > -1;
			});
			callback(null, dedupedVideos);
		});
	});


	function fetchVideo(url, callback) {
		logger.debug('start crawling: ', url);
		crawlerService.crawl(url).then(function(videos){
			// TODO: dedupe
			fetchedVideos = fetchedVideos.concat(videos);
			callback(null);
		});
	}
}

