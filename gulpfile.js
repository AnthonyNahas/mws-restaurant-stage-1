/*eslint-env node */

const gulp = require('gulp');
const compress = require('compression');
const clean = require('gulp-clean');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const eslint = require('gulp-eslint');
const jasmine = require('gulp-jasmine-phantom');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const inject = require('gulp-inject');
const htmlmin = require('gulp-htmlmin');
const size = require('gulp-size');
const runSequence = require('run-sequence');

const browserSync = require('browser-sync').create();

const watch = (env) => {
	gulp.watch('src/css/**/*.css', ['styles']);
	gulp.watch('src/js/sw/**/*.js', ['copy-sw']);
	gulp.watch(['src/js/**/*.js', '!src/js/restaurant_info.js'], [`scripts:main:${env}`]);
	gulp.watch(['src/js/**/*.js', '!src/js/main.js'], [`scripts:restaurant:${env}`]);
	gulp.watch('src/html/**/*.html', ['html']);
	gulp.watch('./dist/**/*').on('change', browserSync.reload);
};

gulp.task('serve', ['build:dev'], () => {
	watch('dev');
	browserSync.init({
		server: './dist',
		port: 3001
	});
});

gulp.task('serve:prod', ['build:prod'], () => {
	watch('prod');
	browserSync.init({
		server: './dist',
		middleware: [compress()]
	});
});

gulp.task('build:dev', (callback) => {
	runSequence('clean',
		[
			'html',
			'styles',
			'copy-images',
			'copy-manifest.json',
			'copy-manifest',
			'copy-idb',
			'copy-sw',
			// 'lint',
			'scripts:main:dev',
			'scripts:restaurant:dev',
		],
		callback);
});

gulp.task('build:prod', (callback) => {
	runSequence('clean',
		[
			'html',
			'styles',
			'copy-images',
			'copy-manifest.json',
			'copy-manifest',
			'copy-serve.sh',
			'copy-idb',
			'copy-sw',
			// 'lint',
			'scripts:main:prod',
			'scripts:restaurant:prod',
		],
		callback);
});


gulp.task('clean', () => {
	return gulp.src(['dist'], {read: false}).pipe(clean());
});


gulp.task('scripts:main:dev', function () {
	gulp.src(['src/js/main.js', 'src/js/dbhelper.js'])
		.pipe(concat('main.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts:main:prod', function () {
	gulp.src(['src/js/main.js', 'src/js/dbhelper.js'])
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify().on('error', (e) => {
			console.log(e);
		}))
		.pipe(concat('main.js'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts:restaurant:dev', () => {
	gulp.src(['src/js/restaurant_info.js', 'src/js/dbhelper.js'])
		.pipe(concat('restaurant.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts:restaurant:prod', () => {
	gulp.src(['src/js/restaurant_info.js', 'src/js/dbhelper.js'])
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify().on('error', (e) => {
			console.log(e);
		}))
		.pipe(concat('restaurant.js'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('html', function () {
	gulp.src('src/html/**/*.html')
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function () {
	gulp.src('img_responsive/*')
		.pipe(gulp.dest('dist/img_responsive'));
});

gulp.task('copy-manifest.json', () => {
	gulp.src('src/manifest.json')
		.pipe(gulp.dest('dist/'));
});

gulp.task('copy-manifest', () => {
	gulp.src('src/manifest/**/*')
		.pipe(gulp.dest('dist/manifest'));
});

gulp.task('copy-serve.sh', () => {
	gulp.src('serve.sh')
		.pipe(gulp.dest('dist'));
});

gulp.task('copy-idb', () => {
	gulp.src('node_modules/idb/lib/idb.js')
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(gulp.dest('dist/js/lib'));
});

gulp.task('copy-sw', function () {
	gulp.src('src/js/sw/sw.js')
	// 	.pipe(babel({
	// 		presets: ['env']
	// 	}))
	// 	.pipe(uglify())
		.pipe(gulp.dest('dist/'));
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

gulp.task('tests', function () {
	gulp.src('tests/spec/extraSpec.js')
		.pipe(jasmine({
			integration: true,
			vendor: 'js/**/*.js'
		}));
});

gulp.task('inject:html', ['html:inject:index', 'html:inject:restaurant']);

gulp.task('html:inject:index', () => {
	const target = gulp.src('src/html/index.html');
	// It's not necessary to read the files (will speed up things), we're only after their paths:
	const sources = gulp.src(['dist/js/**/*.js', '!dist/js/restaurant.js', 'dist/**/*.css'], {read: false});

	return target
		.pipe(inject(sources), {relative: false})
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('./dist'));
});


gulp.task('html:inject:restaurant', () => {
	const target = gulp.src('dist/restaurant.html');
	// It's not necessary to read the files (will speed up things), we're only after their paths:
	const sources = gulp.src(['dist/js/**/*.js', '!dist/js/main.js', 'dist/**/*.css'], {read: false});

	return target
		.pipe(inject(sources), {relative: true})
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('./dist'));
});

