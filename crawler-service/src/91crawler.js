const async = require('async');

const crawlerService = require('./service/crawler-service');
const miningService = require('./service/mining-service');
const redisClient = require('./redis-connector');

// var logger = require('./utils/logger');

redisClient.subscribe('crawl-job');
// TODO: init freq map from persistence file?

redisClient.on("message", function (channel, message) {
	crawlJob(function notify(err, result) {
		if (err) {
			console.log(err);
		}
		// !!! A client subscribed to one or more channels could not issue commands (GET, PUBLISH, SET)
		// redisClient.publish('report', JSON.stringify(result));
		console.log(result.length);
	});
	// redisClient.quit();
});

function crawlJob(callback) {
	const urlPool = [];
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
		const dedupedTitles = miningService.dedupteVideos(fetchedVideos.map((video) => {
			return video['片名'];
		}));

		const dedupedVideos = fetchedVideos.filter((video) => {
			return dedupedTitles.indexOf(video['片名']) > -1;
		});

		// MQ notification
		//callback(null, fetchedVideos);
		callback(null, dedupedVideos);
	});


	function fetchVideo(url, callback) {
		console.log(url);
		crawlerService.crawl(url).then(function(videos){
			// TODO: dedupe
			fetchedVideos = fetchedVideos.concat(videos);
			callback(null);
			// dbService.save(videos, function(err, statistic) {
			// 	if (!err) {
			// 		logger.debug('fetching done for: ' + url);
			// 		crawlStatistic.added += statistic.added;
			// 		crawlStatistic.updated += statistic.updated;
			// 		callback(null);
			// 	}else {
			// 		callback(err);
			// 	}
			// });
		});
	}
}

