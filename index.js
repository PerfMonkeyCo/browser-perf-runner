var browserPerf = require('browser-perf'),
	fs = require('fs');

var log = {
	'fatal': console.error.bind(console),
	'error': console.error.bind(console),
	'warn': console.warn.bind(console),
	'info': console.info.bind(console),
	'debug': console.log.bind(console),
	'trace': console.trace.bind(console),
};

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

try {
	var data = JSON.parse(fs.readFileSync('./config.json'));
} catch (e) {
	console.log(e);
}

browserPerf(data.website, function(err, data) {
	if (err) {
		log.error(err);
	} else {
		log.info(generateTable(data));
	}
}, {
	browsers: [{
		browserName: 'chrome',
		version: 35,
		name: data.name || 'perfmonkey.com',
		build : data.website,
		tags: ["perfmonkey.com"]
	}],
	//selenium: "http://localhost:4444/wd/hub",
	selenium: "ondemand.saucelabs.com",
	username: data.sauce_username || 'perfmonkey-test',
	accesskey: data.sauce_accesskey || '32b71b26-f0b6-49f1-bb03-db401782c783',
	logger: log
});