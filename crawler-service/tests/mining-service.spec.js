const miningService = require('../src/service/mining-service');
var redis = require('redis');
var sinon = require('sinon');

var redisClientStub = sinon.stub(redis, 'createClient', function() {
	return {
		get: function(key, callback) {
			callback(null, {});
		},

		set: function(key, value, callback) {
			callback(null);
		},

		publish: function() {

		},

		subscribe: function() {

		},

		quit: function() {
			console.log('redis quit');
		}
	}
});

describe('mining service', () => {
	const rawInput = ['并不重复的文字', '大量重复的文字 QQ21431549', '大量重复的文字 QQ21441549', '无关内容 QQ21431549', 'abc 123 456', '风和日丽 QQ21431549', '(并不重复的文字)'];

	it('should dedupe without frequency map', () => {
		miningService.dedupeVideos(rawInput, function(err, result) {
			console.log(result);
		})
	});
});
