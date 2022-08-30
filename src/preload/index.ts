import path from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';

import { find, imageReg, excludeDirReg } from './utils';

const tempPath = path.join(utools.getPath('temp'), 'utools.tinypng');

export async function handlePluginEnter({ code, type, payload }: Parameters<Parameters<typeof utools.onPluginEnter>[0]>[0]) {
  console.log('tempPath: ', tempPath);
  console.log('code, type, payload: ', code, type, payload);

  const stat = await fs.stat(tempPath).catch(() => null);
  if (!stat?.isDirectory()) await fs.mkdir(tempPath, { recursive: true });

  const date = Date.now();
  const config: TinypngConfig.List = {
    date,
    basedir: '',
    images: [],
    tempdir: path.join(tempPath, String(date))
  };

  const paths: string[] = [];

  if (['files', 'drop'].includes(type)) {
    type Payload = FilePayload | DropPaylod;
    const _payload = (payload as Payload[]).filter(it => it.path);
    if (_payload.length === 0) return;
    config.basedir = path.dirname(_payload[0].path);
    for (const it of _payload) {
      paths.push(...(await find(it.path, imageReg, excludeDirReg)));
    }
  } else if (type === 'window') {
    const basedir = await utools.readCurrentFolderPath();
    if (!basedir) return;
    config.basedir = basedir;
    paths.push(...(await find(basedir, imageReg, excludeDirReg)));
  }
  if (paths.length === 0) return;

  for (const it of paths) {
    const name = it.replace(config.basedir, '').replace(path.sep, '');
    config.images.push({
      name,
      path: it,
      size: (await fs.stat(it)).size,
      compress: { path: path.join(config.tempdir, name), progress: 0 }
    });
  }

  window.dispatchEvent(new CustomEvent('tinyping-compression', { detail: config }));
}

utools.onPluginEnter(handlePluginEnter);

utools.onPluginOut(async exit => {
  if (!exit) return;
  // 插件退出后清理缓存
  const dir = await fs.readdir(tempPath);
  for (const name of dir) {
    const file = path.join(tempPath, name);
    const stat = await fs.stat(file);
    stat.isFile() ? await fs.unlink(file) : await fs.rmdir(file, { recursive: true });
  }
});

export function readFile(p: string) {
  return fs.readFile(p);
}

export async function writeFile(p: string, data: ArrayBuffer) {
  const dir = path.dirname(p);
  const stat = await fs.stat(dir).catch(() => null);
  if (!stat?.isDirectory()) await fs.mkdir(dir, { recursive: true });
  return fs.writeFile(p, Buffer.from(data), 'binary');
}

export async function readDir(p: string) {
  const files = await fs.readdir(p);
  return files.map(it => path.join(p, it));
}

export async function replaceFiles(files: [string, string][]) {
  for (const [from, to] of files) {
    await new Promise((res, rej) => createReadStream(from).pipe(createWriteStream(to)).on('close', res).on('error', rej));
  }
}
