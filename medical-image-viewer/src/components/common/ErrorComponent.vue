<template>
  <div class="flex items-center justify-center bg-white/95 z-[1000] p-5" :class="{ 'fixed inset-0 bg-black/80': fullScreen }">
    <div class="text-center max-w-lg bg-white p-8 rounded-lg shadow-medical">
      <el-icon class="text-danger mb-5" :size="iconSize">
        <WarningFilled />
      </el-icon>
      <h3 v-if="title" class="text-gray-800 mb-4 text-lg font-semibold">{{ title }}</h3>
      <p class="text-gray-600 mb-5 text-sm leading-relaxed">{{ message }}</p>
      <div v-if="showDetails && details" class="mb-5 text-left">
        <el-collapse>
          <el-collapse-item title="错误详情" name="details">
            <pre class="bg-gray-50 p-3 rounded text-xs text-gray-600 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">{{ details }}</pre>
          </el-collapse-item>
        </el-collapse>
      </div>
      <div class="flex justify-center gap-2 flex-wrap">
        <el-button v-if="showRetry" type="primary" @click="handleRetry">
          <el-icon><Refresh /></el-icon>
          重试
        </el-button>
        <el-button v-if="showHome" @click="handleGoHome">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button v-if="showClose" @click="handleClose">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { WarningFilled, Refresh, House } from '@element-plus/icons-vue'

interface Props {
  title?: string
  message: string
  details?: string
  fullScreen?: boolean
  iconSize?: number
  showRetry?: boolean
  showHome?: boolean
  showClose?: boolean
  showDetails?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  title: '出现错误',
  fullScreen: false,
  iconSize: 64,
  showRetry: true,
  showHome: false,
  showClose: false,
  showDetails: false
})

const emit = defineEmits<{
  retry: []
  close: []
}>()

const router = useRouter()

const handleRetry = () => {
  emit('retry')
}

const handleGoHome = () => {
  router.push('/')
}

const handleClose = () => {
  emit('close')
}
</script>


