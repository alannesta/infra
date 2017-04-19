var webPage = require('webpage');
var page = webPage.create();
var system = require('system');
var args = system.args;
var util = require('./service-util');

var host = 'email.91dizhi.at.gmail.com.8h5.space';

if (args.length === 2) {
	try {
		host = util.parseHost(args[1]);
	} catch(err) {
		system.stdout.writeLine('parse host err, try continue using DEFAULT_HOST');
	}

	page.open(args[1], function(status) {
		if (status === 'fail') {
			system.stdout.writeLine('Fail to open movie page, exiting');
			phantom.exit(1);
		}

		waitFor(videoPagePresent, 8000, function() {
			//system.stdout.writeLine(page.content);
			// extract via regex because phantomjs does not support 'video' tag
			var url = util.extractHtml5Video(page.content);
			system.stderr.writeLine(url);
			phantom.exit(0);

		});
	});
}
function waitFor(condition, timeout, callback) {
	var startTime = new Date().getTime();
	var checkPass = 0;
	var elapsed = 0;
	var checkInterval = setInterval(function() {
		var now = new Date().getTime();
		elapsed += now - startTime;
		if (elapsed < timeout) {
			system.stdout.writeLine('check now...');
			startTime = now;
			checkPass = page.evaluate(condition);
			if (checkPass) {
				clearInterval(checkInterval);
				callback();
			}
		} else {
			// timeout reached
			clearInterval(checkInterval);
			console.log('timeout reached, exit');
			phantom.exit(2);
		}
	}, 800);
}

function videoPagePresent() {
	return document.querySelectorAll('div.example-video-container').length > 0;
}

