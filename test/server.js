'use strict';

/*
 global module,
 require
 */

require('colors');

const fs      = require('fs'),
      path    = require('path'),
      restify = require('restify');

const server       = restify.createServer({
        name:    'test-server',
        version: '0.0.1'
      }),
      routes       = {},
      resourcePath = path.join(__dirname, 'resources');
      
/**
 * sends a JSON string
 *
 * @param req
 * @param res
 * @param next
 * @returns {*|Promise.<string>}
 */
routes.sendJson = (req, res, next) => {
  return res.json({
    foo:  'bar',
    test: true
  });
};

/**
 * sends a plain text string
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
routes.sendText = (req, res, next) => {
  res.setHeader('Content-Type', 'text/plain');
  return res.send('Lorem ipsum dolor sit amet.');
};

/**
 * sends an image file
 *
 * @param req
 * @param res
 * @param next
 */
routes.sendImage = (req, res, next) => {
  return fs.readFile(path.join(resourcePath, 'image.png'), (error, image) => {
    if (error) {
      return next(error);
    }

    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(image),
      'Content-Type':   'image/png'
    });
    res.write(image);
    res.end();

    return next();
  });
};

server.get('/json', routes.sendJson);
server.get('/text', routes.sendText);
server.get('/image', routes.sendImage);

server.listen(8080, () => {
  process.send({
    server: {
      name: server.name,
      url:  server.url
    },
    event:  'ready'
  });
});
