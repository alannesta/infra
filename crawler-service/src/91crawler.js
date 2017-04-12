const async = require('async');

const crawlerService = require('./service/crawler-service');
const miningService = require('./service/mining-service');
const createRedisConnection = require('./redis-connector');

// TODO: configuration with env variables
const pubClient = createRedisConnection('//127.0.0.1:6379');	// redis connection for GET/SET/PUB
const subClient = createRedisConnection('//127.0.0.1:6379');	// redis connection for subscribe
const logger = require('./service/logger');

subClient.subscribe('crawl-job');
// TODO: init freq map from persistence file?

subClient.on("message", function (channel, message) {
	crawlJob(function notify(err, result) {
		if (err) {
			console.log(err);
		}

		// !!! A client subscribed to one or more channels could not issue commands (GET, PUBLISH, SET)
		pubClient.publish('crawl-report', JSON.stringify(result));
		logger.debug('crawl results: ', result.length);
	});
});

function crawlJob(callback) {
	let urlPool = [];
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

