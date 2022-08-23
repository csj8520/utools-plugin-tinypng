import fs from 'fs/promises';
import path from 'path';

import { random, bytes } from './utils';

export * from './tinypng';

export { random, bytes };

export function test() {
  console.log('test success');
}

export const aa = 123;
export let bb = 123;
export var cc = 123;

const tempPath = path.join(utools.getPath('temp'), 'utools.tinypng');
const nativeId = utools.getNativeId();

const dbKey = `config-${nativeId}`;

utools.onPluginEnter(async ({ code, type, payload }) => {
  utools.db.get(dbKey);
  console.log('tempPath: ', tempPath);
  const stat = await fs.stat(tempPath).catch(() => null);
  if (!stat?.isDirectory()) await fs.mkdir(tempPath, { recursive: true });

  console.log('用户进入插件111', code, type, payload);

  // let files: Tinypng.FIleItem[] = [];
  // if (type === 'files') {
  //   files = (payload as any[]).map(it => ({
  //     name: it.name,
  //     path: it.path,
  //     size: fs.statSync(it.path).size
  //   }));
  // } else if (type === 'window') {
  //   const path = await utools.readCurrentFolderPath();
  //   console.log('path: ', path);
  //   if (!path) return;
  //   files = [{ name: '', path, size: 0 }];
  // }
});
export default function () {
  console.log('test default success 2');
}
