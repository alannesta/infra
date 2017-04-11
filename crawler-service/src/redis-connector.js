const redis = require('redis');
const logger = require('./service/logger');

// TODO: configuration with env variables
//const client1 = redis.createClient('//127.0.0.1:6379');

const getConnection = function(redisUrl) {
	var client = redis.createClient(redisUrl || process.env.REDIS_URL || '//127.0.0.1:6379', {
		retry_strategy: function() {
			logger.error('redis connection failed');
			// do not retry
			return null;
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
