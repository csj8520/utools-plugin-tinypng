<template>
  <div class="compress-list">
    <div class="compress-list__list">
      <compress-item v-for="(it, idx) in modelValue.images" :data="it" :key="idx" />
    </div>
    <div class="compress-list__total">
      <p class="compress-list__total__progress">
        <span>完成 {{ (total.progress * 100).toFixed(2) }}%</span>
        <span>成功 {{ total.success }}</span>
        <span>失败 {{ total.error }}</span>
      </p>
      <p>
        <span>共减少</span>
        <span class="blue">{{ bytes(total.reduce) }}</span>
        <span class="green">{{ (total.ratio * 100).toFixed(2) }}%</span>
      </p>
      <button>覆盖原图</button>
      <button>复制所有</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.compress-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__list {
    flex: 1;
    overflow-y: auto;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__total {
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
      width: v-bind(progress);
      height: 5px;
      border-radius: 2px;
      background: #90caf9;
      transition: width 0.5s;
    }

    &__progress {
      flex: 1;
    }
    p {
      span {
        padding: 0 8px;
        &.blue {
          color: #2076c8;
        }
        &.green {
          color: #389e0d;
        }
      }
    }
  }
}
</style>

<script lang="ts" setup>
import { computed, PropType } from 'vue';
import compressItem from './compress-item.vue';

import { bytes } from '../utils';

const props = defineProps({
  modelValue: { type: Object as PropType<TinypngConfig.List>, required: true }
});
defineEmits(['update:modelValue']);

const total = computed(() => {
  const progress = props.modelValue.images.reduce((a, b) => a + (b.compress?.progress ?? 0), 0);
  const totalSize = props.modelValue.images.reduce((a, b) => a + b.size, 0);
  const totalSurplus = props.modelValue.images.reduce((a, b) => a + (b.compress?.size ?? b.size), 0);
  const reduce = totalSize - totalSurplus;
  return {
    progress: progress && progress / props.modelValue.images.length,
    success: props.modelValue.images.filter(it => it.compress?.progress === 1).length,
    error: props.modelValue.images.filter(it => it.compress?.error).length,
    reduce,
    ratio: reduce && reduce / totalSize
  };
});

const progress = computed(() => total.value.progress * 100 + '%');
</script>
