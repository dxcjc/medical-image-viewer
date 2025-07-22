<template>
  <div v-if="showMonitor" class="performance-monitor">
    <div class="monitor-header">
      <h4>性能监控</h4>
      <el-button size="small" @click="toggleMonitor">
        {{ isExpanded ? '收起' : '展开' }}
      </el-button>
    </div>
    
    <div v-if="isExpanded" class="monitor-content">
      <!-- FPS 监控 -->
      <div class="metric-item">
        <span class="metric-label">FPS:</span>
        <span class="metric-value" :class="getFpsClass(fps)">{{ fps }}</span>
      </div>
      
      <!-- 内存使用 -->
      <div class="metric-item">
        <span class="metric-label">内存:</span>
        <span class="metric-value">{{ formatMemory(memoryUsage) }}</span>
      </div>
      
      <!-- 渲染时间 -->
      <div class="metric-item">
        <span class="metric-label">渲染时间:</span>
        <span class="metric-value">{{ renderTime }}ms</span>
      </div>
      
      <!-- 组件数量 -->
      <div class="metric-item">
        <span class="metric-label">组件数:</span>
        <span class="metric-value">{{ componentCount }}</span>
      </div>
      
      <!-- 网络状态 -->
      <div class="metric-item">
        <span class="metric-label">网络:</span>
        <span class="metric-value" :class="getNetworkClass(networkStatus)">
          {{ networkStatus }}
        </span>
      </div>
      
      <!-- 性能图表 -->
      <div class="performance-chart">
        <canvas ref="chartCanvas" width="200" height="60"></canvas>
      </div>
      
      <!-- 操作按钮 -->
      <div class="monitor-actions">
        <el-button size="small" @click="clearMetrics">清除</el-button>
        <el-button size="small" @click="exportMetrics">导出</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false,
  position: 'top-right'
})

// 响应式数据
const showMonitor = ref(props.enabled)
const isExpanded = ref(false)
const fps = ref(0)
const memoryUsage = ref(0)
const renderTime = ref(0)
const componentCount = ref(0)
const networkStatus = ref('online')
const chartCanvas = ref<HTMLCanvasElement>()

// 性能数据
const fpsHistory = ref<number[]>([])
const maxHistoryLength = 60

// 定时器
let fpsTimer: number | null = null
let memoryTimer: number | null = null
let renderTimer: number | null = null

// FPS 监控
const startFpsMonitoring = () => {
  let lastTime = performance.now()
  let frameCount = 0
  
  const measureFps = () => {
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime - lastTime >= 1000) {
      fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
      
      // 更新历史数据
      fpsHistory.value.push(fps.value)
      if (fpsHistory.value.length > maxHistoryLength) {
        fpsHistory.value.shift()
      }
      
      frameCount = 0
      lastTime = currentTime
      
      // 更新图表
      updateChart()
    }
    
    if (showMonitor.value) {
      requestAnimationFrame(measureFps)
    }
  }
  
  requestAnimationFrame(measureFps)
}

// 内存监控
const startMemoryMonitoring = () => {
  const updateMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      memoryUsage.value = memory.usedJSHeapSize
    }
  }
  
  memoryTimer = window.setInterval(updateMemory, 1000)
}

// 渲染时间监控
const startRenderMonitoring = () => {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    for (const entry of entries) {
      if (entry.entryType === 'measure' && entry.name.includes('vue')) {
        renderTime.value = Math.round(entry.duration)
      }
    }
  })
  
  observer.observe({ entryTypes: ['measure'] })
}

// 组件数量监控
const updateComponentCount = () => {
  // 简单的组件计数（实际项目中可能需要更复杂的逻辑）
  const elements = document.querySelectorAll('[data-v-]')
  componentCount.value = elements.length
}

// 网络状态监控
const startNetworkMonitoring = () => {
  const updateNetworkStatus = () => {
    networkStatus.value = navigator.onLine ? 'online' : 'offline'
  }
  
  window.addEventListener('online', updateNetworkStatus)
  window.addEventListener('offline', updateNetworkStatus)
  updateNetworkStatus()
}

// 更新图表
const updateChart = () => {
  if (!chartCanvas.value) return
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  const width = chartCanvas.value.width
  const height = chartCanvas.value.height
  
  // 清除画布
  ctx.clearRect(0, 0, width, height)
  
  // 绘制背景
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, width, height)
  
  // 绘制FPS曲线
  if (fpsHistory.value.length > 1) {
    ctx.strokeStyle = '#409eff'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    const stepX = width / (maxHistoryLength - 1)
    const maxFps = 60
    
    fpsHistory.value.forEach((fps, index) => {
      const x = index * stepX
      const y = height - (fps / maxFps) * height
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
  }
  
  // 绘制基准线
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  
  // 60 FPS 线
  ctx.beginPath()
  ctx.moveTo(0, height - (60 / 60) * height)
  ctx.lineTo(width, height - (60 / 60) * height)
  ctx.stroke()
  
  // 30 FPS 线
  ctx.beginPath()
  ctx.moveTo(0, height - (30 / 60) * height)
  ctx.lineTo(width, height - (30 / 60) * height)
  ctx.stroke()
  
  ctx.setLineDash([])
}

// 工具函数
const getFpsClass = (fps: number) => {
  if (fps >= 55) return 'good'
  if (fps >= 30) return 'warning'
  return 'poor'
}

const getNetworkClass = (status: string) => {
  return status === 'online' ? 'good' : 'poor'
}

const formatMemory = (bytes: number) => {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)}MB`
}

const toggleMonitor = () => {
  isExpanded.value = !isExpanded.value
}

const clearMetrics = () => {
  fpsHistory.value = []
  fps.value = 0
  renderTime.value = 0
  updateChart()
}

const exportMetrics = () => {
  const data = {
    timestamp: new Date().toISOString(),
    fps: fps.value,
    memory: memoryUsage.value,
    renderTime: renderTime.value,
    componentCount: componentCount.value,
    networkStatus: networkStatus.value,
    fpsHistory: fpsHistory.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-metrics-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 生命周期
onMounted(() => {
  if (props.enabled) {
    nextTick(() => {
      startFpsMonitoring()
      startMemoryMonitoring()
      startRenderMonitoring()
      startNetworkMonitoring()
      
      // 定期更新组件数量
      setInterval(updateComponentCount, 2000)
    })
  }
})

onUnmounted(() => {
  if (fpsTimer) clearInterval(fpsTimer)
  if (memoryTimer) clearInterval(memoryTimer)
  if (renderTimer) clearInterval(renderTimer)
})

// 暴露控制方法
defineExpose({
  show: () => { showMonitor.value = true },
  hide: () => { showMonitor.value = false },
  toggle: () => { showMonitor.value = !showMonitor.value },
  getMetrics: () => ({
    fps: fps.value,
    memory: memoryUsage.value,
    renderTime: renderTime.value,
    componentCount: componentCount.value,
    networkStatus: networkStatus.value
  })
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  z-index: 9999;
  min-width: 200px;
  backdrop-filter: blur(5px);
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.monitor-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.monitor-content {
  space-y: 4px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.metric-label {
  color: #666;
}

.metric-value {
  font-weight: 600;
}

.metric-value.good {
  color: #67c23a;
}

.metric-value.warning {
  color: #e6a23c;
}

.metric-value.poor {
  color: #f56c6c;
}

.performance-chart {
  margin: 8px 0;
  border: 1px solid #eee;
  border-radius: 4px;
}

.monitor-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.monitor-actions .el-button {
  flex: 1;
}
</style>
