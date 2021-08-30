const { createServer, build } = require('vite');
const { builtinModules } = require('module');
const vue = require('@vitejs/plugin-vue');
const VitePluginElementPlus = require('vite-plugin-element-plus').default;
const path = require('path');

const mode = (process.env.MODE = process.env.MODE || 'development');
const dev = mode === 'development';

/** @type {import('vite').InlineConfig} */
const preloadBaseConfig = {
  mode,
  build: {
    outDir: 'dist',
    assetsDir: '.',
    minify: false,
    lib: {
      entry: 'src/preload/index.ts',
      formats: ['cjs']
    },
    rollupOptions: {
      external: builtinModules,
      output: {
        entryFileNames: 'preload.js'
      }
    },
    emptyOutDir: true,
    watch: dev ? {} : null
  }
};
/** @type {import('vite').InlineConfig} */
const viewBaseConfig = {
  mode,
  root: path.join(process.cwd(), 'src/view'),
  publicDir: path.join(process.cwd(), 'public'),
  base: './',
  resolve: {
    alias: { '@': path.join(process.cwd(), 'src') }
  },
  build: {
    outDir: path.join(process.cwd(), 'dist'),
    assetsDir: '.',
    minify: !dev && 'terser',
    emptyOutDir: false,
    watch: dev ? {} : null,
    terserOptions: {
      ecma: 2020,
      compress: {
        passes: 2
      },
      safari10: false
    }
  },
  server: {
    port: 3100
  },
  plugins: [
    vue(),
    VitePluginElementPlus({
      useSource: true,
    })
  ]
};

(async () => {
  await build(preloadBaseConfig);

  if (dev) {
    const serve = await createServer(viewBaseConfig);
    await serve.listen();
  } else {
    await build(viewBaseConfig);
  }
})();
