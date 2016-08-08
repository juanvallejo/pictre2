/**
 * Build systtem for Pictre client side. Uses Gulp and broserify.
 *
 * @author juanvallejo
 * @date 5/31/15
 */

'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

var gutil = require('gulp-util');

// define tasks

gulp.task('default', function() {

	var bundle = browserify({

		cache: {},
		detectGlobals: false,
		debug: true,
		entries: ['./src/main.js'],
		fast: true,
		extensions: ['.js'],
		packageCache: {},
		fullPaths: true

	});

	// watchify ~ gulp.watch, but efficient
	bundle = watchify(bundle);
	bundle.on('update', function() {
		build(bundle);
	});

	return build(bundle);

});

/**
 * Builder function. Watched by watchify, 're-compiles' diffs
 * in client source modules into a single distribution file.
 */
function build(bundle) {

	// advertise build
	console.log('exporting changes in client source...');

	bundle.bundle()
		.on('error', function(error) {
			gutil.log('<bundle>', error.toString());
			gutil.beep();
		})
		.pipe(source('Pictre.js'))
		.pipe(gulp.dest('./dist'));

}