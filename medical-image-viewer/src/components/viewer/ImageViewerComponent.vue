<template>
  <div class="image-viewer-component h-full relative">
    <div class="viewer-container h-full" ref="viewerContainer">
      <!-- 无影像状态 -->
      <div v-if="!hasImage" class="no-image-placeholder h-full flex flex-col items-center justify-center">
        <div class="text-center space-y-6">
          <div class="w-24 h-24 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-full flex items-center justify-center mx-auto animate-glow-pulse">
            <el-icon class="text-5xl text-primary-400"><Picture /></el-icon>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-medical-text-primary mb-2">开始影像查看</h3>
            <p class="text-medical-text-muted mb-6">请上传DICOM文件开始查看医学影像</p>
            <div class="space-y-3">
              <el-button type="primary" size="large" class="medical-button" @click="openFileDialog">
                <el-icon class="mr-2"><Upload /></el-icon>
                选择DICOM文件
              </el-button>
              <div class="text-xs text-medical-text-muted">
                支持 .dcm, .dicom 格式文件
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 影像显示区域 -->
      <div v-else class="image-canvas h-full relative" ref="imageCanvas">
        <!-- 影像渲染区域 -->
        <div class="canvas-placeholder h-full flex items-center justify-center">
          <div class="text-center space-y-4">
            <div class="w-16 h-16 bg-gradient-to-br from-success-400/20 to-success-600/20 rounded-full flex items-center justify-center mx-auto">
              <el-icon class="text-3xl text-success-400"><Monitor /></el-icon>
            </div>
            <div>
              <h4 class="text-lg font-semibold text-medical-text-primary mb-2">影像渲染区域</h4>
              <p class="text-medical-text-muted">Cornerstone.js 集成开发中...</p>
            </div>
          </div>
        </div>

        <!-- 影像信息覆盖层 -->
        <div class="viewer-overlay top-4 left-4">
          <div class="text-xs space-y-1">
            <div>患者: {{ imageInfo?.patientName || '张三' }}</div>
            <div>序列: T1WI</div>
            <div>层厚: 1.0mm</div>
          </div>
        </div>

        <!-- 缩放信息覆盖层 -->
        <div class="viewer-overlay top-4 right-4">
          <div class="text-xs">
            缩放: {{ zoomLevel }}%
          </div>
        </div>

        <!-- 窗宽窗位信息覆盖层 -->
        <div class="viewer-overlay bottom-4 left-4">
          <div class="text-xs space-y-1">
            <div>窗宽: {{ windowWidth }}</div>
            <div>窗位: {{ windowCenter }}</div>
          </div>
        </div>

        <!-- 鼠标位置信息覆盖层 -->
        <div class="viewer-overlay bottom-4 right-4">
          <div class="text-xs space-y-1">
            <div>X: {{ mousePosition.x }}</div>
            <div>Y: {{ mousePosition.y }}</div>
            <div>像素值: {{ pixelValue }}</div>
          </div>
        </div>
      </div>

      <!-- 加载状态覆盖层 -->
      <div v-if="isLoading" class="loading-overlay absolute inset-0 bg-medical-bg-primary/80 backdrop-blur-sm flex items-center justify-center z-20">
        <div class="text-center space-y-4">
          <el-icon class="text-4xl text-primary-400 animate-spin"><Loading /></el-icon>
          <div>
            <p class="text-lg font-medium text-medical-text-primary">正在加载影像...</p>
            <p class="text-sm text-medical-text-muted">请稍候</p>
          </div>
        </div>
      </div>

      <!-- 错误状态覆盖层 -->
      <div v-if="error" class="error-overlay absolute inset-0 bg-medical-bg-primary/80 backdrop-blur-sm flex items-center justify-center z-20">
        <div class="text-center space-y-4">
          <div class="w-16 h-16 bg-gradient-to-br from-danger-400/20 to-danger-600/20 rounded-full flex items-center justify-center mx-auto">
            <el-icon class="text-3xl text-danger-400"><WarningFilled /></el-icon>
          </div>
          <div>
            <p class="text-lg font-medium text-medical-text-primary mb-2">加载失败</p>
            <p class="text-sm text-medical-text-muted mb-4">{{ error }}</p>
            <el-button type="primary" @click="clearError">重新加载</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Upload, Loading, WarningFilled, Monitor } from '@element-plus/icons-vue'

// 响应式数据
const viewerContainer = ref<HTMLElement>()
const imageCanvas = ref<HTMLElement>()
const hasImage = ref(false)
const isLoading = ref(false)
const error = ref<string>('')
const imageInfo = ref<any>(null)

// 查看器状态
const zoomLevel = ref(100)
const windowWidth = ref(400)
const windowCenter = ref(40)
const mousePosition = ref({ x: 0, y: 0 })
const pixelValue = ref(0)

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
  background: radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%);
}

.canvas-placeholder {
  border: 2px dashed rgba(14, 165, 233, 0.3);
  border-radius: 12px;
  margin: 20px;
  background: rgba(14, 165, 233, 0.02);
  transition: all 0.3s ease;
}

.canvas-placeholder:hover {
  border-color: rgba(14, 165, 233, 0.5);
  background: rgba(14, 165, 233, 0.05);
}
</style>
