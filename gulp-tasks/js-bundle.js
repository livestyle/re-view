'use strict';

const path = require('path');
const through = require('through2');
const browserify = require('browserify');
const watchify = require('watchify');
const extend = require('xtend');

const _bundles = {};
const defaultOptions = {
	debug: false,
	detectGlobals: false,
	babelify: true,
	babelOptions: {
		presets: ['es2015']
	}
};

module.exports = function(options) {
	return through.obj(function(file, enc, next) {
		file.contents = jsBundle(file, options)
		.on('error', err => this.emit('error', err));
		next(null, file);
	});
}

function jsBundle(file, options) {
	options = options || {};

	if (!_bundles[file.path]) {
		options = makeOptions(file, options);

		var b = browserify(options);
		if (options.watch) {
			b.plugin(watchify);
		}

		if (options.babelify) {
			b = b.transform('babelify', options.babelOptions)
		}

		_bundles[file.path] = b;
	}

	return _bundles[file.path].bundle();
}

function makeOptions(file, options) {
	options = options || {};
	var babelOptions = extend(defaultOptions.babelOptions, options.babelOptions || {});
	options = extend({entries: [file.path]}, defaultOptions,  options, {babelOptions});

	if (options.standalone === true) {
		options.standalone = path.basename(file.path)
			.replace(/\.\w+/, '')
			.replace(/\-(\w)/g, function(str, c) {
				return c.toUpperCase();
			});
	}

	if (options.watch) {
		options = extend(options, {
			cache: {},
			packageCache: {}
		});
	}

	return options;
}