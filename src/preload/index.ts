import fs from 'fs/promises';
import path from 'path';
import { find, imageReg, excludeDirReg } from './utils';

// export * from './tinypng';
export * from './utils';

const tempPath = path.join(utools.getPath('temp'), 'utools.tinypng');

interface FilePayload {
  isDirectory: boolean;
  isFile: boolean;
  name: string;
  path: string;
}

// const configs: TinypngConfig = { list: [] };

utools.onPluginEnter(async ({ code, type, payload }) => {
  console.log('tempPath: ', tempPath);
  const stat = await fs.stat(tempPath).catch(() => null);
  if (!stat?.isDirectory()) await fs.mkdir(tempPath, { recursive: true });

  console.log('用户进入插件', code, type, payload);

  const config: TinypngConfig.List = { date: Date.now(), basedir: '', images: [] };

  const paths: string[] = [];

  if (type === 'files') {
    config.basedir = path.dirname((payload as FilePayload[])[0].path);
    for (const it of payload as Array<FilePayload>) {
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
    config.images.push({
      name: it.replace(config.basedir, '').replace(path.sep, ''),
      path: it,
      size: (await fs.stat(it)).size
    });
  }

  window.dispatchEvent(new CustomEvent('tinyping-compression', { detail: config }));
});

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
