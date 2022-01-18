const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
const mqtt = require('mqtt');
const express = require('express');
const thinkgear = require('node-thinkgear-sockets');
const open = require('open');
const { exec, execSync } = require('child_process');
const SysTray = require('systray2').default;
const { showConsole, hideConsole } = require('node-hide-console-window');
const { createServer: createViteServer } = require('vite');

const config = require('../config'); // TODO: exclude from build

const isMqtt = config.mqtt && config.mqtt.enabled !== false;
const webInterfaceUrl = `http://localhost:${config.server.port}`;

let mqttClient;
let inited = false;

let lastData = {}; // using in expressInit and startSockets
let systray; // global object

start();

async function start() {
  createViteExpress();

  // Systray
  if (config.systray && !inited) {
    initSysTray();
    hideConsole();
  }

  // ThinkGear Connector
  if (isWindows) await startTGC();

  // Socket from ThinkGear Connector
  startSockets();

  // static app and /mindwave route
  if (!inited) expressInit();

  // mqtt
  mqttClient = mqttInit();

  // open web interface
  if (config.openWebOnStart) {
    open(webInterfaceUrl);
  }

  inited = true;
}

async function restart() {
  return await start();
}

// TODO: ...arguments
function log(msg, type = 'info') {
  const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
  const d = new Date(Date.now() - tzoffset)
    .toISOString()
    .replace(/T/, ' ') // replace T with a space
    .replace(/\..+/, ''); // delete the dot and everything after

  console[type](`${d} ${msg}`);

  // breaks tray context menu
  /* if (systray && systray._process) {
    const menu = getSysTrayMenu();
    menu.tooltip = `${d} ${msg}`;

    console.log('menu: ', menu);
    systray.sendAction({
      type: 'update-menu',
      menu: menu,
    });
  } */
}

function mqttInit() {
  if (!isMqtt) {
    // dummy mqtt client
    return {
      publish() {},
    };
  }

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

// https://vitejs.dev/guide/ssr.html#setting-up-the-dev-server
async function createViteExpress() {
  const app = express();

  // Create Vite server in middleware mode. This disables Vite's own HTML
  // serving logic and let the parent server take control.
  //
  // In middleware mode, if you want to use Vite's own HTML serving logic
  // use `'html'` as the `middlewareMode` (ref https://vitejs.dev/config/#server-middlewaremode)
  const vite = await createViteServer({
    server: { middlewareMode: 'ssr' },
  });
  // use vite's connect instance as middleware
  app.use(vite.middlewares);

  async function viteServerHandler(req, res) {
    const url = req.originalUrl;

    try {
      // 1. Read index.html
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
      //    also applies HTML transforms from Vite plugins, e.g. global preambles
      //    from @vitejs/plugin-react
      template = await vite.transformIndexHtml(url, template);

      // 3. Load the server entry. vite.ssrLoadModule automatically transforms
      //    your ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.
      const { render } = await vite.ssrLoadModule('/src/index.ts');

      // 4. render the app HTML. This assumes entry-server.js's exported `render`
      //    function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const appHtml = await render(url);

      // 5. Inject the app-rendered HTML into the template.
      const html = template.replace(`<!--ssr-outlet-->`, appHtml);

      // 6. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      // If an error is caught, let Vite fix the stracktrace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  }
  app.use('*', viteServerHandler);

  app.listen(config.server.vitePort);

  log('Vite inited on port ' + config.server.vitePort);
}

// start ThinkGear Connector if not started
async function startTGC() {
  return new Promise((resolve, reject) => {
    const list = execSync('tasklist');
    const isTGCRunning = `${list}`.split('\n').filter((line) => line.match(/ThinkGear/)).length > 0;

    if (!isTGCRunning) {
      log('Launch ThinkGear Connector');
      exec(process.cwd() + '\\bin\\tgc\\ThinkGearConnector.exe', (err, stdout, stderr) => {
        if (stdout) log(stdout);
        if (stderr) log(stderr);
        if (err) {
          log(err);
          reject(err);
        }
      });
      setTimeout(resolve, 5000);
    } else {
      resolve();
    }
  });
}

function startSockets() {
  const mw = thinkgear.createClient({
    host: config.mindwave.host,
    port: config.mindwave.port,
  });

  let i = 0;

  mw.on('data', function (data) {
    lastData = { signal: data.poorSignalLevel };

    // don't send poor data
    if (data.poorSignalLevel === 0 && data.eSense.meditation > 0) {
      for (let name in data.eSense) {
        mqttClient.publish(`${config.mqtt.base_topic}/${name}`, `${data.eSense[name]}`);
        lastData[name] = `${data.eSense[name]}`;
      }
      for (let name in data.eegPower) {
        mqttClient.publish(`${config.mqtt.base_topic}/${name}`, `${data.eegPower[name]}`);
        lastData[name] = `${data.eegPower[name]}`;
      }
    }

    // don't send signal 200 too fast
    if (lastData.signal === 200 && i % 60 === 0) {
      mqttClient.publish(`${config.mqtt.base_topic}/signal`, `${data.poorSignalLevel}`);
      log(`signal: ${lastData.signal}, meditation: ${lastData.meditation}`);
    }

    if (data.poorSignalLevel < 200) {
      mqttClient.publish(`${config.mqtt.base_topic}/signal`, `${data.poorSignalLevel}`);
      log(`signal: ${lastData.signal}, meditation: ${lastData.meditation}`);
    }

    // console.log('lastData', lastData);

    i++;
  });

  mw.connect();
}

function expressInit() {
  const app = express();

  // cors
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // GET /mindwave
  app.get('/mindwave', (req, res) => {
    res.json(lastData);
  });

  app.use('/next', express.static('dist'));

  app.use(express.static('public'));

  app.listen(config.server.port);
}

function getSysTrayMenu() {
  const itemOpen = {
    title: 'Open Web interface',
    tooltip: '',
    click() {
      open(webInterfaceUrl);
    },
  };

  const itemShowConsole = {
    title: 'Show console',
    tooltip: '',
    click() {
      showConsole();
    },
  };

  const itemHideConsole = {
    title: 'Hide console',
    tooltip: '',
    click() {
      hideConsole();
    },
  };

  const items = [itemOpen, SysTray.separator, itemShowConsole, itemHideConsole];

  if (isMqtt)
    items.push({
      title: 'Reconnect MQTT',
      tooltip: '',
      click() {
        restart();
      },
    });

  items.push(SysTray.separator);

  items.push({
    title: 'Exit',
    tooltip: '',
    click() {
      systray.kill(true);
    },
  });

  return {
    // you should use .png icon on macOS/Linux, and .ico format on Windows
    icon: isWindows ? './assets/trayicon_white.ico' : './assets/trayicon_white.png',
    // a template icon is a transparency mask that will appear to be dark in light mode and light in dark mode
    isTemplateIcon: os.platform() === 'darwin',
    title: 'mindwave-web',
    tooltip: 'mindwave-web',
    items: items,
  };
}

function initSysTray() {
  const menu = getSysTrayMenu();

  systray = new SysTray({
    // global set
    menu: menu,
    debug: false,
    copyDir: true, // copy go tray binary to an outside directory, useful for packing tool like pkg.
  });

  systray.onClick((action) => {
    if (action.item.click != null) {
      action.item.click();
    }
  });

  // Systray.ready is a promise which resolves when the tray is ready.
  systray
    .ready()
    .then(() => {
      log('systray started');
    })
    .catch((err) => {
      log('systray failed to start: ' + err.message);
    });
}
