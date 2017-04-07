const redis = require("redis");

// TODO: configuration with env variables
const client = redis.createClient('//127.0.0.1:6379');

module.exports = client;
// let msg_count = 0;

// client.set('pool', 'task1');
// client.hmset("hosts", "mjr", "1", "another", "23", "home", "1234");
// client.hmset("pool-test", {"name": "kaka"});
// client.hgetall("pool-test", function (err, obj) {
// 	console.dir(obj);
// });
//
// client.on("message", function (channel, message) {
// 	console.log("sub channel " + channel + ": " + message);
// 	msg_count += 1;
// 	if (msg_count === 3) {
// 		client.unsubscribe();
// 		client.quit();
// 	}
// });
//
// client.subscribe("crawler");

// client.quit();
