<template>
  <div class="compress-item">
    <img :src="data.path" :alt="data.name" />
    <p>{{ data.name }}</p>
    <span>{{ bytes(data.size) }}</span>
    <span>{{ data.compress?.size ? bytes(data.compress.size) : '-' }}</span>
    <span class="green">{{ data.compress?.size ? `-${((data.size - data.compress.size) / data.size).toFixed(2)}%` : '-' }}</span>
    <button>
      <icon name="cancel" />
    </button>
    <button>
      <icon name="copy" />
    </button>
    <button>
      <icon name="image-replace" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.compress-item {
  position: relative;
  height: 56px;
  // background: #303133;
  display: flex;
  align-items: center;
  padding: 0 20px;
  &:nth-child(2n) {
    background: #373737;
  }
  &:before {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: v-bind(progress);
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(to right, #4ae3e7 33vw, #29a9ef 34vw, #29a9ef 66vw, #0b73f7 66vw);
    transition: width 0.5s;
  }
  img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }
  p {
    flex: 1;
    padding-left: 20px;
  }
  span {
    width: 90px;
    text-align: center;
  }
  .green {
    color: green;
  }
  button {
    padding: 5px;
    background: none;
    border: none;
    cursor: pointer;
    margin: 0 4px;
    font-size: 22px;
  }
}
</style>

<script lang="ts" setup>
import { computed, PropType } from 'vue';
import { bytes } from '../utils';

import Icon from './icon.vue';

const props = defineProps({
  data: { type: Object as PropType<TinypngConfig.List.Image>, required: true }
});

const progress = computed(() => (props.data.compress?.progress ?? 0) * 100 + '%');
</script>
