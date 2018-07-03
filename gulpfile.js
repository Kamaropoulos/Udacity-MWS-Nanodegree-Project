var gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
// let minifyjs = require('gulp-js-minify');
var htmlmin = require('gulp-htmlmin');
var uglifyjs = require('uglify-es');
var composer = require('gulp-uglify/composer');
var pump = require('pump');
const imagemin = require('gulp-imagemin');

var minify = composer(uglifyjs, console);

gulp.task('styles', () => {
    return gulp.src('src/css/*.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('scripts', function() {
    var options = {};
    pump([
        gulp.src('src/js/*.js'),
        minify(options),
        gulp.dest('dist/js')
      ]
    );
});

gulp.task('sw', function() {
    var options = {};
    pump([
        gulp.src('src/sw.js'),
        minify(options),
        gulp.dest('dist/')
      ]
    );
});

gulp.task('html', function () {
    return gulp.src('src/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist'));
});

gulp.task('images', () =>
    gulp.src('src/img/**')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'))
);

gulp.task('default', [
                        'styles',
                        'sw',
                        'scripts',
                        'html',
                        'images'
                    ]
        );