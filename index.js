var browserPerf = require('browser-perf'),
	fs = require('fs'),
	asciify = require('asciify'),
	SauceTunnel = require('sauce-tunnel');

try {
	var config = JSON.parse(fs.readFileSync('./config.json'));
} catch (e) {
	console.log(e);
}

var website = config.website,
	sauce_username = config.sauce_username || process.env.SAUCE_USERNAME || 'perfmonkey-test',
	sauce_access_key = config.sauce_access_key || process.env.SAUCE_ACCESS_KEY || '32b71b26-f0b6-49f1-bb03-db401782c783';

if (!(website && sauce_username && sauce_access_key)) {
	throw 'Need to specify website, username and accesskey';
}

var results_explain = '\n\nTo interpret these results and for more information on how to run these tests for your site, visit http://perfmonkey.com/#/trynow/results/travis/' + (process.env.TRAVIS_BUILD_ID || '') + '\n\n';
var generateTable = function(data) {
	var cliTable = require('cli-table'),
		res = [];
	for (var i = 0; i < data.length; i++) {
		res.push('\n\nBrowser: ', data[i]._browserName + '\n');
		var table = new cliTable({
			head: ['Metrics', 'Value', 'Unit', 'Source'],
			colAligns: ['right', 'left'],
			colWidths: [35, 15, 15, 35]
		});
		for (var key in data[i]) {
			if (key.indexOf('_') === 0)
				continue;
			var val = data[i][key];
			table.push([key, val.value + '', val.unit + '', val.source + '']);
		}
		table = table.sort(function(a, b) {
			if (a[3] === b[3]) {
				return a[0] > b[0] ? 1 : -1;
			} else {
				return a[3] > b[3] ? 1 : -1;
			}
		});
		res.push(table.toString());
	}
	return res.join('');
};


var tunnelId = process.env.TRAVIS_BUILD_ID;
var tunnel = new SauceTunnel(sauce_username, sauce_access_key, tunnelId, true);
tunnel.start(function() {
	console.log('Tunnel ready');
	browserPerf(website, function(err, data) {
		tunnel.stop(function() {
			console.log('Tunnel Shutdown');
			if (err) {
				console.log(err);
			} else {
				data[0]._url = website;
				console.log('--results:start--');
				console.log(JSON.stringify(data));
				console.log('--results:end--');
				asciify('Perf Results : ', {
					font: 'small'
				}, function(err, res) {
					console.log(res);
					console.log(generateTable(data));
					console.log(results_explain);
				});
			}
		});
	}, {
		browsers: [{
			browserName: 'chrome',
			version: 35,
			name: 'perfmonkey.com',
			build: website,
			tags: ["perfmonkey.com"],
			'tunnel-identifier': tunnelId,
			'record-video': false,
			'record-screenshots': false,
			'record-logs': false,
			'sauce-advisor': false,
			'screen-resolution': '1280x1024'
		}],
		selenium: {
			hostname: '127.0.0.1',
			port: 4445,
			user: sauce_username,
			pwd: sauce_access_key
		},
		logger: console.log
	});
});