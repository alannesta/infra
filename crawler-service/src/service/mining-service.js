const redisClient = require('../redis-connector');
// console.log(dedupe(raw, generateFilterWords(raw)).length);

const miningService = {
	dedupteVideos: function(videos) {
		return dedupe(videos, generateFilterWords(videos));
	}
} ;

function generateFilterWords(rawData) {
	let collection = [...rawData];
	console.time('filter_words');
	//let dupeMap = (redisClient.get('frequent-words') && JSON.parse(redisClient.get('frequent-words'))) || {};
	let dupeMap = {};
	for (var i = 0; i < collection.length; i++) {
		for (var j = i + 1; j < collection.length; j++) {
			let {maxLen, endIndexA} = DPLCS(collection[i], collection[j]);
			if (maxLen > 7) {
				let dupeStr = collection[i].substring(endIndexA - maxLen + 1, endIndexA + 1);
				if (typeof dupeMap[dupeStr] === 'number') {
					dupeMap[dupeStr]++;
				}else {
					dupeMap[dupeStr] = 1;
				}
				collection[j] = '';
			}
		}
	}
	//redisClient.set('frequent-words', JSON.stringify(dupeMap));
	let frequentWords = highFreq(dupeMap);
	console.timeEnd('filter_words');
	return frequentWords;
}

function dedupe(rawData, filterWords) {
	let collection = [...rawData];
	console.time('dedupe');
	for (var i = 0; i < collection.length; i++) {
		if (collection[i].length === 0) {
			continue;
		}
		for (var j = i + 1; j < collection.length; j++) {
			if (collection[j].length > 0) {
				let {maxLen} = DPLCS(filterJunkWord(collection[i], filterWords), collection[j]);
				if (maxLen > 7) {
					collection[j] = '';
				}
			}
		}
	}
	console.timeEnd('dedupe');
	let result = collection.filter((word) => {
		return word.length > 0;
	});

	// fs.writeFileSync('../data/raw_dedupe_nodejs', result.join('\n'));
	// fs.writeFileSync('../data/deleted_ids_nodejs', deletedIds.join('\n'));

	return result;
}

// extract high frequency terms from a map to an array
function highFreq(map) {
	return Object.keys(map).filter((key) => {
		return map[key] > 5;
	});
}

function filterJunkWord(str, filters) {
	for (let i = 0; i < filters.length; i++) {
		if(str.indexOf(filters[i]) > -1) {
			return str.replace(filters[i], '');
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
