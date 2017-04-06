const cheerio = require('cheerio');
const request = require('request');
const async = require('async');

// var logger = require('../utils/logger');

var CrawlerService = {
	crawl: function(url) {
		return new Promise((resolve, reject) => {
			let j = request.jar();
			let cookie = request.cookie('language=cn_CN');
			j.setCookie(cookie, url);

			request({
				url: url,
				jar: j,
			}, (error, response, body) => {
				if (error) {
					reject();
				}
				if (!error && response.statusCode === 200) {
					resolve(parseHtml(body));
				}
			});
		});
	},

	// unit test
	parseHtml: parseHtml,
};

/**
 * Parser for the html fetched
 * @param str
 * @returns {Array}
 */
function parseHtml(str) {
	var resultSet = [];
	var $ = cheerio.load(str);
	var tiles = $('.listchannel');

	Object.keys(tiles).forEach(function(key) {
		try {
			parseInt(key, 10);	// check key
			var entry = {};
			if (!(tiles[key].children instanceof Array)) {
				return;
			}
			tiles[key].children.forEach(function(node) {
				if (node.name === 'div' && (node.attribs.class === 'imagechannel' || node.attribs.class === 'imagechannelhd')) {
					//console.log(node.children[3].children[1].attribs.src);
					var url = '';
					// some videos have the one more <img> node for the HD options
					if (node.children[3] && node.children[3].name === 'a') {
						url = node.children[3].children[1].attribs.src;
					} else if (node.children[1] && node.children[1].name === 'a') {
						url = node.children[1].children[1].attribs.src;
					}
					entry['thumbnail'] = url.length > 0 ? url : '';	// TODO: placeholder img url
				}
				if (node.type == 'tag' && node.name == 'span') {
					if (node.children[0].data == '作者:') {
						entry[node.children[0].data.replace(':', '')] = sanitize(node.next.next.children[0].data);
					} else if (node.children[0].data == '添加时间:') {
						entry[node.children[0].data.replace(':', '')] = processAddedDate(sanitize(node.next.data));
					} else if (node.children[0].data == '时长:') {
						entry[node.children[0].data.replace(':', '')] = processLength(sanitize(node.next.data));
					} else {
						entry[node.children[0].data.replace(':', '')] = sanitize(node.next.data);
					}
				}

				if (node.type == 'tag' && node.name == 'a' && node.attribs.title != undefined) {
					entry['片名'] = node.attribs.title;
					entry['url'] = node.attribs.href;
				}
			});
			// another level of data check
			if (entry['url'] && entry['时长'] > 2) {
				resultSet.push(entry);
			}
		} catch (err) {
			logger.debug('CrawlerService::parseHtml: try-catch Error -> ' + err);
		}
	});
	//console.log(resultSet);
	return resultSet;
}


function sanitize(str) {
	return str.trim();
}

/**
 Process the time when the video is added
 */
function processAddedDate(timeStr) {
	var now = Date.now();	// unix timestamp in millisecond
	var HOUR = '小时';
	var DAY = '天';
	var YEAR = '年';
	var regx = /^(\d{1,2}).*/;
	var HOURTOMILLISECONDS = 3600000;

	var result = regx.exec(timeStr);
	if (typeof result[1] !== 'undefined') {
		if (timeStr.indexOf(HOUR) > -1) {
			return new Date(now - HOURTOMILLISECONDS * parseInt(result[1], 10));
		}
		if (timeStr.indexOf(DAY) > -1) {
			return new Date(now - 24 * HOURTOMILLISECONDS * parseInt(result[1], 10));
		}
		if (timeStr.indexOf(YEAR) > -1) {
			return new Date(now - 365 * 24 * HOURTOMILLISECONDS * parseInt(result[1], 10));
		}
	} else {
		throw new Error('added date not processed correctly: ' + timeStr);
	}
}

/**
 Process the length of the video
 */

function processLength(length) {
	var regx2 = /(\d{1,2}):(\d{2}):*(\d{2})*/;
	var result = length.match(regx2);
	var timeinminute = 0;
	if (typeof result[1] !== 'undefined' && typeof result[2] !== 'undefined') {
		if (typeof result[3] !== 'undefined') {
			timeinminute = parseInt(result[1], 10) * 60 + parseInt(result[2], 10) + parseFloat((parseInt(result[3], 10) / 60).toFixed(2));
		} else {
			timeinminute = parseInt(result[1], 10) + parseFloat((parseInt(result[2], 10) / 60).toFixed(2));
		}
		return timeinminute;
	} else {
		throw new Error('video length format wrong: ' + length);
	}
}

module.exports = CrawlerService;
