<template>
  <div 
    class="enhanced-image-viewer"
    :class="viewerClasses"
    :style="viewerStyles"
    @contextmenu.prevent
  >
    <!-- 图像容器 -->
    <div 
      ref="viewportRef"
      class="image-viewport"
      :class="viewportClasses"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @keydown="handleKeyDown"
      tabindex="0"
      role="img"
      :aria-label="imageAriaLabel"
    >
      <!-- 主图像Canvas -->
      <canvas
        ref="mainCanvasRef"
        class="main-canvas"
        :class="canvasClasses"
        :width="canvasWidth"
        :height="canvasHeight"
      />
      
      <!-- 覆盖层Canvas（用于标注、测量等） -->
      <canvas
        ref="overlayCanvasRef"
        class="overlay-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
      />
      
      <!-- 十字线 -->
      <div 
        v-if="showCrosshair && crosshairPosition"
        class="crosshair"
        :style="crosshairStyles"
      >
        <div class="crosshair-line crosshair-horizontal" />
        <div class="crosshair-line crosshair-vertical" />
      </div>
      
      <!-- 缩放指示器 -->
      <div 
        v-if="showZoomIndicator"
        class="zoom-indicator"
      >
        {{ Math.round(zoomLevel * 100) }}%
      </div>
      
      <!-- 窗宽窗位指示器 -->
      <div 
        v-if="showWindowLevelIndicator && currentImage"
        class="window-level-indicator"
      >
        <div class="indicator-item">
          <span class="indicator-label">窗宽:</span>
          <span class="indicator-value">{{ Math.round(windowWidth) }}</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-label">窗位:</span>
          <span class="indicator-value">{{ Math.round(windowCenter) }}</span>
        </div>
      </div>
      
      <!-- 图像信息覆盖层 -->
      <div 
        v-if="showImageInfo && currentImage"
        class="image-info-overlay"
      >
        <div class="info-section info-patient">
          <h4>患者信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">姓名:</span>
              <span class="info-value">{{ currentImage.patientName || 'Unknown' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ID:</span>
              <span class="info-value">{{ currentImage.patientId || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">性别:</span>
              <span class="info-value">{{ currentImage.patientSex || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">年龄:</span>
              <span class="info-value">{{ currentImage.patientAge || 'N/A' }}</span>
            </div>
          </div>
        </div>
        
        <div class="info-section info-study">
          <h4>检查信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">模态:</span>
              <span class="info-value">{{ currentImage.modality || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">日期:</span>
              <span class="info-value">{{ formatDate(currentImage.studyDate) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">描述:</span>
              <span class="info-value">{{ currentImage.studyDescription || 'N/A' }}</span>
            </div>
          </div>
        </div>
        
        <div class="info-section info-image">
          <h4>图像信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">尺寸:</span>
              <span class="info-value">{{ currentImage.width }}×{{ currentImage.height }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">像素间距:</span>
              <span class="info-value">{{ currentImage.pixelSpacing || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">层厚:</span>
              <span class="info-value">{{ currentImage.sliceThickness || 'N/A' }}mm</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 测量工具覆盖层 -->
      <div 
        v-if="measurements.length > 0"
        class="measurements-overlay"
      >
        <div
          v-for="measurement in measurements"
          :key="measurement.id"
          class="measurement-item"
          :class="`measurement-${measurement.type}`"
          :style="getMeasurementStyles(measurement)"
        >
          <div class="measurement-line" />
          <div class="measurement-label">
            {{ formatMeasurement(measurement) }}
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div 
        v-if="isLoading"
        class="loading-overlay"
      >
        <div class="loading-content">
          <svg class="loading-spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-opacity="0.25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p class="loading-text">{{ loadingMessage }}</p>
          <div v-if="loadingProgress > 0" class="loading-progress">
            <div 
              class="loading-progress-bar"
              :style="{ width: `${loadingProgress}%` }"
            />
          </div>
        </div>
      </div>
      
      <!-- 错误状态 -->
      <div 
        v-if="hasError && !isLoading"
        class="error-overlay"
      >
        <div class="error-content">
          <el-icon class="error-icon"><WarningFilled /></el-icon>
          <h3 class="error-title">图像加载失败</h3>
          <p class="error-message">{{ errorMessage }}</p>
          <div class="error-actions">
            <BaseButton
              variant="primary"
              size="sm"
              @click="retryLoad"
            >
              重试
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="sm"
              @click="clearError"
            >
              关闭
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 缩略图导航 -->
    <div 
      v-if="showThumbnails && thumbnails.length > 1"
      class="thumbnail-navigation"
    >
      <div class="thumbnail-list">
        <div
          v-for="(thumbnail, index) in thumbnails"
          :key="thumbnail.id"
          class="thumbnail-item"
          :class="{ 'thumbnail-active': index === currentImageIndex }"
          @click="selectImage(index)"
          @keydown="handleThumbnailKeydown(index, $event)"
          tabindex="0"
          role="button"
          :aria-label="`切换到第${index + 1}张图像`"
        >
          <img
            :src="thumbnail.url"
            :alt="thumbnail.alt"
            class="thumbnail-image"
            loading="lazy"
          />
          <div class="thumbnail-overlay">
            <span class="thumbnail-index">{{ index + 1 }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快捷键帮助 -->
    <div 
      v-if="showShortcutHelp"
      class="shortcut-help-overlay"
      @click="toggleShortcutHelp"
    >
      <div class="shortcut-help-content" @click.stop>
        <h3>快捷键帮助</h3>
        <div class="shortcut-grid">
          <div class="shortcut-item">
            <kbd>鼠标滚轮</kbd>
            <span>缩放图像</span>
          </div>
          <div class="shortcut-item">
            <kbd>鼠标拖拽</kbd>
            <span>平移图像</span>
          </div>
          <div class="shortcut-item">
            <kbd>右键拖拽</kbd>
            <span>调节窗宽窗位</span>
          </div>
          <div class="shortcut-item">
            <kbd>R</kbd>
            <span>重置视图</span>
          </div>
          <div class="shortcut-item">
            <kbd>F</kbd>
            <span>适应窗口</span>
          </div>
          <div class="shortcut-item">
            <kbd>I</kbd>
            <span>反色显示</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl + I</kbd>
            <span>显示图像信息</span>
          </div>
          <div class="shortcut-item">
            <kbd>H</kbd>
            <span>显示/隐藏帮助</span>
          </div>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          @click="toggleShortcutHelp"
          class="mt-4"
        >
          关闭
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useUIStore } from '@/stores/ui'
import { designTokens } from '@/design-system/tokens'
import BaseButton from '@/design-system/components/BaseButton.vue'
import { WarningFilled } from '@element-plus/icons-vue'

// 接口定义
interface DicomImage {
  id: string
  url: string
  width: number
  height: number
  patientName?: string
  patientId?: string
  patientSex?: string
  patientAge?: string
  modality?: string
  studyDate?: string
  studyDescription?: string
  pixelSpacing?: string
  sliceThickness?: number
  windowWidth?: number
  windowCenter?: number
}

interface Measurement {
  id: string
  type: 'length' | 'angle' | 'area'
  points: Array<{ x: number; y: number }>
  value: number
  unit: string
}

interface Props {
  // 图像数据
  currentImage?: DicomImage | null
  thumbnails?: Array<{ id: string; url: string; alt: string }>
  currentImageIndex?: number
  
  // 显示选项
  showCrosshair?: boolean
  showZoomIndicator?: boolean
  showWindowLevelIndicator?: boolean
  showImageInfo?: boolean
  showThumbnails?: boolean
  showShortcutHelp?: boolean
  
  // 交互选项
  enablePan?: boolean
  enableZoom?: boolean
  enableWindowLevel?: boolean
  enableMeasurement?: boolean
  
  // 状态
  isLoading?: boolean
  loadingMessage?: string
  loadingProgress?: number
  hasError?: boolean
  errorMessage?: string
  
  // 样式
  backgroundColor?: string
  invertColors?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentImageIndex: 0,
  showCrosshair: false,
  showZoomIndicator: true,
  showWindowLevelIndicator: true,
  showImageInfo: false,
  showThumbnails: true,
  showShortcutHelp: false,
  enablePan: true,
  enableZoom: true,
  enableWindowLevel: true,
  enableMeasurement: false,
  isLoading: false,
  loadingMessage: '加载中...',
  loadingProgress: 0,
  hasError: false,
  errorMessage: '',
  backgroundColor: '#000000',
  invertColors: false
})

const emit = defineEmits<{
  imageSelect: [index: number]
  zoomChange: [level: number]
  panChange: [x: number, y: number]
  windowLevelChange: [width: number, center: number]
  measurementAdd: [measurement: Measurement]
  measurementRemove: [id: string]
  error: [message: string]
  retry: []
}>()

// 组合函数
const uiStore = useUIStore()

// 响应式数据
const viewportRef = ref<HTMLElement>()
const mainCanvasRef = ref<HTMLCanvasElement>()
const overlayCanvasRef = ref<HTMLCanvasElement>()

// 视图状态
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const windowWidth = ref(400)
const windowCenter = ref(200)
const crosshairPosition = ref<{ x: number; y: number } | null>(null)
const measurements = ref<Measurement[]>([])

// 交互状态
const isDragging = ref(false)
const isWindowLeveling = ref(false)
const lastMousePosition = ref<{ x: number; y: number } | null>(null)
const touchStartDistance = ref(0)
const touchStartZoom = ref(1)

// 计算属性
const isMobile = computed(() => uiStore.state.isMobile)
const shouldReduceMotion = computed(() => uiStore.shouldReduceMotion)

const viewerClasses = computed(() => ({
  'viewer-mobile': isMobile.value,
  'viewer-reduced-motion': shouldReduceMotion.value,
  'viewer-inverted': props.invertColors,
  'viewer-loading': props.isLoading,
  'viewer-error': props.hasError
}))

const viewerStyles = computed(() => ({
  '--bg-color': props.backgroundColor,
  '--zoom-level': zoomLevel.value,
  '--pan-x': `${panX.value}px`,
  '--pan-y': `${panY.value}px`
}))

const canvasWidth = computed(() => viewportRef.value?.clientWidth || 800)
const canvasHeight = computed(() => viewportRef.value?.clientHeight || 600)

const imageAriaLabel = computed(() => {
  if (!props.currentImage) return '医学影像查看器'
  return `医学影像: ${props.currentImage.patientName || 'Unknown'}, ${props.currentImage.modality || 'Unknown'}`
})

// 方法实现将在下一部分继续...
</script>
