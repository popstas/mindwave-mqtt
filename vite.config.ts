import path from 'path';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from "@vitejs/plugin-vue-jsx";
import windiCSS from "vite-plugin-windicss";
import pages from "vite-plugin-pages";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/next",
  resolve: {
    alias: { "@/": `${path.resolve(__dirname, "src")}/` },
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
