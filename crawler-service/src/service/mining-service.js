const createRedisConnection = require('../redis-connector');
const logger = require('./../utils/logger');

const miningService = {
	dedupeVideos: function(videos, callback) {
		dedupeWithFreqMap(videos, callback);
	}
} ;

function dedupeWithFreqMap(rawData, callback) {
	const redisClient = createRedisConnection();
	let collection = [...rawData];
	let dupeMap = {};
	let threshold = 5;

	logger.debug('----- start generate filter words from frequency map ------');
	// console.time('filter_words');

	redisClient.get('frequency-map', function(err, map) {
		try {
			if (map) {
				dupeMap = JSON.parse(map);
				logger.debug('mining-service::dedupeWithFreqMap:dedupe using dedupe map: ', dupeMap);
			} else {
				logger.debug('skip using freq map, dupe threshold set to 2');
				threshold = 2;	// frequency
			}
		} catch (err) {
			logger.error('skip using freq map, dupe threshold set to 2');
			threshold = 2;	// frequency
		}
		for (var i = 0; i < collection.length; i++) {
			for (var j = i + 1; j < collection.length; j++) {
				let {maxLen, endIndexA} = DPLCS(collection[i], collection[j]);
				if (maxLen > 7) {
					let dupeStr = collection[i].substring(endIndexA - maxLen + 1, endIndexA + 1);
					if (typeof dupeMap[dupeStr] === 'number') {
						dupeMap[dupeStr] += 1;
					} else {
						dupeMap[dupeStr] = 2;
					}
					collection[j] = '';
				}
			}
		}
		let frequentWords = highFreq(dupeMap, threshold);
		logger.debug('generated frequent words: ', frequentWords);
		// console.timeEnd('filter_words');
		redisClient.set('frequency-map', JSON.stringify(dupeMap), function(err) {
			logger.debug('mining-service::dedupeWithFreqMap: saving map: ', dupeMap);
			redisClient.quit();
		});

		callback(null, dedupe(rawData, frequentWords));
	});
}

function dedupe(rawData, filterWords) {
	let collection = [...rawData];
	let removed = [];
	logger.debug('-------- start dedupe ---------');
	logger.debug('mining-service::dedupe -> original items: ', rawData);
	// console.time('dedupe');
	for (var i = 0; i < collection.length; i++) {
		if (collection[i].length === 0) {
			continue;
		}
		for (var j = i + 1; j < collection.length; j++) {
			if (collection[j].length > 0) {
				let {maxLen} = DPLCS(filterJunkWord(collection[i], filterWords), filterJunkWord(collection[j], filterWords));
				if (maxLen >= 7) {
					removed.push(collection[j]);
					collection[j] = '';
				}
			}
		}
	}
	logger.debug('mining-service::dedupe -> removed items: ', removed);
	// console.timeEnd('dedupe');
	let result = collection.filter((word) => {
		return word.length > 0;
	});

	return result;
}

// extract high frequency terms from a map to an array
function highFreq(map, threshold = 5) {
	return Object.keys(map).filter((key) => {
		return map[key] > threshold;
	});
}

function filterJunkWord(str, filters) {
	for (let i = 0; i < filters.length; i++) {
		if(str.indexOf(filters[i]) > -1) {
			str = str.replace(filters[i], '');
		}
	}
	return str;
}

/**
 * Dynamic programming
 * @param {array} a
 * @param {array} b
 * @returns {object} {maxLength, endIndex of the common string(string1)}
 */
function DPLCS(a, b) {
	var common = createArray(a.length, b.length);
	var maxLen = 0;
	var endIndexA = 0;
	for (let i = 0; i < a.length; i++) {
		for (let j = 0; j < b.length; j++) {
			if (a[i] === b[j]) {
				if (i === 0 || j === 0) {
					common[i][j] = 1;
				} else {
					common[i][j] = common[i - 1][j - 1] + 1;
				}
				if (common[i][j] > maxLen) {
					maxLen = common[i][j];
					endIndexA = i;
				}
			} else {
				common[i][j] = 0;
			}
		}
	}
	return {
		maxLen,
		endIndexA
	}
}

function createArray(m, n) {
	var dimentionalArray = new Array(m);
	for (var i = 0; i < m; i++) {
		dimentionalArray[i] = new Array(n);
		for (var j = 0; j < dimentionalArray[i].length; j++) {
			dimentionalArray[i][j] = '';
		}
	}
	return dimentionalArray;
}

function max(arr) {
	cmax = arr[0];
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].length > cmax.length) {
			cmax = arr[i];
		}
	}
	return cmax;
}

module.exports = miningService;
