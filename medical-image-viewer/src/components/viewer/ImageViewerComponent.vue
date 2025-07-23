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
      <div v-else class="image-canvas h-full relative">
        <!-- Canvas渲染区域 -->
        <canvas 
          ref="imageCanvas"
          class="w-full h-full cursor-grab"
          @mouseenter="updateMousePosition"
          @mousemove="updateMousePosition"
          @mouseleave="clearMousePosition"
        ></canvas>

        <!-- 影像信息覆盖层 -->
        <div class="viewer-overlay top-4 left-4">
          <div class="text-xs space-y-1">
            <div>患者: {{ imageInfo && imageInfo.patientName || 'Unknown' }}</div>
            <div>模态: {{ imageInfo && imageInfo.modality || 'N/A' }}</div>
            <div>尺寸: {{ imageInfo && imageInfo.columns }}×{{ imageInfo && imageInfo.rows }}</div>
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
        <div v-if="mousePosition.x >= 0" class="viewer-overlay bottom-4 right-4">
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
            <p class="text-lg font-medium text-medical-text-primary">正在解析DICOM文件...</p>
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
            <el-button type="primary" @click="retry">重新加载</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue APIs are auto-imported
// ElMessage is auto-imported
import { Picture, Upload, Loading, WarningFilled } from '@element-plus/icons-vue'
import { DicomParser, DicomImage } from '@/services/dicom/DicomParser'
import { ImageViewerService, ViewportState } from '@/services/viewer/ImageViewerService'

// 响应式数据
const viewerContainer = ref<HTMLElement>()
const imageCanvas = ref<HTMLCanvasElement>()
const hasImage = ref(false)
const isLoading = ref(false)
const error = ref<string>('')
const imageInfo = ref<any>(null)

// 查看器状态
const zoomLevel = ref(100)
const windowWidth = ref(400)
const windowCenter = ref(40)
const mousePosition = ref({ x: -1, y: -1 })
const pixelValue = ref(0)

// 服务实例
const viewerService = new ImageViewerService()
let currentDicomImage: DicomImage | null = null

// 暴露给父组件的方法
defineExpose({
  loadDicomImage,
  resetView: () => viewerService.resetViewport(),
  fitToWindow: () => viewerService.fitToWindow(),
  actualSize: () => viewerService.actualSize(),
  zoom: (factor: number) => viewerService.zoom(factor),
  rotate: (angle: number) => viewerService.rotate(angle),
  flipHorizontal: () => viewerService.flip(true),
  flipVertical: () => viewerService.flip(false),
  invert: () => viewerService.invert(),
  applyWindowLevel: (center: number, width: number) => applyWindowLevel(center, width)
})

// 生命周期
onMounted(async () => {
  await nextTick()
  initializeViewer()
})

onUnmounted(() => {
  cleanup()
})

// 监听视口状态变化
watch(() => viewerService.getViewportState(), (state: ViewportState) => {
  zoomLevel.value = Math.round(state.scale * 100)
}, { deep: true })

// 初始化查看器
const initializeViewer = () => {
  console.log('初始化影像查看器')
  
  if (imageCanvas.value) {
    // 设置Canvas尺寸
    const container = viewerContainer.value
    if (container) {
      imageCanvas.value.width = container.clientWidth
      imageCanvas.value.height = container.clientHeight
    }
    
    // 初始化查看器服务
    viewerService.initialize(imageCanvas.value)
  }
}

// 清理资源
const cleanup = () => {
  console.log('清理影像查看器资源')
  viewerService.destroy()
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

    console.log('开始加载DICOM文件:', file.name)

    // 使用DicomParser解析文件
    const dicomImage = await DicomParser.parseDicomFile(file)
    
    // 设置图像信息
    imageInfo.value = dicomImage.metadata
    currentDicomImage = dicomImage
    
    // 设置窗宽窗位
    const wc = Array.isArray(dicomImage.metadata.windowCenter) 
      ? dicomImage.metadata.windowCenter[0] 
      : dicomImage.metadata.windowCenter || 128
    const ww = Array.isArray(dicomImage.metadata.windowWidth) 
      ? dicomImage.metadata.windowWidth[0] 
      : dicomImage.metadata.windowWidth || 256
    
    windowCenter.value = wc
    windowWidth.value = ww

    // 在查看器中显示图像
    viewerService.setDicomImage(dicomImage)
    
    hasImage.value = true
    ElMessage.success(`DICOM文件加载成功: ${file.name}`)
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载文件失败'
    ElMessage.error(error.value)
    console.error('DICOM文件加载失败:', err)
  } finally {
    isLoading.value = false
  }
}

// 加载DICOM图像（供外部调用）
const loadDicomImage = async (dicomImage: DicomImage) => {
  try {
    imageInfo.value = dicomImage.metadata
    currentDicomImage = dicomImage
    
    // 设置窗宽窗位
    const wc = Array.isArray(dicomImage.metadata.windowCenter) 
      ? dicomImage.metadata.windowCenter[0] 
      : dicomImage.metadata.windowCenter || 128
    const ww = Array.isArray(dicomImage.metadata.windowWidth) 
      ? dicomImage.metadata.windowWidth[0] 
      : dicomImage.metadata.windowWidth || 256
    
    windowCenter.value = wc
    windowWidth.value = ww

    // 在查看器中显示图像
    viewerService.setDicomImage(dicomImage)
    
    hasImage.value = true
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '显示图像失败'
    ElMessage.error(error.value)
  }
}

// 应用窗宽窗位
const applyWindowLevel = (center: number, width: number) => {
  if (currentDicomImage) {
    windowCenter.value = center
    windowWidth.value = width
    
    // 重新应用窗宽窗位
    DicomParser.applyWindowLevel(currentDicomImage, center, width)
    
    // 重新渲染
    viewerService.setDicomImage(currentDicomImage)
  }
}

// 更新鼠标位置
const updateMousePosition = (event: MouseEvent) => {
  if (!imageCanvas.value || !currentDicomImage) return
  
  const rect = imageCanvas.value.getBoundingClientRect()
  const x = Math.floor(event.clientX - rect.left)
  const y = Math.floor(event.clientY - rect.top)
  
  mousePosition.value = { x, y }
  
  // 计算像素值（简化版本）
  // 实际实现需要考虑视口变换
  if (x >= 0 && x < currentDicomImage.width && y >= 0 && y < currentDicomImage.height) {
    const pixelIndex = y * currentDicomImage.width + x
    if (pixelIndex < currentDicomImage.pixelData.length) {
      pixelValue.value = currentDicomImage.pixelData[pixelIndex]
    }
  }
}

// 清除鼠标位置
const clearMousePosition = () => {
  mousePosition.value = { x: -1, y: -1 }
  pixelValue.value = 0
}

// 重试加载
const retry = () => {
  error.value = ''
  openFileDialog()
}
</script>

<style scoped>
.image-viewer-component {
  background: radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%);
}

canvas {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

canvas:active {
  cursor: grabbing !important;
}
</style>
