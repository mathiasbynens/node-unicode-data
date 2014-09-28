var fs = require('fs');
var guard = require('when/guard');
var path = require('path');
var request = require('request');
var resources = require('../data/resources.js');
var when = require('when');

var PARALLEL_REQUEST_LIMIT = 5;

var download = function(url, version, type) {
	var deferred = when.defer();
	var file = path.resolve(
		__dirname,
		'..', 'data', version + '-' + type + '.txt'
	);
	console.log(' ', url, '→', path.basename(file));
	request(url).on('end', function() {
		return deferred.resolve();
	}).on('error', function(err) {
		return deferred.reject(err);
	}).pipe(fs.createWriteStream(file));
	return deferred.promise;
};
// limit maximum parallelism to something reasonable
download = guard(guard.n(PARALLEL_REQUEST_LIMIT), download);

console.log('Downloading resources…');

resources.forEach(function(resource) {
	var version = resource.version;
	download(resource.main, version, 'database');
	[
		'scripts',
		'blocks',
		'properties',
		'derived-core-properties',
		'case-folding',
		'bidi-mirroring',
		'bidi-brackets',
		'emoji'
	].forEach(function(type) {
		if (resource[type]) {
			download(resource[type], version, type);
		}
	});
});
