<template>
  <div class="error-component" :class="{ 'full-screen': fullScreen }">
    <div class="error-content">
      <el-icon class="error-icon" :size="iconSize">
        <WarningFilled />
      </el-icon>
      <h3 v-if="title" class="error-title">{{ title }}</h3>
      <p class="error-message">{{ message }}</p>
      <div v-if="showDetails && details" class="error-details">
        <el-collapse>
          <el-collapse-item title="错误详情" name="details">
            <pre>{{ details }}</pre>
          </el-collapse-item>
        </el-collapse>
      </div>
      <div class="error-actions">
        <el-button v-if="showRetry" type="primary" @click="handleRetry">
          <el-icon><Refresh /></el-icon>
          重试
        </el-button>
        <el-button v-if="showHome" @click="handleGoHome">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button v-if="showClose" @click="handleClose"> 关闭 </el-button>
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

<style scoped>
.error-component {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  z-index: 1000;
  padding: 20px;
}

.error-component.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
}

.error-content {
  text-align: center;
  max-width: 500px;
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error-icon {
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-title {
  color: #303133;
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
}

.error-message {
  color: #606266;
  margin: 0 0 20px 0;
  font-size: 14px;
  line-height: 1.6;
}

.error-details {
  margin: 20px 0;
  text-align: left;
}

.error-details pre {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.error-actions .el-button {
  margin: 0;
}
</style>
