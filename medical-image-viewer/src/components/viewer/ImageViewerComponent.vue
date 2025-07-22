<template>
  <div class="image-viewer-component">
    <div class="viewer-container" ref="viewerContainer">
      <div v-if="!hasImage" class="no-image-placeholder">
        <el-icon class="placeholder-icon"><Picture /></el-icon>
        <p>请上传DICOM文件开始查看</p>
        <el-button type="primary" @click="openFileDialog">
          <el-icon><Upload /></el-icon>
          选择文件
        </el-button>
      </div>

      <div v-else class="image-canvas" ref="imageCanvas">
        <!-- 这里将集成Cornerstone.js渲染 -->
        <div class="canvas-placeholder">
          <p>影像渲染区域</p>
          <p>（Cornerstone.js集成开发中...）</p>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-overlay">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>正在加载影像...</p>
      </div>

      <!-- 错误状态 -->
      <div v-if="error" class="error-overlay">
        <el-icon class="error-icon"><WarningFilled /></el-icon>
        <p>{{ error }}</p>
        <el-button @click="clearError">重试</el-button>
      </div>
    </div>

    <!-- 影像信息覆盖层 -->
    <div v-if="imageInfo" class="image-info-overlay">
      <div class="info-item">
        <span>患者姓名: {{ imageInfo.patientName || 'N/A' }}</span>
      </div>
      <div class="info-item">
        <span>检查日期: {{ imageInfo.studyDate || 'N/A' }}</span>
      </div>
      <div class="info-item">
        <span>影像尺寸: {{ imageInfo.width }}x{{ imageInfo.height }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Upload, Loading, WarningFilled } from '@element-plus/icons-vue'

// 响应式数据
const viewerContainer = ref<HTMLElement>()
const imageCanvas = ref<HTMLElement>()
const hasImage = ref(false)
const isLoading = ref(false)
const error = ref<string>('')
const imageInfo = ref<any>(null)

// 生命周期
onMounted(() => {
  initializeViewer()
})

onUnmounted(() => {
  cleanup()
})

// 初始化查看器
const initializeViewer = () => {
  console.log('初始化影像查看器')
  // TODO: 初始化Cornerstone.js
}

// 清理资源
const cleanup = () => {
  console.log('清理影像查看器资源')
  // TODO: 清理Cornerstone.js资源
}

// 打开文件对话框
const openFileDialog = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dcm,.dicom'
  input.multiple = false

  input.onchange = async event => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      await loadDicomFile(files[0])
    }
  }

  input.click()
}

// 加载DICOM文件
const loadDicomFile = async (file: File) => {
  try {
    isLoading.value = true
    error.value = ''

    console.log('加载DICOM文件:', file.name)

    // TODO: 使用dcmjs解析DICOM文件
    // TODO: 使用Cornerstone.js渲染影像

    // 模拟加载过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟影像信息
    imageInfo.value = {
      patientName: '测试患者',
      studyDate: '2024-01-01',
      width: 512,
      height: 512
    }

    hasImage.value = true
    ElMessage.success('DICOM文件加载成功')
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载文件失败'
    ElMessage.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// 清除错误
const clearError = () => {
  error.value = ''
}
</script>

<style scoped>
.image-viewer-component {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}

.viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-image-placeholder {
  text-align: center;
  color: #909399;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: #c0c4cc;
}

.image-canvas {
  width: 100%;
  height: 100%;
  position: relative;
}

.canvas-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  border: 2px dashed #c0c4cc;
  border-radius: 8px;
  margin: 20px;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 10;
}

.loading-icon {
  font-size: 48px;
  margin-bottom: 20px;
  animation: rotate 2s linear infinite;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #f56c6c;
}

.image-info-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 5;
}

.info-item {
  margin-bottom: 5px;
}

.info-item:last-child {
  margin-bottom: 0;
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
