/* eslint-disable node/no-unpublished-require */
/* eslint-disable import/no-extraneous-dependencies */

const gulp = require('gulp');
const plumber = require('gulp-plumber');
const webpack = require('webpack-stream');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');

const env = 'development';

function onError(err) {
	const splitFilename = err.file.split('/');
	const fileName = splitFilename[splitFilename.length - 1];
	/* eslint-disable no-console */
	console.log('\u001b[1;31m *** Error ***');
	console.log(`\u001b[1;32m・・・Error in file '${fileName}' on line ${err.line}・・・`);
	/* eslint-enable no-console */
	this.emit('end');
}

const paths = {
	scripts: {
		files: './public/js/**/*.mjs',
		src: './public/js/index.mjs',
		dest: './public/js/',
	},
};

function scripts() {
	return gulp
		.src(paths.scripts.src, { sourcemaps: true })
		.pipe(plumber(onError))
		.pipe(webpack({ mode: env, devtool: 'source-map' }))
		.pipe(babel())
		.pipe(uglify())
		.pipe(rename('bundle.min.js'))
		.pipe(gulp.dest(paths.scripts.dest));
}

function watch() {
	gulp.watch(paths.scripts.src, scripts);
}

function defaultTask(cb) {
	console.log('default task called');
	cb();
}

exports.scripts = scripts;
exports.watch = watch;

exports.default = defaultTask;
