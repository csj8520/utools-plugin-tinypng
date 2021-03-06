import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import Events from 'events';
import { random } from './utils';
import ProxyAgent from 'proxy-agent';
import { Agent } from 'node:http';

export interface TinypngCompress {
  on(event: 'progress:upload', listener: (v: number) => void): this;
  on(event: 'progress:compress', listener: (v: number) => void): this;
  on(event: 'progress:download', listener: (v: number) => void): this;
  on(event: 'success:upload', listener: (v: Tinypng.Response) => void): this;
  on(event: 'success:download', listener: () => void): this;
  on(event: 'error:upload', listener: (v: Error) => void): this;
  on(event: 'error:download', listener: (v: Error) => void): this;

  emit(event: 'progress:upload', v: number): boolean;
  emit(event: 'progress:compress', v: number): boolean;
  emit(event: 'progress:download', v: number): boolean;
  emit(event: 'success:upload', v: Tinypng.Response): boolean;
  emit(event: 'success:download'): boolean;
  emit(event: 'error:upload', v: Error): boolean;
  emit(event: 'error:download', v: Error): boolean;
}

export class TinypngCompress extends Events {
  public filePath!: string;
  public downloadPath!: string;
  public response?: Tinypng.Response;
  private proxy?: Agent;
  private req?: http.ClientRequest;
  private res?: http.IncomingMessage;

  constructor({ filePath, downloadPath }: { filePath: string; downloadPath: string }) {
    super();
    this.filePath = filePath;
    this.downloadPath = downloadPath;
    const proxy = utools.db.get('proxy');
    if (proxy) {
      this.proxy = new ProxyAgent(proxy.data);
    }
  }

  public upload() {
    let send = 0;
    const req = https.request(
      {
        agent: this.proxy,
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
    req.on('error', err => this.emit('error:upload', err));

    const rs = fs.createReadStream(this.filePath);
    rs.on('data', chunk => (send += chunk.length));
    rs.pipe(req, { end: false });
    rs.on('end', () => req.end());
    this.emit('progress:upload', 0);
  }

  public download() {
    if (!this.response?.output?.url) return this.emit('error:download', new Error("Can't find Download Url"));

    this.emit('progress:download', 0);

    const req = https.request(this.response?.output.url, { agent: this.proxy }, res => {
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
          const paths = path.parse(this.downloadPath).dir.split(path.sep);
          paths.forEach((it, idx) => {
            const p = paths.slice(0, idx + 1).join(path.sep);
            fs.existsSync(p) || fs.mkdirSync(p);
          });
          fs.writeFile(this.downloadPath, buffs, 'binary', err => (err ? this.emit('error:download', err) : this.emit('success:download')));
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
    req.on('error', err => this.emit('error:download', err));
    req.end();
  }

  public destroy() {
    this.removeAllListeners();
    this.req?.destroy?.();
    this.res?.destroy?.();
  }
}
