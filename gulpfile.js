
var gulp        = require('gulp');
var util        = require('gulp-util');
var ts          = require('gulp-typescript');
var sourcemaps  = require('gulp-sourcemaps');
var clean       = require('gulp-clean');
var bs          = require('browser-sync');
var runSequence = require('run-sequence');
 
gulp.task('clean', function () {
  return gulp.src(i['dist', 'tmp'], {read: false})
     .pipe(clean());
});

var tsFiles = 'src/**/*.ts';

gulp.task('tsc-app', function () {
  compileTs(tsFiles);
});

gulp.task('watch-ts', function () {
  return gulp.watch(tsFiles, function(file) {
    util.log('Compiling ' + file.path + '...');
    return compileTs(file.path, true);
  });
});

function compileTs(files) {
  var tsProject = ts.createProject('tsconfig.json');
  var allFiles = [].concat(files, 'typings/**/*.d.ts');
  var res = gulp.src(allFiles)
     .pipe(sourcemaps.init())
     .pipe(tsProject());

  return res.js
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('tmp'));
}

function startBrowsersync (config) {
  bsIns = bs.create();
  bsIns.init(config);
  bsIns.reload();
}

gulp.task('serve', function() {
  runSequence(
    ['tsc-app'],
    ['watch-ts'],
    function() {
      startBrowsersync({
        port: 3000,
        open: false,
        injectChanges: false,
        server: {
            baseDir: './src/',
            routes: {
                '/node_modules': 'node_modules',
                '/src': 'src',
                '/tmp': 'tmp'
            },
            files: [
                'src/index.html',
                'src/systemjs.conf.js',
                'tmp/**/*.js'
            ]
        }
    });
  });
});