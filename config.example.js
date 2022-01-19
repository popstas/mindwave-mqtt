module.exports = {
  mqtt: {
    enabled: false,
    host: 'localhost',
    port: 1883,
    user: '',
    password: '',
    base_topic: 'mindwave',
  },
  mindwave: {
    host: 'localhost',
    port: 13854,
  },
  server: {
    port: 9301,
    vitePort: 9302,
  },
  systray: true,
  openWebOnStart: true,
};
