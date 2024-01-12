/* eslint-disable node/no-unpublished-require */
const gulp = require('gulp');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const webpack = require('webpack-stream');
const replace = require('gulp-replace');

let env = 'development';

function onError(err) {
	const splitFilename = err.file.split('/');
	const fileName = splitFilename[splitFilename.length - 1];
	/* eslint-disable no-console */
	console.log('\u001b[1;31m *** Error ***');
	console.log(`\u001b[1;32m・・・Error in file '${fileName}' on line ${err.line}・・・`);
	/* eslint-enable no-console */
	this.emit('end');
}

function setProd(cb) {
	env = 'production';
	cb();
}

const paths = {
	scripts: {
		files: './public/js/**/*.mjs',
		src: './public/js/index.mjs',
		dest: './public/js/',
	},
};

function setSocketPort(cb) {
	const anchor = '// SocketIO_Connection';
	let socketPort = ':3000';
	let domain = 'http://localhost';

	if (env === 'production') {
		socketPort = '';
		domain = 'https://jemu-chat.com';
	}

	// TODO: Update the regex to catch the live domain too
	const socket3000 = /const socket = io.connect\('http:\/\/localhost:3000'\);\n|\r/gm;
	const socket8080 = /const socket = io.connect\('https:\/\/jemu-chat.com'\);\n|\r/gm;

	gulp
		.src(paths.scripts.src, { sourcemaps: true })
		.pipe(replace(socket3000, ''))
		.pipe(replace(socket8080, ''))
		// .pipe(replace(anchor, `${anchor}\nconst socket = io('${domain}:${socketPort}');`))
		.pipe(replace(anchor, `${anchor}\nconst socket = io.connect('${domain}${socketPort}');`))
		.pipe(rename('index.mjs'))
		.pipe(gulp.dest(paths.scripts.dest));
	cb();
}

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

const devBuild = gulp.series(setSocketPort, scripts);
const build = gulp.series(setProd, setSocketPort, scripts);

function defaultTask(cb) {
	cb();
}

exports.scripts = scripts;
exports.watch = watch;
exports.devBuild = devBuild;
exports.build = build;

exports.default = defaultTask;
