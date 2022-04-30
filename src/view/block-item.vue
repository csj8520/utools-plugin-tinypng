<template>
  <li :style="{ '--width': `${progress * 100}%` }" class="item">
    <div class="item__img">
      <img :src="path" />
    </div>
    <div class="item__name">{{ name }}</div>
    <div class="item__size">{{ bytes(size) }}</div>
    <div class="item__size-compress">
      <template v-if="surplus">{{ bytes(surplus) }}</template>
      <template v-else>-</template>
    </div>
    <div class="item__compress-ratio">{{ surplus ? `-${(((size - surplus) / size) * 100).toFixed(2)}%` : '-' }}</div>
    <button :disabled="progress !== 1" @click="$emit('copy-image')" class="item__copy iconfont icon-copy" title="复制图片"></button>
    <button :disabled="progress !== 1" @click="$emit('replace')" class="item__replace iconfont icon-icon_common_replace" title="覆盖原图"></button>
    <p class="item__tag">
      <span :key="index" v-for="(it, index) in status">{{ it }}</span>
    </p>
    <transition name="fade">
      <div class="item__error" v-if="error">
        <i @click="$emit('retry')" class="iconfont icon-shuaxin"></i>
        <p>{{ error }}</p>
      </div>
    </transition>
  </li>
</template>

<style lang="scss">
.item {
  display: flex;
  padding: 10px;
  align-items: center;
  position: relative;

  &:nth-child(2n) {
    background: #f7f8f9;
  }

  &:before {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: var(--width);
    height: 4px;
    background: #60a7ff;
    border-radius: 2px;
    transition: width 0.5s;
  }

  &__img {
    width: 50px;
    height: 50px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__name {
    padding: 0 10px;
    flex: 1;
    width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__size {
    width: 80px;
    text-align: center;
    color: #666666;
  }

  &__size-compress {
    width: 80px;
    text-align: center;
    color: #666666;
  }

  &__compress-ratio {
    width: 80px;
    text-align: center;
    color: #389e0d;
  }

  &__copy,
  &__replace {
    font-size: 20px;
    padding: 0 6px;
    background: none;
    border: none;
  }

  &__tag {
    position: absolute;
    z-index: 1;
    bottom: 6px;
    right: 0;
    font-size: 12px;
    width: 230px;

    span {
      background: rgba(176, 224, 230, 0.8);
      display: inline-block;
      line-height: 18px;
      height: 18px;
      border-radius: 9px;
      padding: 0 6px;
      margin-right: 5px;
      color: #333;
    }
  }

  &__error {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #c0c4cc;

    i {
      cursor: pointer;
      font-size: 25px;
    }
  }
}
</style>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  props: {
    path: { type: String, default: '' },
    name: { type: String, default: '' },
    surplus: { type: Number, default: 0 },
    size: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    error: { type: String, default: '' }
  },
  emits: ['copy-image', 'replace', 'retry'],

  setup(props) {
    const dice: Array<[number, string[]]> = [
      [1, ['上传完成', '压缩完成', '下载图片完成']],
      [0.66, ['上传完成', '压缩完成', '下载图片中']],
      [0.33, ['上传完成', '压缩中']],
      [0, ['上传中']]
    ];
    const status = computed(() => dice.find(([p]) => props.progress >= p)?.[1] ?? []);
    return { ...window.utils, status };
  }
});
</script>
