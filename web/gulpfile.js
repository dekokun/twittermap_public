var gulp = require('gulp'),
    watch = require('gulp-watch'),
    browserify = require('browserify'),
    uglify = require('gulp-uglify'),
    source = require("vinyl-source-stream"),
    buffer = require('vinyl-buffer');
 
// Basic usage 
gulp.task('browserify', function() {
    // Single entry point to browserify 
    browserify({
          entries: ['src/main.js'],
          insertGlobals : true,
          debug : false
        })
        .plugin('licensify')
        .bundle()
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(uglify({
          output:{
            comments: /generated by licensify/
          }
        }))
        .pipe(gulp.dest('.'))
});

gulp.task('watch', function() {
  gulp.watch('src/*', ['browserify']);
});

gulp.task('default', ['browserify', 'watch']);

