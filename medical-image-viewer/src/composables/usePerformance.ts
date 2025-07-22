import { ref, onMounted, onUnmounted } from 'vue'

// 性能监控组合函数
export function usePerformance() {
  const fps = ref(0)
  const memoryUsage = ref(0)
  const renderTime = ref(0)
  const isMonitoring = ref(false)

  let animationId: number | null = null
  let memoryTimer: number | null = null
  let lastTime = 0
  let frameCount = 0

  // 开始FPS监控
  const startFpsMonitoring = () => {
    const measureFps = (currentTime: number) => {
      frameCount++
      
      if (currentTime - lastTime >= 1000) {
        fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
      }
      
      if (isMonitoring.value) {
        animationId = requestAnimationFrame(measureFps)
      }
    }
    
    lastTime = performance.now()
    animationId = requestAnimationFrame(measureFps)
  }

  // 开始内存监控
  const startMemoryMonitoring = () => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        memoryUsage.value = memory.usedJSHeapSize
      }
    }
    
    memoryTimer = window.setInterval(updateMemory, 1000)
  }

  // 测量渲染时间
  const measureRenderTime = (name: string, fn: () => void) => {
    const start = performance.now()
    fn()
    const end = performance.now()
    renderTime.value = end - start
    
    // 记录性能标记
    performance.mark(`${name}-start`)
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
  }

  // 开始监控
  const startMonitoring = () => {
    if (isMonitoring.value) return
    
    isMonitoring.value = true
    startFpsMonitoring()
    startMemoryMonitoring()
  }

  // 停止监控
  const stopMonitoring = () => {
    isMonitoring.value = false
    
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    
    if (memoryTimer) {
      clearInterval(memoryTimer)
      memoryTimer = null
    }
  }

  // 获取性能报告
  const getPerformanceReport = () => {
    return {
      fps: fps.value,
      memory: memoryUsage.value,
      renderTime: renderTime.value,
      timestamp: Date.now()
    }
  }

  // 清理资源
  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    fps: readonly(fps),
    memoryUsage: readonly(memoryUsage),
    renderTime: readonly(renderTime),
    isMonitoring: readonly(isMonitoring),
    startMonitoring,
    stopMonitoring,
    measureRenderTime,
    getPerformanceReport
  }
}

// 组件性能监控
export function useComponentPerformance(componentName: string) {
  const { measureRenderTime } = usePerformance()
  const renderCount = ref(0)
  const totalRenderTime = ref(0)
  const averageRenderTime = ref(0)

  // 包装渲染函数
  const wrapRender = (renderFn: () => void) => {
    return () => {
      measureRenderTime(`${componentName}-render`, () => {
        renderFn()
        renderCount.value++
        totalRenderTime.value += performance.now()
        averageRenderTime.value = totalRenderTime.value / renderCount.value
      })
    }
  }

  // 重置统计
  const resetStats = () => {
    renderCount.value = 0
    totalRenderTime.value = 0
    averageRenderTime.value = 0
  }

  return {
    renderCount: readonly(renderCount),
    totalRenderTime: readonly(totalRenderTime),
    averageRenderTime: readonly(averageRenderTime),
    wrapRender,
    resetStats
  }
}

// 网络性能监控
export function useNetworkPerformance() {
  const connectionType = ref('unknown')
  const downlink = ref(0)
  const rtt = ref(0)
  const saveData = ref(false)

  const updateNetworkInfo = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connectionType.value = connection.effectiveType || 'unknown'
      downlink.value = connection.downlink || 0
      rtt.value = connection.rtt || 0
      saveData.value = connection.saveData || false
    }
  }

  onMounted(() => {
    updateNetworkInfo()
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', updateNetworkInfo)
    }
  })

  // 网络质量评估
  const networkQuality = computed(() => {
    if (connectionType.value === '4g' && downlink.value > 10) return 'excellent'
    if (connectionType.value === '4g' && downlink.value > 5) return 'good'
    if (connectionType.value === '3g' || downlink.value > 1) return 'fair'
    return 'poor'
  })

  return {
    connectionType: readonly(connectionType),
    downlink: readonly(downlink),
    rtt: readonly(rtt),
    saveData: readonly(saveData),
    networkQuality
  }
}

// 资源加载性能监控
export function useResourcePerformance() {
  const loadTimes = ref<Record<string, number>>({})
  const resourceSizes = ref<Record<string, number>>({})

  // 监控资源加载
  const monitorResource = (url: string, startTime: number) => {
    return {
      onLoad: (size?: number) => {
        const loadTime = performance.now() - startTime
        loadTimes.value[url] = loadTime
        if (size) {
          resourceSizes.value[url] = size
        }
      },
      onError: () => {
        loadTimes.value[url] = -1 // 表示加载失败
      }
    }
  }

  // 获取资源性能统计
  const getResourceStats = () => {
    const successful = Object.values(loadTimes.value).filter(time => time > 0)
    const failed = Object.values(loadTimes.value).filter(time => time === -1)
    
    return {
      totalResources: Object.keys(loadTimes.value).length,
      successfulLoads: successful.length,
      failedLoads: failed.length,
      averageLoadTime: successful.length > 0 
        ? successful.reduce((a, b) => a + b, 0) / successful.length 
        : 0,
      totalSize: Object.values(resourceSizes.value).reduce((a, b) => a + b, 0)
    }
  }

  return {
    loadTimes: readonly(loadTimes),
    resourceSizes: readonly(resourceSizes),
    monitorResource,
    getResourceStats
  }
}

// 用户交互性能监控
export function useInteractionPerformance() {
  const clickResponseTimes = ref<number[]>([])
  const scrollPerformance = ref<number[]>([])
  const inputLatency = ref<number[]>([])

  // 监控点击响应时间
  const measureClickResponse = (callback: () => void) => {
    return (event: Event) => {
      const startTime = performance.now()
      callback()
      const endTime = performance.now()
      clickResponseTimes.value.push(endTime - startTime)
      
      // 保持最近100次记录
      if (clickResponseTimes.value.length > 100) {
        clickResponseTimes.value.shift()
      }
    }
  }

  // 监控滚动性能
  const measureScrollPerformance = () => {
    let lastScrollTime = 0
    
    return (event: Event) => {
      const currentTime = performance.now()
      if (lastScrollTime > 0) {
        const deltaTime = currentTime - lastScrollTime
        scrollPerformance.value.push(deltaTime)
        
        if (scrollPerformance.value.length > 100) {
          scrollPerformance.value.shift()
        }
      }
      lastScrollTime = currentTime
    }
  }

  // 监控输入延迟
  const measureInputLatency = (callback: () => void) => {
    return (event: Event) => {
      const startTime = performance.now()
      
      // 使用 requestAnimationFrame 确保在下一帧测量
      requestAnimationFrame(() => {
        callback()
        const endTime = performance.now()
        inputLatency.value.push(endTime - startTime)
        
        if (inputLatency.value.length > 100) {
          inputLatency.value.shift()
        }
      })
    }
  }

  // 获取交互性能统计
  const getInteractionStats = () => {
    const avgClickResponse = clickResponseTimes.value.length > 0
      ? clickResponseTimes.value.reduce((a, b) => a + b, 0) / clickResponseTimes.value.length
      : 0

    const avgScrollPerformance = scrollPerformance.value.length > 0
      ? scrollPerformance.value.reduce((a, b) => a + b, 0) / scrollPerformance.value.length
      : 0

    const avgInputLatency = inputLatency.value.length > 0
      ? inputLatency.value.reduce((a, b) => a + b, 0) / inputLatency.value.length
      : 0

    return {
      averageClickResponse: avgClickResponse,
      averageScrollPerformance: avgScrollPerformance,
      averageInputLatency: avgInputLatency,
      clickSamples: clickResponseTimes.value.length,
      scrollSamples: scrollPerformance.value.length,
      inputSamples: inputLatency.value.length
    }
  }

  return {
    measureClickResponse,
    measureScrollPerformance,
    measureInputLatency,
    getInteractionStats
  }
}
