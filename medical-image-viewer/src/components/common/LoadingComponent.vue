<template>
  <div class="flex items-center justify-center bg-white/90 z-[1000]" :class="{ 'fixed inset-0 bg-black/80': fullScreen }">
    <div class="text-center text-gray-600">
      <el-icon class="text-primary-500 animate-spin-slow mb-4" :size="iconSize">
        <Loading />
      </el-icon>
      <p v-if="text" class="mb-4 text-sm">{{ text }}</p>
      <div v-if="showProgress" class="w-48 mx-auto">
        <el-progress :percentage="progress" :stroke-width="4" :show-text="false" />
        <span class="text-xs text-gray-400 mt-1 block">{{ progress }}%</span>
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


