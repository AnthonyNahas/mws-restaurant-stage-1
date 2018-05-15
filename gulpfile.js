/*eslint-env node */

const gulp = require('gulp');
const clean = require('gulp-clean');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const eslint = require('gulp-eslint');
const jasmine = require('gulp-jasmine-phantom');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const gzip = require('gulp-gzip');

const browserSync = require('browser-sync').create();


gulp.task('default', ['html', 'copy-images', 'styles', 'lint', 'scripts'], function () {
	gulp.watch('src/css/**/*.css', ['styles']);
	gulp.watch('src/js/**/*.js', ['lint']);
	gulp.watch('src/html/**/*.html', ['html']);
	gulp.watch('./dist/**/*.html').on('change', browserSync.reload);

	browserSync.init({
		server: './dist'
	});
});

gulp.task('dist', [
	'html',
	'copy-images',
	'styles',
	'lint',
	'scripts-dist'
]);

gulp.task('clean', () => {
	return gulp.src(['dist'], {read: false}).pipe(clean());
});

gulp.task('bundle-main', function () {
	gulp.src(['dist/js/main.js', 'lib/idb.js', 'sw/sw.js'])
		.pipe(concat('main.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('bundle:restaurant:dev', function () {
	gulp.src(['dist/js/restaurant.js', 'lib/idb.js', 'sw/sw.js'])
		.pipe(concat('restaurant.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('bundle:restaurant:prod', function () {
	gulp.src(['dist/js/restaurant.js', 'lib/idb.js', 'sw/sw.js'])
		.pipe(concat('restaurant.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts:main:dev', function () {
	gulp.src(['src/js/**/*.js', '!src/js/restaurant_info.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(concat('main.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-restaurant', function () {
	gulp.src(['src/js/**/*.js', '!src/js/main.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(concat('main.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts', function () {
	gulp.src('src/js/**/*.js')
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(concat('all.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', function () {
	gulp.src('src/js/**/*.js')
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(concat('all.js'))
		.pipe(uglify().on('error', function (e) {
			console.log(e);
		}))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('html', function () {
	gulp.src('src/html/**/*.html')
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function () {
	gulp.src('img/*')
		.pipe(gulp.dest('dist/img'));
});

gulp.task('copy-manifest.json', () => {
	gulp.src('src/manifest.json')
		.pipe(gulp.dest('dist/'));
});

gulp.task('copy-manifest', () => {
	gulp.src('src/manifest/**/*')
		.pipe(gulp.dest('dist/manifest'));
});

gulp.task('copy-idb', () => {
	gulp.src('node_modules/idb/lib/idb.js')
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(gulp.dest('dist/lib'));
});

gulp.task('copy-sw', function () {
	gulp.src('src/sw/sw.js')
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify().on('error', function (e) {
			console.log(e);
		}))
		.pipe(gulp.dest('dist/sw'));
});

gulp.task('styles', function () {
	gulp.src('src/css/**/*.css')
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.stream());
});

gulp.task('lint', function () {
	return gulp.src(['src/js/**/*.js'])
	// eslint() attaches the lint output to the eslint property
	// of the file object so it can be used by other modules.
		.pipe(eslint())
		// eslint.format() outputs the lint results to the console.
		// Alternatively use eslint.formatEach() (see Docs).
		.pipe(eslint.format())
		// To have the process exit with an error code (1) on
		// lint error, return the stream and pipe to failOnError last.
		.pipe(eslint.failOnError());
});

gulp.task('gzip', function () {
	gulp.src('dist/js/**/*.js')
		.pipe(gzip())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('tests', function () {
	gulp.src('tests/spec/extraSpec.js')
		.pipe(jasmine({
			integration: true,
			vendor: 'js/**/*.js'
		}));
});
