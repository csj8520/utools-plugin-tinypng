import path from 'node:path';
import fs from 'node:fs/promises';
import { createGzip } from 'node:zlib';
import { builtinModules } from 'node:module';
import { createReadStream, createWriteStream } from 'node:fs';

import { findExports } from 'mlly';
import { createPackage } from 'asar';
import { build, PluginOption, ResolvedConfig } from 'vite';

const cwd = process.cwd();

export interface PreloadPluginOption {
  name?: string;
  path?: string;
  outDir?: string;
  outFileName?: string;
}

const defaultPreloadOptions: Required<PreloadPluginOption> = {
  name: 'window.preload',
  path: 'src/preload/index.ts',
  outDir: 'dist',
  outFileName: 'preload.js'
};

export function createPreloadPlugin(options?: PreloadPluginOption): PluginOption {
  const op = Object.assign({}, defaultPreloadOptions, options || {});

  return {
    name: 'vite:utools-build-preload',
    configResolved: async config => {
      await build({
        configFile: false,
        mode: config.mode,
        build: {
          outDir: options?.outDir ?? config.build?.outDir ?? op.outDir,
          minify: false,
          emptyOutDir: true,
          watch: config.mode === 'development' ? {} : null,
          lib: {
            entry: op.path,
            formats: ['cjs']
          },
          rollupOptions: {
            external: builtinModules,
            output: {
              entryFileNames: op.outFileName,
              exports: 'named'
            }
          }
        },
        plugins: [
          {
            name: 'vite:utools-inject-preload',
            apply: 'build',
            enforce: 'post',
            transform(code, id, _options) {
              if (!id.includes(op.path)) return code;
              const names = [];
              const exports = findExports(code);
              const injectDefaultPreload = `${op.name} = ${op.name} || {};\n`;
              let offset = injectDefaultPreload.length;
              code = injectDefaultPreload + code;
              for (const it of exports.sort((a, b) => a.start - b.start)) {
                const length = code.length;
                if (it.type === 'declaration') {
                  code = code.slice(0, it.start + offset) + it.code.replace(/export\s*/, '') + code.slice(it.end + offset);
                  names.push(...it.names);
                } else if (it.type === 'named') {
                  code = code.slice(0, it.start + offset) + code.slice(it.end + offset);
                  names.push(...it.names);
                } else if (it.type === 'star') {
                  const name = `_dynamicExports_${it.specifier?.replace('./', '').replace(/[\/\-]/, '_')}`;
                  code = code.slice(0, it.start + offset) + `import * as ${name} from "${it.specifier}"` + code.slice(it.end + offset);
                  names.push(`...${name}`);
                } else {
                  code = code.slice(0, it.start + offset) + `${op.name}.default = ` + code.slice(it.end + offset);
                }
                offset += code.length - length;
              }
              code += `Object.assign(${op.name}, { ${names.join(', ')} })`;
              return code;
            }
          }
        ]
      });
    }
  };
}

export interface UpxPluginOption {
  pluginPath?: string;
  outDir?: string;
  outFileName?: string;
}

const defaultUpxOptions: Required<UpxPluginOption> = {
  pluginPath: 'public/plugin.json',
  outDir: 'upx',
  outFileName: '[pluginName]-[version].upx'
};

export function createUpxPlugin(options?: UpxPluginOption): PluginOption {
  const op = Object.assign({}, defaultUpxOptions, options || {});
  let config: ResolvedConfig;
  return {
    name: 'vite:utools-build-upx',
    apply: 'build',
    configResolved(c) {
      config = c;
    },
    async closeBundle() {
      const pluginConfig = JSON.parse((await fs.readFile(path.join(cwd, op.pluginPath))).toString());
      const tempAsar = path.join(cwd, op.outDir, '.temp.asar');

      // ref: https://github.com/13enBi/vite-plugin-utools/blob/main/src/buildUpx.ts
      await createPackage(config.build.outDir, tempAsar);

      const outFileName = op.outFileName.replace(/\[(\w+)\]/g, ($0, $1) => pluginConfig[$1] || $0);

      await new Promise((resolve, reject) =>
        createReadStream(tempAsar)
          .pipe(createGzip())
          .pipe(createWriteStream(path.join(cwd, op.outDir, outFileName)))
          .on('error', reject)
          .on('finish', resolve)
      );
      await fs.unlink(tempAsar);
    }
  };
}
