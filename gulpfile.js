/* global require */
var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
var plugins = gulpLoadPlugins();
var uglify = require('gulp-uglify');

gulp.task('default', ['rjs']);

var concatTask = function () {
	gulp.src([
		'./src/base64.js',
		'./src/md5.js',
		'./src/xml2json.js',
		'./src/cos.js'
	])
		// .pipe(uglify({
		// 	preserveComments:'license'
		// }))
		.pipe(plugins.concat("cos-wx-sdk-v5.js"))
		.pipe(gulp.dest("./demo/lib/")) // 这是 demo 需要引用的文件
		.pipe(gulp.dest("./dist").on('finish', function () {
			console.log('concat done...');
		}));
};

gulp.task('rjs', function () {
	concatTask();
	// 文件合并
	gulp.watch("./src/*.js", function (event) {
		concatTask();
	});
});
