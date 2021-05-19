import path from 'path';
import fs from 'fs';
import glob from 'glob';
import * as utils from './utils';
import * as tinypng from './tinypng';

window.fs = fs;
window.glob = glob;
window.utils = utils;
window.tinypng = tinypng;
window.path = path;
window.tempPath = path.join(utools.getPath('temp'), 'utools.tinypng');

utools.onPluginEnter(({ code, type, payload }) => {
  fs.existsSync(window.tempPath) || fs.mkdirSync(window.tempPath);
  console.log('用户进入插件', code, type, payload);
  let files: Tinypng.FIleItem[] = [];
  if (type === 'files') {
    files = (payload as any[]).map(it => ({
      name: it.name,
      path: it.path,
      size: fs.statSync(it.path).size
    }));
  } else if (type === 'window') {
    const path = utools.getCurrentFolderPath();
    console.log('path: ', path);
    if (!path) return;
    files = [{ name: '', path, size: 0 }];
  }
  // @ts-ignore
  files.length && window?.APP?.handleCompress(files);
});

window.document.addEventListener('keydown', async e => {
  if (e.code === 'KeyP' && e.ctrlKey && e.altKey && window?.APP?.$prompt) {
    const old = utools.db.get('proxy');
    const data: any = await window.APP.$prompt('输入代理地址', { showInput: true, inputValue: old?.data, inputPlaceholder: 'http://127.0.0.1:10809' }).catch(() => void 0);
    data && utools.db.put({ _id: 'proxy', _rev: old?._rev, data: (data.value || '').trim() });
  }
});
