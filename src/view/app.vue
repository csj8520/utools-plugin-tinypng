<template>
  <div @dragenter="draged = true" @dragleave="draged = false" @dragover.prevent="draged = true" @drop.prevent="handleDrop" class="app">
    <ul>
      <block-item
        :error="it.error"
        :key="index"
        :name="it.name"
        :path="it.path"
        :progress="it.progress"
        :size="it.size"
        :status="it.status"
        :surplus="it.surplus"
        @copy="handleCopys([it])"
        @replace="handleReplaces([it])"
        @retry="handleCompressOne(index)"
        v-for="(it, index) in list"
      />
    </ul>
    <div :style="{ '--width': `${info.progress}%` }" class="app__info">
      <p>进度 {{ info.success }}/{{ list.length }}</p>
      <p>失败 {{ info.error }}</p>
      <p>总计 {{ info.total | bytes }} 压缩后 {{ info.surplus | bytes }}</p>
      <p>
        共减少
        <span>{{ (info.total - info.surplus) | bytes }}</span>
        <span>-{{ (((info.total - info.surplus) / info.total || 0) * 100) | fixed(2) }}%</span>
      </p>
      <el-button @click="handleReplaces(list)" size="mini" type="primary">覆盖原图</el-button>
      <el-button @click="handleCopyAll()" size="mini" type="primary">复制所有</el-button>
    </div>
    <transition name="fade">
      <div :draged="draged" class="app__drag" v-if="!list.length || draged">
        <i class="iconfont icon-shangchuan"></i>
        <p v-if="draged">松手压缩此图片</p>
        <p v-else>请将图片拖放到此处</p>
      </div>
    </transition>
  </div>
</template>

<style lang="stylus">
.app {
  display: flex;
  flex-direction: column;

  >ul {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 15px;
    position: relative;
  }

  &__info {
    position: relative;
    height: 50px;
    display: flex;
    align-items: center;
    padding: 0 10px;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: var(--width);
      height: 6px;
      background: #60a7ff;
      border-radius: @height * 0.5;
      transition: width 0.5s;
    }

    > p {
      padding: 0 8px;

      &:last-of-type {
        flex: 1;
        text-align: right;

        span {
          padding: 0 5px;
          color: blueviolet;

          &:last-child {
            color: green;
          }
        }
      }
    }
  }

  &__drag {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 3;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: 0.3s;
    color: #222;

    &[draged] {
      background: rgba(0, 0, 0, 0.5);
      color: #000;
    }

    i {
      font-size: 100px;
      pointer-events: none;
    }

    p {
      pointer-events: none;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

import BlockItem from './block-item.vue';

const { path, fs, utils, tinypng, glob } = window;
const { Queue } = utils;
const { TinypngCompress } = tinypng;

@Component({ components: { BlockItem } })
export default class App extends Vue {
  private draged = false;

  private list: Tinypng.List[] = [];

  private queue!: InstanceType<typeof Queue>;

  private imageReg = /\.(png|jpeg|jpg)$/i;

  private get info() {
    const sum = this.list.length;
    const success = this.list.filter(it => it.progress === 1);
    const error = this.list.filter(it => it.error);
    const total = success.reduce((a, b) => a + b.size, 0);
    const surplus = success.reduce((a, b) => a + b.surplus, 0);
    return {
      progress: (success.length / sum) * 100 || 0,
      success: success.length,
      error: error.length,
      total,
      surplus,
      complete: sum === success.length + error.length
    };
  }

  public mounted() {
    this.queue = new Queue(3);
  }

  public async handleCompress(files: Tinypng.FIleItem[]) {
    if (!this.info.complete) {
      if ((await this.$confirm('还有任务未完成确认覆盖吗?').catch(t => t)) !== 'confirm') return;
    }

    if (!/utools.tinypng$/.test(window.tempPath)) return this.$message.error('图片缓存路径异常！');

    // 移除上一次的缓存
    fs.readdirSync(window.tempPath)
      .map(it => path.join(window.tempPath, it))
      .filter(it => it.includes('utools.tinypng'))
      .forEach(it => (fs.statSync(it).isFile() ? fs.unlinkSync(it) : fs.rmdirSync(it, { recursive: true })));

    console.log(files);

    // 销毁旧的实例
    this.list.forEach(it => it.tc.destroy());
    this.list = [];

    // 递归图片文件
    let list: Tinypng.FIleItem[] = [];
    files.forEach(it => {
      if (fs.statSync(it.path).isDirectory()) {
        glob
          .sync(path.join(it.path, '**/**.{png,jpeg,jpg}'))
          .map(item => path.normalize(item))
          .forEach(item =>
            list.push({
              path: item,
              name: path.parse(it.path).name + item.replace(it.path, ''),
              size: fs.statSync(item).size
            })
          );
      } else if (this.imageReg.test(it.name)) {
        list.push({ name: it.name, path: it.path, size: it.size });
      }
    });
    if (list.length > 20) {
      const data = await this.$confirm('当前文件超过20个可能会压缩失败', { confirmButtonText: '继续' }).catch(t => t);
      if (data !== 'confirm') return;
    }
    // 实例
    this.list = list.map(it => ({ ...it, progress: 0, error: '', surplus: 0, tc: new TinypngCompress({ filePath: it.path, downloadPath: path.join(window.tempPath, it.name) }) }));
    // 队列
    for (let idx = 0; idx < this.list.length; idx++) {
      await this.queue.push(this.handleCompressOne(idx));
    }
    await this.queue.finish();
  }

  private handleCompressOne(idx: number): Promise<any> {
    return new Promise<void>(res => {
      this.list[idx].tc.removeAllListeners();
      this.list[idx].tc.on('progress:upload', p => {
        console.log('progress:upload', p);
        this.$set(this.list, idx, { ...this.list[idx], progress: p * 0.33 });
      });
      this.list[idx].tc.on('progress:compress', p => {
        this.$set(this.list, idx, { ...this.list[idx], progress: p * 0.33 + 0.33 });
        console.log('progress:compress', p);
      });
      this.list[idx].tc.on('progress:download', p => {
        this.$set(this.list, idx, { ...this.list[idx], progress: p * 0.33 + 0.66 });
        console.log('progress:download', p);
      });

      this.list[idx].tc.on('success:upload', p => {
        this.$set(this.list, idx, { ...this.list[idx], progress: 0.66, surplus: p.output.size });
        console.log('success:upload', p, this.list[idx].tc);
        this.list[idx].tc.download();
      });
      this.list[idx].tc.on('success:download', () => {
        this.$set(this.list, idx, { ...this.list[idx], progress: 1 });
        console.log('success:download');
        res();
      });

      this.list[idx].tc.on('error:upload', err => {
        console.log('error:upload', err);
        this.$set(this.list, idx, { ...this.list[idx], progress: 0, error: `Upload Error: ${err.message}` });
      });
      this.list[idx].tc.on('error:download', err => {
        console.log('error:download', err);
        this.$set(this.list, idx, { ...this.list[idx], error: `Download Error: ${err.message}` });
      });

      this.$set(this.list, idx, { ...this.list[idx], error: '' });
      if (this.list[idx].progress >= 0.66) {
        this.list[idx].tc.download();
      } else {
        this.list[idx].tc.upload();
      }
    });
  }

  private async handleReplaces(list: Tinypng.List[]) {
    try {
      if (!this.info.complete) return this.$message('请等待全部压缩完成');
      const result = await this.$confirm('您确定要覆盖此文件吗？此操作不可还原！').catch(t => t);
      if (result !== 'confirm') return;
      for (const { tc } of list) {
        fs.createReadStream(tc.downloadPath).pipe(fs.createWriteStream(tc.filePath));
      }
      this.$message.success('覆盖成功！');
    } catch (error) {
      this.$message.error(error);
    }
  }

  private handleCopys(list: Tinypng.List[]) {
    utools.copyFile(list.map(it => it.tc.downloadPath)) ? this.$message.success('复制成功！') : this.$message.error('复制失败！');
  }

  private handleCopyAll() {
    if (!this.info.complete) return this.$message('请等待全部压缩完成');
    utools.copyFile(fs.readdirSync(window.tempPath).map(it => path.join(window.tempPath, it))) ? this.$message.success('复制成功！') : this.$message.error('复制失败！');
  }

  private handleDrop(e: DragEvent) {
    this.draged = false;
    this.handleCompress(Array.from(e.dataTransfer?.files || []));
  }
}
</script>
