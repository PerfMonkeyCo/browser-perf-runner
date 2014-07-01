var browserPerf = require('browser-perf'),
	fs = require('fs'),
	asciify = require('asciify'),
	SauceTunnel = require('sauce-tunnel');

try {
	var config = JSON.parse(fs.readFileSync('./config.json'));
} catch (e) {
	console.log(e);
}

var SAUCE_USERNAME = 'perfmonkey-test',
	SAUCE_ACCESS_KEY = '32b71b26-f0b6-49f1-bb03-db401782c783';

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
var tunnel = new SauceTunnel(SAUCE_USERNAME, SAUCE_ACCESS_KEY, tunnelId, true);
tunnel.start(function() {
	console.log('Tunnel ready');
	browserPerf(config.website, function(err, data) {
		tunnel.stop(function() {
			console.log('Tunnel Shutdown');
			if (err) {
				console.log(err);
			} else {
				data[0]._url = config.website;
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
			build: config.website,
			tags: ["perfmonkey.com"],
			'tunnel-identifier': tunnelId
		}],
		selenium: {
			hostname: '127.0.0.1',
			port: 4445,
			user: SAUCE_USERNAME,
			pwd: SAUCE_ACCESS_KEY
		},
		logger: console.log
	});
});