<template>
  <div class="loading-component" :class="{ 'full-screen': fullScreen }">
    <div class="loading-content">
      <el-icon class="loading-icon" :size="iconSize">
        <Loading />
      </el-icon>
      <p v-if="text" class="loading-text">{{ text }}</p>
      <div v-if="showProgress" class="loading-progress">
        <el-progress :percentage="progress" :stroke-width="4" :show-text="false" />
        <span class="progress-text">{{ progress }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'

interface Props {
  text?: string
  fullScreen?: boolean
  iconSize?: number
  showProgress?: boolean
  progress?: number
}

withDefaults(defineProps<Props>(), {
  text: '加载中...',
  fullScreen: false,
  iconSize: 48,
  showProgress: false,
  progress: 0
})
</script>

<style scoped>
.loading-component {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1000;
}

.loading-component.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
}

.loading-content {
  text-align: center;
  color: #606266;
}

.loading-icon {
  color: #409eff;
  animation: rotate 2s linear infinite;
  margin-bottom: 15px;
}

.loading-text {
  margin: 0 0 15px 0;
  font-size: 14px;
}

.loading-progress {
  width: 200px;
  margin: 0 auto;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  display: block;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
