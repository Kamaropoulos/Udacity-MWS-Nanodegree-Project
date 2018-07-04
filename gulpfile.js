var gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
var htmlmin = require('gulp-htmlmin');
var uglifyjs = require('uglify-es');
var composer = require('gulp-uglify/composer');
var pump = require('pump');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');

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

gulp.task('images-compress', () => {
    return gulp.src('src/img/**')
        .pipe(imagemin({
            interlaced: true,
            progressive: true,
            optimizationLevel: 5}))
        .pipe(gulp.dest('dist/img'));
});

gulp.task('copy', () => {
    return gulp.src('src/manifest.json')
        .pipe(gulp.dest('dist'));
})

gulp.task('webp', ['images-compress'], () =>
    gulp.src('dist/img/*.jpg')
        .pipe(webp())
        .pipe(gulp.dest('dist/img'))
);

gulp.task('default', [
    'styles',
    'sw',
    'scripts',
    'html',
    'webp',
    'copy'
]
);