<template>
  <div class="flex items-center justify-center h-full text-xs text-gray-500">
    <span>© 2024 医学影像查看器 - Medical Image Viewer v{{ version }}</span>
    <span class="mx-2">|</span>
    <span>基于 Vue.js + TypeScript 构建</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const version = ref('0.1.0')
</script>


