// eslint-disable-next-line import/no-unresolved
import 'virtual:windi.css';
import { createSSRApp } from 'vue';
import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';

import ElementPlus from 'element-plus';
// import 'element-plus/dist/index.css';
import '@/styles/app.scss';
// import '@/styles/element-vars.scss';
// import 'element-theme-dark';

// eslint-disable-next-line import/no-unresolved
import routes from 'virtual:generated-pages';
import App from './App';
import { store, key } from './store';


export function createApp() {
  const app = createSSRApp(App);
  app.use(store, key);

  const isServer = typeof window === 'undefined';
  const history = isServer ? createMemoryHistory() : createWebHistory(import.meta.env.BASE_URL);
  const router = createRouter({ history, routes });
  app.use(router);

  app.use(ElementPlus, { size: 'small' });
  return { app, router }
}
