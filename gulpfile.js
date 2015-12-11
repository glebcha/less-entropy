'use strict';

/*
Instructions:

1 - Should execute 'npm run prepare' 
	before the very first run, it will install and symlink all dependencies.

2 - Choose between production 'npm start' and development 'npm run start-dev' modes 
	(watcher will run immediately after initial run).

*/

// Define dependencies
const   env = process.env.NODE_ENV,
		gulp = require('gulp'),
		cache = require('gulp-cache'),
		clean = require('gulp-rimraf'),
		stream = require('event-stream'),
		browserSync = require('browser-sync'),
		browserify = require('browserify'),
		babelify = require('babelify'),
		uglify = require('gulp-uglify'),
		source = require('vinyl-source-stream'),
		size = require('gulp-size'),
		jshint = require('gulp-jshint'),
		concat = require('gulp-concat'),
		minifyCSS = require('gulp-minify-css'),
		base64 = require('gulp-base64'),
		imagemin = require('gulp-imagemin'),
		less = require('gulp-less'),
		jade = require('gulp-jade'),
		rename = require('gulp-rename'),
		notify = require("gulp-notify"),
		pluginAutoprefix = require('less-plugin-autoprefix');

const autoprefix = new pluginAutoprefix({ browsers: ["iOS >= 7", "Chrome >= 30", "Explorer >= 9", "last 2 Edge versions", "Firefox >= 20"] });
 
// Lint scripts
gulp.task('lint', () => {
	return gulp.src('js/custom.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

// Build views with Jade
gulp.task('html', () => {
	var localsObject = {};

	gulp.src('views/*.jade')
	.pipe(jade({
	  locals: localsObject
	}))
	.pipe(gulp.dest('assets'))
	.pipe(browserSync.reload({stream:true}));
});

 
// Concat and minify styles
// Compile *.less-files to css
// Convert small images to base64, minify css
gulp.task('styles', () => {
	return gulp.src('less/style.less')
		.pipe(less({
			plugins: [autoprefix]
		}))
		.on("error", notify.onError({
			message: 'LESS compile error: <%= error.message %>'
		}))
		.pipe(base64({
			extensions: ['jpg', 'png', 'svg'],
			maxImageSize: 32*1024 // max size in bytes, 32kb limit is strongly recommended due to IE limitations
		}))
		.pipe(minifyCSS({
			keepBreaks: false // New rule will have break if 'true'
		}))
		.pipe(gulp.dest('assets/css'))
		.pipe(size({
			title: 'size of styles'
		}))
		.pipe(browserSync.reload({stream:true}));
});
 
/*
Concat and minify scripts

Modules - task will transpile es2015(es6) 
		with Babel and then bundle with Browserify.

Deps - task will concat all dependencies
		following strictly the order in array.
*/
gulp.task('scripts', () => {
	const modules = browserify('js/app.js', {
			debug: env === "development" ? true : false
		})
		.transform(babelify, {presets: ["es2015", "react"]})
		.bundle()
		.on("error", notify.onError({
			message: 'Browserify error: <%= error.message %>'
		}))
		.pipe(source('bundle.js'))
		.pipe(gulp.dest('assets/js'))
		.pipe(size({
			title: 'size of modules'
		}));

	const deps = gulp.src(['js/libs/*jquery*', 'js/libs/*lodash*'])
		.pipe(concat('libs.js'))
		.pipe(uglify())
		.pipe(gulp.dest('assets/js'))
		.pipe(size({
			title: 'size of js dependencies'
		}));
	stream.concat(modules, deps).pipe(browserSync.reload({stream:true, once: true}));
});
 
// Compress images
// Will cache to process only changed images, but not all in image folder
// optimizationLevel - range from 0 to 7 (compression will work from 1) which means number of attempts
gulp.task('images', () => {
	return gulp.src(['images/*', '!images/*.db'])
		.pipe(cache(imagemin({
			optimizationLevel: 5,
			progressive: true,
			interlaced: true
		})))
		.on("error", notify.onError({
			message: 'Images processing error: <%= error.message %>'
		}))
		.pipe(gulp.dest('assets/images'))
		.pipe(size({
			title: 'size of images'
		}));
});
 
// Clean destination dir and rebuild project
gulp.task('clean', () => {
  return gulp.src(['assets/css', 'assets/js', 'assets/*.html'], {read: false})
	.pipe(clean());
});
 
// Clean images cache 
gulp.task('clear', (done) => {
  return cache.clearAll(done);
});
 
// Livereload will up local server 
// and inject all changes made
gulp.task('browser-sync', () => {
	browserSync({
		server: {
			baseDir: "./assets"
		}
	});
});
 
// Watcher will look for changes and execute tasks
gulp.task('watch', ['browser-sync'], () => {
	gulp.watch('views/**/*.jade', ['html']);
	gulp.watch('js/**/*.js', ['lint', 'scripts']);
	gulp.watch('less/**/*.less', ['styles']);
	gulp.watch('images/*', ['images']);
});
 
// Default task will clean build dirs/build project and clear image cache
gulp.task('default', ['clean', 'clear'], () => {
	gulp.start('styles', 'scripts', 'images', 'html');
});