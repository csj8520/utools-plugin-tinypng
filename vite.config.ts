import { defineConfig } from 'vite';
import utools from 'vite-plugin-utools';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  server: {
    port: 3100
  },
  build: {
    // minify: false
  },
  plugins: [
    vue(),
    utools({
      preload: {
        path: './src/preload/index.ts',
        watch: true,
        name: 'window.preload'
      },
      buildUpx: {
        pluginPath: './plugin.json',
        outDir: 'upx',
        outName: '[pluginName]_[version].upx'
      }
    })
  ]
});
