'use strict';

const gulp = require('gulp');
const through = require('through2');
const js = require('./gulp-tasks/js-bundle');
const buffer = require('vinyl-buffer');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

const isWatching = ~process.argv.indexOf('watch');
const production = ~process.argv.indexOf('--production');

gulp.task('js', () => {
	return gulp.src('./index.js')
	.pipe(js({
		standalone: 'reView', 
		debug: true,
		watch: isWatching
	}))
	.pipe(buffer())
	.pipe(sourcemaps.init({loadMaps: true}))
	.pipe(production ? uglify() : through.obj())
	.pipe(sourcemaps.write('./'))
	.pipe(gulp.dest('./dist'))
});

gulp.task('watch', ['build'], () => {
	gulp.watch(['./index.js', './lib/**/*.js'], ['js']);
});

gulp.task('build', ['js']);
gulp.task('default', ['build']);
