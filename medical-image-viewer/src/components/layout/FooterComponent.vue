<template>
  <div class="footer-component">
    <span>© 2024 医学影像查看器 - Medical Image Viewer v{{ version }}</span>
    <span class="separator">|</span>
    <span>基于 Vue.js + TypeScript 构建</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const version = ref('0.1.0')
</script>

<style scoped>
.footer-component {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  color: #909399;
}

.separator {
  margin: 0 10px;
}
</style>
