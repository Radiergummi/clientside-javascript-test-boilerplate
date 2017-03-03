# clientside-javascript-test-boilerplate
Simple boilerplate to test clientside javascript code written in ES6,  using PhantomJS, ES6 tests and modules

## Features
- Test your ES6 client code
- Write your tests in ES6
- Use modules both in source and in tests
- Use multiple test files for easier file system structure
- Automatically spin up and shut down an HTTP server for AJAX call testing
- Emulate a browser event by attaching your library to the PhantomJS window object
- Automate your tests with TravisCI

## Why should I care?
This is a simple boilerplate to test your clientside code. When attempting to create tests for a client library I'm writing, I noticed all the hassles required to do so:  
You don't want to perform tests manually in a graphical browser, especially if you want to be able to use CI environments like Travis. Therefore, you use PhantomJS, a glorious headless browser, running on the command line entirely. But oh, snap! It doesn't support ES6 yet. So you set out to use Babel to transpile your ES6 code for the tests, which you would do anyway. But oh, snap! Imports or require won't work here. So you again go google a bit, after all you don't want webpack for your tests, which would be overkill for a single library. You integrate Browserify to bundle your transpiled source code, but oh, snap! The tests won't work, because you made use of those nice ES6 features in your tests, too. So you repeat the whole process for your tests, and BAM! Another few hundred lines of code and several modules just for testing your freaking client side code.  
But at last, you have plugged together exactly what I have already done for you in this repo.
