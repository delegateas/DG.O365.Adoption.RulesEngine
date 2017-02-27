/// <binding BeforeBuild='compile' />
var gulp = require("gulp");
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');

gulp.task("compile", function () {
    var tsResult = tsProject.src()
            .pipe(tsProject());
    tsResult.js.pipe(gulp.dest('.'));
});

gulp.task("default", ['compile']);

gulp.task('watch', ['default'], function () {
    gulp.watch(['src/*.ts'], ['default']);
});