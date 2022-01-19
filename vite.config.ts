import path from 'path';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from "@vitejs/plugin-vue-jsx";
import windiCSS from "vite-plugin-windicss";
import pages from "vite-plugin-pages";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: { "@/": `${path.resolve(__dirname, "src")}/` },
  },
  server: {
    // hmr: false,
    hmr: {
      // host: 'localhost',
      // port: 443,
    },
    // https: true,
    // cors: true,
  },
  plugins: [
    vue(),
    pages({
      extensions: ["vue", "ts", "js", "jsx", "tsx"],
    }),
    vueJsx(),
    windiCSS(),
  ],
})
