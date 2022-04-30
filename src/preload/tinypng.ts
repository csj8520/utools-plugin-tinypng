import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import Events from 'events';
import { random } from './utils';

interface EventKeys {
  'progress:upload': number;
  'progress:compress': number;
  'progress:download': number;
  'success:upload': Tinypng.Response;
  'success:download'?: void;
  'error:upload': Error;
  'error:download': Error;
}

export interface TinypngCompress {
  on<K extends keyof EventKeys>(event: K, listener: (v: EventKeys[K]) => void): this;
  emit<K extends keyof EventKeys>(event: K, v: EventKeys[K]): boolean;
  emit(event: 'success:download'): boolean;
}

export class TinypngCompress extends Events {
  public filePath!: string;
  public downloadPath!: string;
  public response?: Tinypng.Response;
  private req?: http.ClientRequest;
  private res?: http.IncomingMessage;

  constructor({ filePath, downloadPath }: { filePath: string; downloadPath: string }) {
    super();
    this.filePath = filePath;
    this.downloadPath = downloadPath;
  }

  public upload() {
    let send = 0;
    const req = https.request(
      {
        method: 'POST',
        hostname: random(['tinypng.com', 'tinyjpg.com']),
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
        this.res = res;
        const buffs: any[] = [];
        res.on('data', (buf: any) => buffs.push(buf));
        res.on('end', () => {
          const data = JSON.parse(Buffer.concat(buffs).toString());
          const { statusCode = 0 } = res;
          if (statusCode >= 200 && statusCode < 400 && data.output && data.input) {
            this.response = data;
            this.emit('progress:compress', 1);
            this.emit('success:upload', this.response!);
          } else {
            this.emit('progress:compress', 0);
            this.emit('error:upload', new Error(data.message || data.error || '...'));
          }
        });
        res.on('error', err => this.emit('error:upload', err));
      }
    );
    this.req = req;
    const fileInfo = fs.statSync(this.filePath);

    req.on('drain', () => this.emit('progress:upload', send / fileInfo.size));
    req.on('finish', () => (this.emit('progress:upload', 1), this.emit('progress:compress', 0)));
    // TODO: fix 偶发性报错不影响后续操作 Error: read ECONNRESET
    // req.on('error', err => this.emit('error:upload', err));

    const rs = fs.createReadStream(this.filePath);
    rs.on('data', chunk => (send += chunk.length));
    rs.pipe(req, { end: false });
    rs.on('end', () => req.end());
    this.emit('progress:upload', 0);
  }

  public download() {
    if (!this.response?.output?.url) return this.emit('error:download', new Error("Can't find Download Url"));

    this.emit('progress:download', 0);

    const req = https.request(this.response?.output.url, res => {
      this.res = res;
      const size = Number(res.headers['content-length']);
      let buffs = '';
      res.setEncoding('binary');
      res.on('data', (buf: string) => {
        buffs += buf;
        this.emit('progress:download', buffs.length / size);
      });
      res.on('end', () => {
        const { statusCode = 0, aborted } = res;
        if (statusCode >= 200 && statusCode < 400 && !aborted) {
          try {
            const paths = path.parse(this.downloadPath).dir.split(path.sep);
            paths.slice(1).forEach((it, idx) => {
              const p = paths.slice(0, idx + 2).join(path.sep);
              console.log('check and mkdir: ', p);
              fs.existsSync(p) || fs.mkdirSync(p);
            });
            console.log('this.downloadPath: ', this.downloadPath);
            fs.writeFile(this.downloadPath, buffs, 'binary', err => (err ? this.emit('error:download', err) : this.emit('success:download')));
          } catch (error) {
            console.error('缓存图片错误', error);
            this.emit('error:download', error as Error);
          }
        } else {
          this.emit('progress:download', 0);
          let data: any = {};
          try {
            data = JSON.parse(buffs);
          } catch (e) {}
          this.emit('error:download', new Error(data.message || data.error || '...'));
        }
      });
      res.on('error', err => this.emit('error:download', err));
    });
    this.req = req;
    // TODO: fix 偶发性报错不影响后续操作 Error: read ECONNRESET
    // req.on('error', err => this.emit('error:download', err));
    req.end();
  }

  public destroy() {
    this.removeAllListeners();
    this.req?.destroy?.();
    this.res?.destroy?.();
  }
}
