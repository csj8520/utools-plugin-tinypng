import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createStyleImportPlugin, ElementPlusResolve } from 'vite-plugin-style-import';

import { createPreloadPlugin, createUpxPlugin } from './scripts/plugin';

export default defineConfig({
  base: './',
  server: {
    port: 3100
  },
  build: {
    emptyOutDir: false
  },
  plugins: [
    vue(),
    createStyleImportPlugin({
      resolves: [ElementPlusResolve()]
    }),
    createPreloadPlugin({
      name: 'window.preload',
      path: 'src/preload/index.ts',
      outDir: 'dist',
      outFileName: 'preload.js'
    }),
    createUpxPlugin({
      pluginPath: 'public/plugin.json',
      outDir: 'upx',
      outFileName: 'tinypng-[version].upx'
    })
  ]
});
