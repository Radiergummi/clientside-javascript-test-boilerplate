'use strict';

/*
 global module,
 require,
 process
 */

require('colors');

const browserify        = require('browserify'),
      cp                = require('child_process'),
      fork              = cp.fork,
      fs                = require('fs'),
      spawn             = cp.spawn,
      path              = require('path'),

      children          = [],
      modulePath        = path.resolve(path.join(__dirname, '..', 'node_modules'));

/**
 * the libraries main file to bundle for the tests.
 * assumed to be located at {projectRoot}/dist
 *
 * @type {string}
 */
const libraryModulePath = 'example.js';

/**
 * the libraries module name as it should be registered
 * in the global namespace for the tests. So if you want
 * your module "Example" to be attached to the window
 * variable of the PhantomJS runtime scope, set this to
 * "Example".
 *
 * @type {string}
 */
const libraryModuleName = 'Example';

// catch kill events
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

// kill children on process exit
process.on('exit', (exitCode) => {
  if (exitCode === 1) {
    logError(`Stopping tests, killing ${children.length} child processes`);
  } else {
    logSuccess(`Cleaning up, killing ${children.length} child processes`);
  }
  children.forEach(child => child.kill());
});

// start the server and kickoff the chain
Promise.resolve()
  .then(startServer)
  .then(startBabelSource)
  .then(startBabelTests)
  .then(startBrowserifySource)
  .then(startBrowserifyTests)
  .then(startTests)
  .catch(error => {
    logError(error);
    process.exit(1);
  })
  .then(() => process.exit(0));

/**
 * start the test server
 */
function startServer () {
  return new Promise((fulfill, reject) => {
    const server = fork(path.join(__dirname, 'server'));

    children.push(server);

    server.on('message', data => {
      if (data.event === 'ready') {
        logInfo(`Test server listening at ${data.server.url}`);
        return fulfill();
      }

      if (data.event === 'failed') {
        return reject(data.message);
      }
    });

  });
}

/**
 * start the babel compilation of module sources
 */
function startBabelSource () {
  return new Promise((fulfill, reject) => {
    const babelSource = fork(
      path.join(modulePath, '.bin', 'babel'),
      'src --out-dir dist --source-maps --presets latest'.split(' '),
      { silent: true }
    );

    children.push(babelSource);

    babelSource.on('exit', exitCode => {
      if (exitCode > 0) {
        return reject('Failed compiling source files');
      }

      logSuccess('Finished compiling source files');

      return fulfill();
    });

    babelSource.stdout.on('data', logInfo);
    babelSource.stderr.on('data', logError);
  });
}

/**
 * start the babel compilation of module tests
 */
function startBabelTests () {
  return new Promise((fulfill, reject) => {
    const babelTests = fork(
      path.join(modulePath, '.bin', 'babel'),
      'test/specs --out-dir test --presets es2015'.split(' '),
      { silent: true }
    );

    children.push(babelTests);

    babelTests.on('exit', exitCode => {
      if (exitCode > 0) {
        return reject('Failed compiling source files');
      }

      logSuccess('Finished compiling test files');

      return fulfill();
    });

    babelTests.stdout.on('data', logInfo);
    babelTests.stderr.on('data', logError);

  });
}

function startBrowserifySource () {
  return new Promise((fulfill, reject) => {
    const browserifySource = fork(
      path.join(modulePath, '.bin', 'browserify'),
      `dist/${libraryModuleFile} --outfile test/bundle.js -s ${libraryModuleName}`.split(' '),
      { silent: true }
    );

    children.push(browserifySource);

    browserifySource.stdout.on('data', logInfo);
    browserifySource.stderr.on('data', logError);
    browserifySource.on('close', exitCode => {
      if (exitCode > 0) {
        return reject('Bundling source files failed');
      }

      logSuccess('Finished bundling source files successfully');
      return fulfill();
    });
  });
}

function startBrowserifyTests () {
  return new Promise((fulfill, reject) => {
    const specFiles = fs.readdirSync(path.join(__dirname, 'specs')).reduce((files, file) => {
      return files + ` test${path.sep}${file}`;
    }, '');

    const browserifyTests = fork(
      path.join(modulePath, '.bin', 'browserify'),
      (specFiles + ' --outfile test/spec.bundle.js').split(' '),
      { silent: true }
    );

    children.push(browserifyTests);

    browserifyTests.stdout.on('data', logInfo);
    browserifyTests.stderr.on('data', logError);
    browserifyTests.on('close', exitCode => {
      if (exitCode > 0) {
        return reject('Bundling test files failed');
      }

      logSuccess('Finished bundling test files successfully');
      return fulfill();
    });
  });
}

/**
 * start the tests
 */
function startTests () {
  return new Promise((fulfill, reject) => {
    const phantomJs = spawn(path.join(modulePath, '.bin', 'mocha-phantomjs'), [
      path.join(__dirname, 'testRunner.html'),
      '-p',
      path.join(modulePath, 'phantomjs-prebuilt', 'bin', 'phantomjs')
    ], { silent: true });

    children.push(phantomJs);

    phantomJs.stdout.on('data', data => console.log(
      data
        .toString()
        .trim()
        .replace(/^(\n|\r)*/gm, '')
        .replace(/(\n|\r)*$/gm, '')
    ));
    phantomJs.stderr.on('data', logError);
    phantomJs.on('close', exitCode => {
      if (exitCode > 0) {
        return reject('tests failed');
      }

      logSuccess('finished testing successfully');
      return fulfill();
    });
  });
}

function logInfo (message) {
  message = message.toString().trim().replace(/^(\n|\r)*/, '').replace(/(\n|\r)*$/, '');

  if (message.length < 2) {
    return;
  }

  return console.log(new Date().toLocaleString().bold.white + '\t' + message.cyan);
}

function logSuccess (message) {
  message = message.toString().trim().replace(/^(\n|\r)*/, '').replace(/(\n|\r)*$/, '');

  if (message.length < 2) {
    return;
  }

  return console.log(new Date().toLocaleString().bold.white + '\t' + message.green);
}

function logError (message) {
  message = message.toString().trim().replace(/^(\n|\r)*/, '').replace(/(\n|\r)*$/, '');

  if (message.length < 1) {
    return;
  }

  return console.log(new Date().toLocaleString().bold.white + '\t' + message.red);
}
