var fs = require('fs');
var path = require('path');
var utils = require('./scripts/utils.js');
var parsers = require('./scripts/parse-blocks-scripts-properties.js');
parsers.parseCategories = require('./scripts/parse-categories.js');
parsers.parseCaseFolding = require('./scripts/parse-case-folding.js');
parsers.parseEmoji = require('./scripts/parse-emoji.js');
var extend = utils.extend;
var cp = require('cp');
var jsesc = require('jsesc');
var template = require('lodash.template');

var templatePath = path.resolve(__dirname, 'templates');
var staticPath = path.resolve(__dirname, 'static');
var compileReadMe = template(fs.readFileSync(
	path.resolve(templatePath, 'README.md'),
	'utf-8')
);
var compilePackage = template(fs.readFileSync(
	path.resolve(templatePath, 'package.json'),
	'utf-8')
);
var compileIndex = template('module.exports=<%= data %>');

var generateData = function(version) {
	var dirMap = {};
	console.log('Generating data for Unicode v%s…', version);
	console.log('Parsing Unicode v%s categories…', version);
	extend(dirMap, utils.writeFiles({
		'version': version,
		'map': parsers.parseCategories(version),
		'type': function(category) {
			if (/^(?:Bidi_[A-Z]+)$/.test(category)) {
				return 'bidi';
			}
			if (/^(?:Any|ASCII|Assigned)$/.test(category)) {
				return 'properties';
			}
			return 'categories';
		}
	}));
	console.log('Parsing Unicode v%s scripts…', version);
	extend(dirMap, utils.writeFiles({
		'version': version,
		'map': parsers.parseScripts(version),
		'type': 'scripts'
	}));
	console.log('Parsing Unicode v%s properties…', version);
	extend(dirMap, utils.writeFiles({
		'version': version,
		'map': parsers.parseProperties(version),
		'type': 'properties'
	}));
	console.log('Parsing Unicode v%s derived core properties…', version);
	extend(dirMap, utils.writeFiles({
		'version': version,
		'map': parsers.parseDerivedCoreProperties(version),
		'type': 'properties'
	}));
	console.log('Parsing Unicode v%s case folding…', version);
	extend(dirMap, utils.writeFiles({
		'version': version,
		'map': parsers.parseCaseFolding(version),
		'type': 'case-folding'
	}));
	console.log('Parsing Unicode v%s blocks…', version);
	extend(dirMap, utils.writeFiles({
		'version': version,
		'map': parsers.parseBlocks(version),
		'type': 'blocks'
	}));
	console.log('Parsing Unicode v%s bidi mirroring…', version);
	extend(dirMap, utils.writeFiles({
		'version': version,
		'map': parsers.parseMirroring(version),
		'type': 'bidi-mirroring'
	}));
	console.log('Parsing Unicode v%s bidi brackets…', version);
	extend(dirMap, utils.writeFiles({
		'version': version,
		'map': parsers.parseBrackets(version),
		'type': 'bidi-brackets'
	}));
	console.log('Parsing Unicode v%s emoji', version);
	extend(dirMap, utils.writeEmojiFiles({
		'version': version,
		'data': parsers.parseEmoji(version)
	}));
	fs.writeFileSync(
		path.resolve(__dirname, 'output', 'unicode-' + version, 'README.md'),
		compileReadMe({
			'version': version,
			'dirs': dirMap,
			'regenerateExample': '<%= set.toString() %>'
		})
	);
	fs.writeFileSync(
		path.resolve(__dirname, 'output', 'unicode-' + version, 'index.js'),
		compileIndex({ 'version': version, 'data': jsesc(dirMap) })
	);
	fs.writeFileSync(
		path.resolve(__dirname, 'output', 'unicode-' + version, 'package.json'),
		compilePackage({ 'version': version })
	);
	[
		'.gitattributes',
		'.gitignore'
	].forEach(function(file) {
		cp.sync(
			path.resolve(staticPath, file),
			path.resolve(__dirname, 'output', 'unicode-' + version, file)
		);
	});
	return dirMap;
};

module.exports = generateData;
