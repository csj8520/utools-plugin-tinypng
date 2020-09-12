import fs from 'fs';
import https from 'https';
import { random } from './utils';

export function upload(path: string, cb = (op: Tinypng.Progress): void => {}): Promise<Tinypng.Response> {
  return new Promise((resolove, reject) => {
    let send = 0;
    const req = https.request(
      {
        method: 'POST',
        hostname: random(['tinypng.com', 'tinyjpg.com'], 1)[0],
        path: '/web/shrink',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': `Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.${Date.now()} Safari/537.36`,
          'X-Forwarded-For': Array.from({ length: 4 })
            .map(() => random(0, 255))
            .join('.')
        }
      },
      res => {
        const buffs: any[] = [];
        res.on('data', buf => buffs.push(buf));
        res.on('end', () => {
          const data = JSON.parse(Buffer.concat(buffs).toString());
          const { statusCode = 0 } = res;
          if ((statusCode >= 200 && statusCode < 400) || data.error) {
            resolove(data);
            cb({ progress: 1, type: 'compress' });
          } else {
            reject(new Error(data));
            cb({ progress: 0, type: 'compress' });
          }
        });
        res.on('error', reject);
      }
    );
    const fileInfo = fs.statSync(path);

    req.on('drain', () => cb({ progress: send / fileInfo.size, type: 'upload' }));
    req.on('finish', () => (cb({ progress: 1, type: 'upload' }), cb({ progress: 0, type: 'compress' })));
    req.on('error', reject);

    const rs = fs.createReadStream(path);
    rs.on('data', chunk => (send += chunk.length));
    rs.pipe(req, { end: false });
    rs.on('end', () => req.end());
    cb({ progress: 0, type: 'upload' });
  });
}

export function download({ url, path }: { url: string; path: string }, cb = (op: Tinypng.Progress): void => {}) {
  return new Promise((resolove, reject) => {
    cb({ progress: 0, type: 'download' });
    const req = https.request(url, res => {
      const size = Number(res.headers['content-length']);
      let buffs = '';
      res.setEncoding('binary');
      res.on('data', buf => {
        buffs += buf;
        cb({ progress: buffs.length / size, type: 'download' });
      });
      res.on('end', () => {
        const { statusCode = 0 } = res;
        if (statusCode >= 200 && statusCode < 400) {
          fs.writeFile(path, buffs, 'binary', err => (err ? reject(err) : resolove()));
        } else {
          cb({ progress: 0, type: 'download' });
          reject(new Error(buffs));
        }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

// 'upload' | 'compress' | 'download';

function calcProgress({ type, progress }: Tinypng.Progress) {
  let p = 0;
  if (type === 'upload') {
    p = progress * 0.33;
  } else if (type === 'compress') {
    p = progress * 0.33 + 0.33;
  } else {
    p = progress * 0.34 + 0.66;
  }

  const status = p < 0.33 ? ['上传中'] : p < 0.66 ? ['上传完成', '压缩中'] : p < 1 ? ['上传完成', '压缩完成', '下载图片中'] : ['上传完成', '压缩完成', '下载图片完成'];

  console.log('status: ', ...status);
  console.log(p);
  const result = {
    progress: p,
    status
  };
  return result;
}

export async function compress({ img, path }: { img: string; path: string }, cb = (op: { progress: number; status: string[] }): void => {}): Promise<Tinypng.Response> {
  return new Promise(async (reslove, reject) => {
    const up = await upload(img, p => cb(calcProgress(p))).catch(error => (cb(calcProgress({ progress: 0, type: 'upload' })), error));
    console.log('up: ', up);
    if (up instanceof Error) return reject({ type: 'upload', error: up });
    const down = await download({ url: up.output.url, path }, p => cb(calcProgress(p))).catch(error => (cb(calcProgress({ progress: 0.66, type: 'download' })), error));
    if (down instanceof Error) return reject({ type: 'download', error: down, url: up.output.url });
    reslove(up);
  });
}
