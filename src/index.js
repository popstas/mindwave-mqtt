const mqtt = require('mqtt');
const thinkgear = require('node-thinkgear-sockets');
const config = require('../config');

let mqttClient = mqttInit();

function log(msg, type = 'info') {
  const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
  const d = new Date(Date.now() - tzoffset)
    .toISOString()
    .replace(/T/, ' ') // replace T with a space
    .replace(/\..+/, ''); // delete the dot and everything after

  console[type](`${d} ${msg}`);
}

function mqttInit() {
  log('Connecting to MQTT...');
  const client = mqtt.connect(`mqtt://${config.mqtt.host}`, {
    port: config.mqtt.port,
    username: config.mqtt.user,
    password: config.mqtt.password,
  });

  client.on('connect', () => {
    log('MQTT connected to ' + config.mqtt.host);
  });

  client.on('offline', () => {
    log('MQTT offline', 'warn');
  });

  return client;
}

function startSockets() {
  const mw = thinkgear.createClient({
    host: config.mindwave.host,
    port: config.mindwave.port,
  });

  mw.on('data', function(data){
    // don't send poor data
    if (data.poorSignalLevel == 0 && data.eSense.meditation > 0) {
      for (let name in data.eSense) {
        mqttClient.publish(`${config.mqtt.base_topic}/${name}`, `${data.eSense[name]}`);
      }
      for (let name in data.eegPower) {
        mqttClient.publish(`${config.mqtt.base_topic}/${name}`, `${data.eegPower[name]}`);
      }
    }
    mqttClient.publish(`${config.mqtt.base_topic}/signal`, `${data.poorSignalLevel}`);
    console.log('data', data);
  });

  mw.connect();
  console.log('mw: ', mw);
}

startSockets();
