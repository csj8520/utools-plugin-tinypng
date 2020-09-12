import path from 'path';
import fs from 'fs';
import * as utils from './utils';
import * as tinypng from './tinypng';

window.fs = fs;
window.utils = utils;
window.tinypng = tinypng;
window.path = path;
window.tempPath = path.join(utools.getPath('temp'), 'utools.tinypng');

utools.onPluginEnter(({ code, type, payload }) => {
  fs.existsSync(window.tempPath) || fs.mkdirSync(window.tempPath);
  console.log('用户进入插件', code, type, payload);
  if (type === 'files') {
    const files = (payload as any[]).map(it => ({
      name: it.name,
      path: it.path,
      size: fs.statSync(it.path).size
    }));
    // @ts-ignore
    window?.APP?.handleCompress(files);
  }
});
