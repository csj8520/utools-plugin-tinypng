import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createPreloadPlugin, createUpxPlugin } from 'vite-plugin-utools-helper';
import { createStyleImportPlugin, ElementPlusResolve } from 'vite-plugin-style-import';

export default defineConfig({
  base: './',
  server: {
    port: 3100
  },
  plugins: [
    vue(),
    createStyleImportPlugin({
      resolves: [ElementPlusResolve()]
    }),
    createPreloadPlugin({
      // name: 'window.preload',
      // path: 'src/preload/index.ts',
    }),
    createUpxPlugin({
      // outDir: 'upx',
      outFileName: 'tinypng-[version].upx'
    })
  ]
});
