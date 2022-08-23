<template>
  <div>hello world {{ r }}</div>
</template>

<style scoped></style>

<script setup lang="ts">
import { ref } from 'vue';

const r = ref(window.preload?.random(0, 100000));
window.preload?.test();
window.preload?.default();
console.log('window.preload: ', window.preload);
</script>
