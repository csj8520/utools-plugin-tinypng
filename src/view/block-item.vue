<template>
  <li class="item" :style="{ '--width': `${progress * 100}%` }">
    <div class="item__img"><img :src="path" /></div>
    <div class="item__name">{{ name }}</div>
    <div class="item__size">{{ size | bytes }}</div>
    <div class="item__size-compress">
      <template v-if="surplus">{{ surplus | bytes }}</template>
      <template v-else>-</template>
    </div>
    <div class="item__compress-ratio">{{ surplus ? `-${(((size - surplus) / size) * 100).toFixed(2)}%` : '-' }}</div>
    <button :disabled="progress !== 1" class="item__copy iconfont icon-copy" title="复制图片" @click="$emit('copy')"></button>
    <button :disabled="progress !== 1" class="item__replace iconfont icon-icon_common_replace" title="覆盖原图" @click="$emit('replace')"></button>
    <p class="item__tag">
      <span v-for="(it, index) in status" :key="index">{{ it }}</span>
    </p>
    <div class="item__error" v-if="error">
      <i class="iconfont icon-shuaxin" @click="$emit('retry')"></i>
      <p>{{ error.type }}: {{ error.error }}</p>
    </div>
  </li>
</template>

<style lang="stylus">
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
    border-radius: @height * 0.5;
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

  &__copy, &__replace {
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    i {
      cursor: pointer;
      font-size: 25px;
    }
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class Item extends Vue {
  @Prop({ type: String, default: '' })
  private path!: string;

  @Prop({ type: String, default: '' })
  private name!: string;

  @Prop({ type: Number, default: 0 })
  private surplus!: number;

  @Prop({ type: Number, default: 0 })
  private size!: number;

  @Prop({ type: Number, default: 0 })
  private progress!: number;

  @Prop({ type: Array, default: () => [] })
  private status!: string[];

  @Prop({ type: Object })
  private error!: Tinypng.Fail;
}
</script>