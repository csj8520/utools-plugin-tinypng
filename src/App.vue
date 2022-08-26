<template>
  <div class="main">
    <tab :list="configs.list" v-model="active" />
    <compress-list v-for="(_it, idx) in configs.list" v-model="configs.list[idx]" v-show="idx === active" />
  </div>
</template>

<style lang="scss" scoped>
.main {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import Tab from './components/tab.vue';
import CompressList from './components/compress-list.vue';

const configs = ref<TinypngConfig>({
  list: [
    {
      date: 1661501879861,
      basedir: 'E:\\code\\project\\utools-plugin-tinypng',
      images: [
        {
          name: 'dist\\logo.png',
          path: 'E:\\code\\project\\utools-plugin-tinypng\\dist\\logo.png',
          size: 15614,
          compress: {
            path: '',
            size: 14614,
            progress: 1
          }
        },
        {
          name: 'doc\\screenshot.png',
          path: 'E:\\code\\project\\utools-plugin-tinypng\\doc\\screenshot.png',
          size: 7462,
          compress: {
            path: '',
            progress: 0.3,
            error: true,
            msg: 'Error'
          }
        },
        {
          name: 'doc\\screenshot2.png',
          path: 'E:\\code\\project\\utools-plugin-tinypng\\doc\\screenshot2.png',
          size: 9223
        },
        {
          name: 'public\\logo.png',
          path: 'E:\\code\\project\\utools-plugin-tinypng\\public\\logo.png',
          size: 15614
        }
      ]
    },
    { date: new Date(2022, 6, 1).getTime(), basedir: '', images: [] },
    { date: new Date(2022, 7, 1).getTime(), basedir: '', images: [] },
    { date: new Date(2022, 8, 1).getTime(), basedir: '', images: [] },
    { date: new Date(2022, 8, 10).getTime(), basedir: '', images: [] },
    { date: new Date(2022, 8, 26).getTime(), basedir: '', images: [] },
    { date: new Date().getTime(), basedir: '', images: [] }
  ]
});
const active = ref<number>(0);

function handleTinypingCompression(e: Event) {
  const { detail } = e as CustomEvent<TinypngConfig.List>;
  configs.value.list.push(detail);
  active.value = configs.value.list.length - 1;
  console.log('configs: ', configs);
  console.log('detail: ', detail);
}

onMounted(() => {
  window.addEventListener('tinyping-compression', handleTinypingCompression);
});

onUnmounted(() => {
  window.removeEventListener('tinyping-compression', handleTinypingCompression);
});
</script>
