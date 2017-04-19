var entities = require('entities');

module.exports = {
	parseFileUrl: function(url) {
		var regex = /\/\/dl\/\//;
		if (regex.test(url) && url.indexOf('&domainUrl') > -1) {
			var result = url.replace(regex, '/dl/');
			return entities.decodeHTML(result.slice(0, result.indexOf('&domainUrl')));
		}

		// a bit hacky, the returned string from phantom is html encoded
		return entities.decodeHTML(url);
	},

	parseHost: function(url) {
		var regex = /^http:\/\/(.*?)\/view_video.php/;
		var result = url.match(regex);
		if (result) {
			return result[1];
		} else {
			// result will be null if no match is found
			throw new Error('Invalid url! Cannot parse host');
		}
	},

	replaceHost: function(url, host) {
		var regex = /^http:\/\/(.*?)\/view_video.php/;
		var result = url.match(regex);
		if (regex.test(url)) {
			return url.replace(result[1], host);
		}
		return url;
	},

	extractVariables: function(content) {
		var regex = /addVariable\('\w*'[^']+'\w*'\)/g;
		var extractRegex = /addVariable\('(\w*)'[^']+'(\w*)'\)/;
		var match = content.match(regex);
		var so = {
			seccode: '',
			VID: '',
			max_vid: '',
		};
		if (match) {
			match.forEach(function(matched) {
				if (matched.indexOf('seccode') > -1) {
					so.seccode = matched.match(extractRegex)[2];
				}
				if (matched.indexOf('file') > -1) {
					so.VID = matched.match(extractRegex)[2];
				}
				if (matched.indexOf('max_vid') > -1) {
					so.max_vid = matched.match(extractRegex)[2];
				}
			});
		}

		return so;
	},

	extractHtml5Video: function(content) {
		var regex = /<source src="(.*?)"/;
		var match = content.match(regex);
		if (match !== null) {
			return match[1];
		}
		return '';
	},
};
