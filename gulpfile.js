const gulp      = require('gulp');
const fs        = require('fs');
const pkg       = require('./package.json');

gulp.task('updateVersion', done => {
    const date = new Date();
    let file = fs.readFileSync(__dirname + '/index.js').toString('utf8');
    file = file.replace(/2020-20\d\d/, '2020-' + date.getFullYear());
    file = file.replace(/v \d.\d.\d/, 'v ' + pkg.version);
    file = file.replace(/\(20\d\d_\d\d_\d\d\)/, '(' + date.getFullYear() + '_' + (date.getMonth() + 1).toString().padStart(2, '0') + '_' + (date.getDate()).toString().padStart(2, '0') + ')');

    fs.writeFileSync(__dirname + '/index.js', file);
    done();
});

gulp.task('default', gulp.series('updateVersion'));
