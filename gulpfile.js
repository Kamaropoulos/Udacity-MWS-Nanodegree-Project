var gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
let minifyjs = require('gulp-js-minify');

gulp.task('minify-css', () => {
    return gulp.src('src/css/*.css')
      .pipe(cleanCSS({compatibility: 'ie8'}))
      .pipe(gulp.dest('dist/css'));
  });

gulp.task('minify-js', function(){
    gulp.src('src/js/*.js')
      .pipe(minifyjs())
      .pipe(gulp.dest('dist/js'));
});