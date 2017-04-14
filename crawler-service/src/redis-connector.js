const redis = require('redis');
const logger = require('./service/logger');


const getConnection = function(redisUrl) {
	var client = redis.createClient(redisUrl || process.env.REDIS_URL || '//127.0.0.1:6379', {
		retry_strategy: function(options) {
			logger.debug('Retry redis connection: ', options.attempt);

			// 5 mins
			if (options.total_retry_time > 1000 * 60 * 5) {
				// End reconnecting after a specific timeout and flush all commands with a individual error
				return logger.error('Redis: maximum retry time exhausted');
			}
			if (options.attempt > 5) {
				// End reconnecting with built in error
				return logger.error('Redis: maximum connection retry reached');
			}
			// reconnect after 1 minute
			return 1000 * 5;
		},
	});
	return client;
};

module.exports = getConnection;
// let msg_count = 0;

// client.set('pool', 'task1');
// client.hmset("hosts", "mjr", "1", "another", "23", "home", "1234");
// client.hmset("pool-test", {"name": "kaka"});
// client.hgetall("pool-test", function (err, obj) {
// 	console.dir(obj);
// });
//
// client2.on("message", function (channel, message) {
// 	console.log(message);
// });
//
// client2.subscribe("report");

// client.quit();
