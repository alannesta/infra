const miningService = require('../src/service/mining-service');
var redis = require('redis');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('mining service suite1: start without frequent map, update map as we go', () => {

	let freqMap = {};	// mock redis in mem store
	// mock redis createClient
	var redisClientStub = sinon.stub(redis, 'createClient', function() {
		return {

			get: function(key, callback) {
				if (key === 'frequency-map') {
					callback(null, freqMap);
				} else {
					callback(null);
				}
			},

			set: function(key, value, callback) {
				if (key === 'frequency-map') {
					console.log('set map: ',value);
					freqMap = value;
				}

				callback(null);
			},

			publish: function() {},

			subscribe: function() {},

			quit: function() {
				console.log('redis quit');
			}
		}
	});

	it('should dedupe without frequency map', () => {

		const original = ['并不重复的文字', '大量重复的文字 QQ21431549', '大量重复的文字 (QQ31441549)', '无关内容 QQ21431549', 'abc 123 456', '风和日丽 QQ21431549', '(并不重复的文字)'];

		miningService.dedupeVideos(original, function(err, result) {
			// console.log(result);
			expect(result).to.deep.equal(['并不重复的文字', '大量重复的文字 QQ21431549', '无关内容 QQ21431549', 'abc 123 456', '风和日丽 QQ21431549'])
		})
	});

	it('should dedupe with updated frequency map in memeory', () => {
		// freq words reach threshold 5
		const original = ['大量重复的文字 QQ21431549 上部', '大量重复的文字 续集 QQ21431549', '并不重复的文字 下', '风和日丽 QQ21431549', 'abc 123 QQ21431549'];
		miningService.dedupeVideos(original, function(err, result) {
			// console.log(result);
			expect(result).to.deep.equal(['大量重复的文字 QQ21431549 上部', '并不重复的文字 下', '风和日丽 QQ21431549', 'abc 123 QQ21431549']);
		})

	});
});
