const config = require('../config');
const express = require('express'); // TODO: exclude from build

let lastData;
const lastRandom = {
  meditation: Math.random() * 100,
  attention: Math.random() * 100,
}

start();

function start() {
  const app = express();
  // cors
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // GET /mindwave
  app.get('/mindwave', (req, res) => {
    lastData = {
      meditation: getRandom('meditation'),
      attention: getRandom('attention'),
      signal: 0,
    }
    res.json(lastData);
  });
  app.listen(config.server.port);
}

function getRandom(name) {
  let val = parseInt(lastRandom[name] + Math.random() * 2.5 + Math.random() * -2);
  val = Math.min(100, val);
  val = Math.max(1, val);
  lastRandom[name] = val;
  return val;
}
