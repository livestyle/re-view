'use strict';

const stream = require('stream');
const gulp = require('gulp');
const buffer = require('vinyl-buffer');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const js = require('./gulp-tasks/js-bundle');
const notify = require('./gulp-tasks/notify');

const isWatching = ~process.argv.indexOf('watch');
const production = ~process.argv.indexOf('--production');
const src = (pattern, options) => gulp.src(pattern, Object.assign({base: './'}, options || {}));
const dest = (pattern) => gulp.dest(pattern || './out');

gulp.task('script', () => {
	return src('./index.js')
	.pipe(js({
		standalone: 'reView',
		debug: true,
		watch: isWatching
	})).on('error', notify('JavaScript Error'))
	.pipe(buffer())
	.pipe(sourcemaps.init({loadMaps: true}))
	.pipe(production ? uglify() : pass())
	.pipe(sourcemaps.write('./'))
	.pipe(dest())
});

gulp.task('style', () => {
    return src('./style/*.scss')
    .pipe(sass()).on('error', notify('SCSS Error'))
    .pipe(dest());
});

gulp.task('assets', () => {
    return src('./style/img/**/*.*', {buffer: false}).pipe(dest());
});

gulp.task('watch', ['build'], () => {
	gulp.watch(['./index.js', './lib/**/*.js'], ['script']);
	gulp.watch('./style/**/*.scss', ['style']);
});

gulp.task('build', ['script', 'style', 'assets']);
gulp.task('default', ['build']);

function pass() {
	return new stream.Transform({
		transform: (obj, enc, next) => next(null, obj),
		objectMode: true
	});
}
