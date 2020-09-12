// @ts-nocheck
const fs = require('fs');
const path = require('path');
const { upload, download } = require('./tingpng');
const { Queue, bytesToSize } = require('./utils');

const queue = new Queue(3);

utools.onPluginEnter(({ code, type, payload, optional }) => {
  window.tempPath = path.join(utools.getPath('temp'), 'utools.tinypng');
  fs.existsSync(window.tempPath) || fs.mkdirSync(window.tempPath);
  console.log('用户进入插件', code, type, payload);
  if (type === 'files') {
    window.app.handleCompress(
      payload.map(it => ({
        name: it.name,
        path: it.path,
        size: fs.statSync(it.path).size
      }))
    );
  }
});

utools.onPluginOut(() => {
  console.log('用户退出插件');
});

window.addEventListener('load', async () => {
  loadStyle('https://at.alicdn.com/t/font_1853655_b8937lub8sw.css');
  console.log('init');
  window.app = new Vue({
    el: '.app',
    data: {
      list: [],
      draged: false,
      statusMap: {
        request: {
          index: 0,
          start: 0,
          ratio: 0.33,
          ing: '上传中',
          end: '上传完成'
        },
        compress: {
          index: 1,
          start: 0.33,
          ratio: 0.33,
          ing: '压缩中',
          end: '压缩完成'
        },
        download: {
          index: 2,
          start: 0.66,
          ratio: 0.34,
          ing: '下载图片中',
          end: '下载图片完成'
        }
      }
    },
    computed: {
      op() {
        const sum = this.list.length;
        const success = this.list.filter(it => it.success);
        const error = this.list.filter(it => it.error);
        const size = success.reduce((a, b) => a + b.size, 0);
        const compressSize = success.reduce((a, b) => a + b.compressSize, 0);
        return {
          complate: ((success.length / sum) * 100 || 0).toFixed(2),
          success: success.length,
          error: error.length,
          reduce: bytesToSize(size - compressSize),
          ratio: (((size - compressSize) / size) * 100 || 0).toFixed(2),
          total: bytesToSize(size),
          surplus: bytesToSize(compressSize)
        };
      }
    },
    methods: {
      async handleDrop(e) {
        this.draged = false;
        this.handleCompress([...e.dataTransfer.files].filter(it => /\.(png|jpeg|jpg)$/i.test(it.name)).map(it => ({ name: it.name, path: it.path, size: it.size })));
      },
      handleList(list) {
        this.list = list.map(it => ({
          compressSize: 0,
          progress: 0,
          ratio: 0,
          status: [],
          tempPath: '',
          success: false,
          error: false,
          errorInfo: '',
          url: '',
          ...it
        }));
      },
      async handleCompress(list) {
        if (!list.length) return;
        this.handleList(list);
        if (!/utools.tinypng$/.test(window.tempPath)) return utools.showNotification('图片缓存路径异常！');
        const temps = fs.readdirSync(window.tempPath);
        temps.filter(it => /\.(png|jpeg|jpg)$/i.test(it)).forEach(it => fs.unlinkSync(path.join(window.tempPath, it)));
        for (const file of this.list) {
          await queue.push(this.handleCompressOne(file));
        }
        await queue.finish();
      },
      async handleUpload(file) {
        file.status = [];
        file.success = false;
        file.error = false;
        file.errorInfo = '';
        return await upload(file.path, progress => {
          const status = this.statusMap[progress.type];
          file.progress = progress.progress * status.ratio + status.start;
          if (progress.progress < 1) {
            file.status[status.index] = status.ing;
          } else {
            file.status[status.index] = status.end;
          }
          this.list = [...this.list];
        })
          .then(({ input, output }) => {
            file.compressSize = output.size;
            file.ratio = output.ratio;
            file.url = output.url;
            return true;
          })
          .catch(error => {
            file.error = true;
            file.errorInfo = 'Upload: ' + error.toString();
            return false;
          });
      },

      async handleDownload(file) {
        file.success = false;
        file.error = false;
        file.errorInfo = '';
        const tempPath = path.join(window.tempPath, file.name);
        return await download({ url: file.url, path: tempPath }, progress => {
          const status = this.statusMap[progress.type];
          file.progress = progress.progress * status.ratio + status.start;
          if (progress.progress < 1) {
            file.status[status.index] = status.ing;
          } else {
            file.status[status.index] = status.end;
          }
          this.list = [...this.list];
        })
          .then(() => {
            file.success = true;
            file.tempPath = tempPath;
            return true;
          })
          .catch(error => {
            file.error = true;
            file.errorInfo = 'Download: ' + error.toString();
            return false;
          });
      },

      async handleCompressOne(file) {
        console.log('file: ', file);

        if (!file.errorInfo.startsWith('Download:')) {
          const info = await this.handleUpload(file);
          if (!info) return;
        }
        await this.handleDownload(file);
        this.list = [...this.list];
      },
      handleRetry(file) {
        this.handleCompressOne(file);
      },
      handleReplaces(list) {
        const index = utools.showMessageBox({
          type: 'warning',
          buttons: ['取消', '确认'],
          title: '覆盖确认',
          message: '您确定要覆盖此文件吗？此操作不可还原！',
          defaultId: 0,
          cancelId: 0
        });
        index === 1 && list.filter(it => it.success && it.path && it.tempPath).forEach(({ path, tempPath }) => fs.createReadStream(tempPath).pipe(fs.createWriteStream(path)));
      },
      handleCopys(list) {
        const ok = utools.copyFile(list.filter(it => it.success).map(it => it.tempPath));
        utools.showNotification(ok ? '复制成功' : '复制失败');
      }
    },
    mounted() {}
  });
});

async function loadStyle(url) {
  const style = document.createElement('style');
  style.innerHTML = await fetch(url).then(res => res.text());
  document.head.appendChild(style);
}
