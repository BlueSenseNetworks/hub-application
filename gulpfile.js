const gulp = require('gulp');
const semver = require('semver');
const fs = require('fs');
const execSync = require('child_process').execSync;
const eslint = require('gulp-eslint');

gulp.task('lint', function () {
  return gulp.src(['**/*.js', '!node_modules/**', '!coverage/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('publish', () => {
  var repository = process.env.repository;
  var branch = process.env.branch;
  var version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;

  var suffix = '';
  var node_env = 'production';
  if (branch === 'dev' || branch === 'staging') {
    suffix = `-${branch}`;
    node_env = branch;
  }

  var tags = [
    'latest',
    semver.major(version),
    `${semver.major(version)}.${semver.minor(version)}`,
    version
  ];

  tags = tags.map(tag => `${tag}${suffix}`);

  console.log(`##teamcity[buildNumber '${version}${suffix}']`);

  tags.forEach(tag => {
    var image = `${repository}:${tag}`;
    console.log(`Building ${image}`);
    execSync(`sudo docker build --build-arg node_env=${node_env} --build-arg version=${version} -t ${image} .`);
    console.log(`Pushing ${image}`);
    execSync(`sudo docker push ${image}`);
  });

  tags.forEach(tag => execSync(`sudo docker rmi ${repository}:${tag}`));
});
