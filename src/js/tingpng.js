// @ts-nocheck
const fs = require('fs');
const https = require('https');
const { random } = require('./utils');

function upload(img, cb = () => {}) {
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
          'X-Forwarded-For': new Array(4)
            .fill(0)
            .map(() => random(0, 255))
            .join('.')
        }
      },
      res => {
        const buffs = [];
        res.on('data', buf => buffs.push(buf));
        res.on('end', () => {
          const data = JSON.parse(Buffer.concat(buffs).toString());
          console.log('data: ', data, res.statusCode);
          if ((res.statusCode >= 200 && res.statusCode < 400) || data.error) {
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
    console.log(req.getHeaders());
    const fileInfo = fs.statSync(img);

    req.on('drain', () => cb({ progress: send / fileInfo.size, type: 'request' }));
    req.on('finish', () => (cb({ progress: 1, type: 'request' }), cb({ progress: 0, type: 'compress' })));
    req.on('error', reject);

    const rs = fs.createReadStream(img);
    rs.on('data', chunk => (send += chunk.length));
    rs.pipe(req, { end: false });
    rs.on('end', () => req.end());
    cb({ progress: 0, type: 'request' });
  });
}

function download({ url, path }, cb = () => {}) {
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
        if (res.statusCode >= 200 && res.statusCode < 400) {
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

module.exports = { upload, download };
