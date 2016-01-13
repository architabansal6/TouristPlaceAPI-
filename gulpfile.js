var fs = require('fs'),
    runsequence = require('run-sequence'),
    argv = require('yargs').argv
    gulp = require('gulp'),
    gzip = require('gulp-gzip'),
    tar = require('gulp-tar'),
    ssh = require('gulp-ssh')({
        ignoreErrors: true,
        sshConfig: {
            host: '52.25.46.2',
            port: 22,
            username: 'ubuntu',
            privateKey: fs.readFileSync('./support/keys/id_rsa')
        }
    }),
    dirname = getDateString(new Date()),
    pkg = require('./package.json');

gulp.task('build', function () {
    return gulp.src(['*','*/*.*', '!dist', '!dist.tar.gz'])
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['build']);

gulp.task('deploy', function () {
    runsequence('create-artifact', 'create-deployment-dir', 'copy-artifact', 'extract-artifact', 'flip-link');
});

gulp.task('create-artifact', function () {
    return gulp.src(['dist/**/*'])
        .pipe(tar('dist.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('.'));
});

gulp.task('create-deployment-dir', function () {
    return ssh
        .exec(['mkdir -p /var/www/deployments/' + pkg.name + '/releases/' + dirname + '/logs', 'pwd'], {
            filePath: 'commands.log'
        })
        .pipe(gulp.dest('logs'));
});

gulp.task('copy-artifact', function () {
    return gulp.src('dist.tar.gz')
        .pipe(ssh.sftp('write', '/var/www/deployments/' + pkg.name + '/releases/' + dirname + '/dist.tar.gz'));
});

gulp.task('extract-artifact', function () {
    return ssh.exec(['cd /var/www/deployments/' + pkg.name + '/releases/' + dirname + ' && gzip -d dist.tar.gz && tar -xvmf dist.tar && rm -f dist.tar'], {
        filePath: 'commands.log'
    })
        .pipe(gulp.dest('logs'));
});

gulp.task('flip-link', function () {
    return ssh.exec(['ln -sfT /var/www/deployments/' + pkg.name + '/releases/' + dirname + ' /var/www/deployments/' + pkg.name + '/current'], {
        filePath: 'commands.log'
    })
        .pipe(gulp.dest('logs'));
});

gulp.task('restart-service', function () {
    return gulpSSH.exec("forever stop " + pkg.name + "-" + argv.port + "; sleep 3; cd /var/www/deployments/" + pkg.name + "/current; PORT=" + argv.port + " NODE_ENV=" + argv.env + " forever start --uid='" + pkg.name + "-" + argv.port + "' -e /var/www/deployments/ " + pkg.name + "/current/logs/forever.err --append app.js ", {filePath: 'commands.log'})
        .pipe(gulp.dest('logs'));
});

function getDateString(currentDate) {
    return currentDate.getFullYear().toString() + getZeroBasedIndex(currentDate.getMonth() * 1 + 1) +
        getZeroBasedIndex(currentDate.getDate()) + getZeroBasedIndex(currentDate.getHours()) +
        getZeroBasedIndex(currentDate.getMinutes()) + getZeroBasedIndex(currentDate.getSeconds());
}

function getZeroBasedIndex(number) {
    return number * 1 < 10 ? '0' + number : number;
}