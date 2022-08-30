import path from 'path';
import fs from 'fs/promises';

export const delay = (t: number) => new Promise(r => setTimeout(r, t));

export async function find(rootPath: string, include: RegExp, exclude?: RegExp): Promise<string[]> {
  const root = await fs.stat(rootPath).catch(() => null);
  if (!root) return [];
  if (root.isDirectory()) {
    const files: string[] = [];
    const dirFiles = await fs.readdir(rootPath);
    for (let it of dirFiles) {
      if (exclude && exclude.test(it)) continue;
      const childrens = await find(path.join(rootPath, it), include, exclude);
      files.push(...childrens);
    }
    return files;
  } else if (root.isFile()) {
    return include.test(path.basename(rootPath)) ? [rootPath] : [];
  } else {
    return [];
  }
}

export const imageReg = /\.(png|jpeg|jpg|webp)$/i;
export const excludeDirReg = /^(\.|node_modules)/i;
