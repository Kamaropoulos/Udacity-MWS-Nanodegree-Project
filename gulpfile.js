var gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
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

gulp.task('scripts', () => {
    var options = {};
    pump([
        gulp.src('src/js/*.js'),
        minify(options),
        gulp.dest('dist/js')
    ]
    );
});

gulp.task('sw', () => {
    var options = {};
    pump([
        gulp.src('src/sw.js'),
        minify(options),
        gulp.dest('dist/')
    ]
    );
});

gulp.task('html', () => {
    return gulp.src('src/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
    return gulp.src('src/img/**')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('copy', () => {
    return gulp.src('src/manifest.json')
        .pipe(gulp.dest('dist'));
})

gulp.task('default', [
    'styles',
    'sw',
    'scripts',
    'html',
    'images',
    'copy'
]
);