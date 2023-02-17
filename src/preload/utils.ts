import path from 'path';
import fs from 'fs/promises';

export const delay = (t: number) => new Promise(r => setTimeout(r, t));

export async function find(rootPath: string, includeFile: RegExp, exclude?: RegExp): Promise<string[]> {
  if (exclude?.test(rootPath)) return [];
  const root = await fs.stat(rootPath).catch(() => null);
  if (!root) return [];
  if (root.isFile() && includeFile.test(rootPath)) return [rootPath];
  if (root.isDirectory()) {
    const files: string[] = [];
    const dirFiles = await fs.readdir(rootPath);
    for (let it of dirFiles) {
      const childrens = await find(path.join(rootPath, it), includeFile, exclude);
      files.push(...childrens);
    }
    return files;
  } else {
    return [];
  }
}

export const imageReg = /\.(png|jpeg|jpg|webp)$/i;
export const excludeDirReg = /^(\.|node_modules)/i;
