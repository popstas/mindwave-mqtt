Send Mindwave Mobile data to MQTT.

Web interface for meditation.

- `npm start` for Mindwave to MQTT start
- `public` directory contains SPA

App uses ThinkGear Connection socket as data source, not COM port!

## Web interface
Replace `https://private.popstas.ru/mindwave-mqtt.config.json` in `public/script.js` to your url. Copy `mindwave-mqtt.config.json` and fill your credentials.

`mindwaveUrl` Url should return json like this:

```json
{
  "meditation": "37",
  "attention": "30",
  "lowAlpha": "19615",
  "highAlpha": "11123",
  "lowBeta": "7721",
  "highBeta": "9065",
  "lowGamma": "2834",
  "highGamma": "3507",
  "signal": "0"
}
```