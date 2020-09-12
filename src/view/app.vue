<template>
  <div class="app" @dragenter="draged = true" @dragover.prevent="draged = true" @dragleave="draged = false" @drop.prevent="handleDrop">
    <ul>
      <block-item
        v-for="(it, index) in list"
        :key="index"
        :name="it.name"
        :path="it.path"
        :progress="it.progress"
        :status="it.status"
        :size="it.size"
        :surplus="it.surplus"
        :error="it.error"
        @retry="handleCompressOne(it, index)"
        @copy="handleCopys([it])"
        @replace="handleReplaces([it])"
      />
    </ul>
    <div class="app__info" :style="{ '--width': `${info.complate}%` }">
      <p>完成 {{ info.complate | fixed(2) }}%</p>
      <p>失败 {{ info.error }}</p>
      <p>总计 {{ info.total | bytes }} 压缩后 {{ info.surplus | bytes }}</p>
      <p>
        共减少
        <span>{{ (info.total - info.surplus) | bytes }}</span>
        <span>-{{ (((info.total - info.surplus) / info.total || 0) * 100) | fixed(2) }}%</span>
      </p>
      <el-button type="primary" size="mini" @click="handleReplaces(list)">覆盖原图</el-button>
      <el-button type="primary" size="mini" @click="handleCopys(list)">复制所有</el-button>
    </div>
    <transition name="fade">
      <div class="app__drag" v-if="!list.length || draged" :draged="draged">
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
      padding: 0 6px;

      &:nth-child(3) {
        padding-left: 20px;
      }

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

const { path, fs, utils, tinypng } = window;
const { bytesToSize, Queue } = utils;
const { compress, download } = tinypng;

@Component({ components: { BlockItem } })
export default class App extends Vue {
  private num: number = 0;

  private list: Tinypng.List[] = [];
  private draged = false;

  private queue!: InstanceType<typeof Queue>;

  private imageReg = /\.(png|jpeg|jpg)$/i;

  private get info() {
    const sum = this.list.length;
    const success = this.list.filter(it => it.progress === 1);
    const error = this.list.filter(it => it.error);
    const total = success.reduce((a, b) => a + b.size, 0);
    const surplus = success.reduce((a, b) => a + (b.surplus || 0), 0);
    return {
      complate: (success.length / sum) * 100 || 0,
      success: success.length,
      error: error.length,
      total,
      surplus
    };
  }

  public mounted() {
    this.queue = new Queue(3);
  }

  public async handleCompress(files: Tinypng.FIleItem[]) {
    if (!/utools.tinypng$/.test(window.tempPath)) return this.$message.error('图片缓存路径异常！');
    const temps = fs.readdirSync(window.tempPath);
    temps.filter(it => this.imageReg.test(it)).forEach(it => fs.unlinkSync(path.join(window.tempPath, it)));

    console.log(files);
    this.list = files.filter(it => this.imageReg.test(it.name));

    for (const [index, file] of Object.entries(this.list)) {
      await this.queue.push(this.handleCompressOne(file, Number(index)));
    }
    await this.queue.finish();
  }

  private async handleCompressOne(file: Tinypng.FIleItem, index: number) {
    const temp = path.join(window.tempPath, file.name);
    this.$set(this.list, index, { ...this.list[index], error: undefined, temp });

    const res = await compress({ img: file.path, path: temp }, data => this.$set(this.list, index, { ...this.list[index], ...data })).catch(
      error => (this.$set(this.list, index, { ...this.list[index], error }), null)
    );
    if (!res) return;

    this.$set(this.list, index, { ...this.list[index], surplus: res.output.size });
  }

  // private handleRetry(file: Tinypng.List, index: number) {
  //   if (file?.error?.type === "download" && file?.error?.url && file?.temp) {
  //     download({ url: file?.error.url, path: file.temp });
  //   } else {
  //     this.handleCompressOne(file, index);
  //   }
  // }

  private async handleReplaces(list: Tinypng.List[]) {
    try {
      const result = await this.$confirm('您确定要覆盖此文件吗？此操作不可还原！', { title: '覆盖确认' }).catch(() => void 0);
      if (!result) return;
      for (const { path, temp } of list.filter(it => it.progress === 1 && it.path && it.temp)) {
        await fs.createReadStream(temp as string).pipe(fs.createWriteStream(path));
      }
      this.$message.success('覆盖成功！');
    } catch (error) {
      this.$message.error(error);
    }
  }

  private handleCopys(list: Tinypng.List[]) {
    const files = list.filter(it => it.progress === 1 && it.temp);
    const paths = files.map(it => it.temp as string);
    const ok = utools.copyFile(paths);
    ok ? this.$message.success('复制成功！') : this.$message.error('复制失败！');
  }

  private handleDrop(e: DragEvent) {
    this.draged = false;
    const files = (e.dataTransfer?.files || []) as any[];
    this.handleCompress(Array.from(files).map(it => ({ name: it.name, path: it.path as string, size: it.size })));
  }
}
</script>