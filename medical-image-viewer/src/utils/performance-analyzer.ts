// 医疗图像查看器性能分析系统
// Performance Analysis System for Medical Image Viewer

import { ref, reactive } from 'vue'

// 性能指标接口
interface PerformanceMetrics {
  // 渲染性能
  fps: number
  frameTime: number
  renderTime: number
  
  // 内存使用
  memoryUsed: number
  memoryTotal: number
  memoryPercentage: number
  
  // 网络性能
  networkLatency: number
  downloadSpeed: number
  uploadSpeed: number
  
  // 用户交互
  inputLatency: number
  scrollPerformance: number
  clickResponseTime: number
  
  // 图像处理
  imageLoadTime: number
  imageRenderTime: number
  canvasDrawTime: number
  
  // 系统资源
  cpuUsage: number
  gpuUsage: number
  diskIO: number
}

// 性能事件接口
interface PerformanceEvent {
  id: string
  name: string
  startTime: number
  endTime?: number
  duration?: number
  category: 'render' | 'network' | 'interaction' | 'image' | 'system'
  metadata?: Record<string, any>
}

// 性能警告接口
interface PerformanceWarning {
  id: string
  type: 'fps_drop' | 'memory_leak' | 'slow_render' | 'network_slow' | 'high_cpu'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  metrics: Partial<PerformanceMetrics>
  suggestions: string[]
}

class PerformanceAnalyzer {
  private static instance: PerformanceAnalyzer
  private isMonitoring = false
  private metrics = reactive<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    renderTime: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    memoryPercentage: 0,
    networkLatency: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    inputLatency: 0,
    scrollPerformance: 0,
    clickResponseTime: 0,
    imageLoadTime: 0,
    imageRenderTime: 0,
    canvasDrawTime: 0,
    cpuUsage: 0,
    gpuUsage: 0,
    diskIO: 0
  })
  
  private events: PerformanceEvent[] = []
  private warnings: PerformanceWarning[] = []
  private observers: Array<(metrics: PerformanceMetrics) => void> = []
  
  // FPS监控
  private fpsCounter = 0
  private lastFpsTime = 0
  private frameId: number | null = null
  
  // 内存监控
  private memoryTimer: number | null = null
  
  // 网络监控
  private networkTests: Array<{ start: number; size: number }> = []
  
  // 性能阈值
  private thresholds = {
    minFps: 30,
    maxMemoryUsage: 0.8, // 80%
    maxRenderTime: 16.67, // 60fps = 16.67ms per frame
    maxInputLatency: 100,
    maxImageLoadTime: 3000
  }

  static getInstance(): PerformanceAnalyzer {
    if (!PerformanceAnalyzer.instance) {
      PerformanceAnalyzer.instance = new PerformanceAnalyzer()
    }
    return PerformanceAnalyzer.instance
  }

  // 开始性能监控
  startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.startFpsMonitoring()
    this.startMemoryMonitoring()
    this.startNetworkMonitoring()
    this.setupPerformanceObserver()
    
    console.log('🚀 Performance monitoring started')
  }

  // 停止性能监控
  stopMonitoring(): void {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
    
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer)
      this.memoryTimer = null
    }
    
    console.log('⏹️ Performance monitoring stopped')
  }

  // FPS监控
  private startFpsMonitoring(): void {
    const measureFps = (currentTime: number) => {
      this.fpsCounter++
      
      if (currentTime - this.lastFpsTime >= 1000) {
        this.metrics.fps = Math.round((this.fpsCounter * 1000) / (currentTime - this.lastFpsTime))
        this.metrics.frameTime = (currentTime - this.lastFpsTime) / this.fpsCounter
        
        // 检查FPS警告
        if (this.metrics.fps < this.thresholds.minFps) {
          this.addWarning({
            type: 'fps_drop',
            severity: this.metrics.fps < 15 ? 'critical' : 'high',
            message: `FPS降至${this.metrics.fps}，低于最低要求${this.thresholds.minFps}`,
            metrics: { fps: this.metrics.fps },
            suggestions: [
              '减少同时显示的图像数量',
              '降低图像质量设置',
              '关闭不必要的视觉效果',
              '检查是否有内存泄漏'
            ]
          })
        }
        
        this.fpsCounter = 0
        this.lastFpsTime = currentTime
      }
      
      if (this.isMonitoring) {
        this.frameId = requestAnimationFrame(measureFps)
      }
    }
    
    this.lastFpsTime = performance.now()
    this.frameId = requestAnimationFrame(measureFps)
  }

  // 内存监控
  private startMemoryMonitoring(): void {
    const updateMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.metrics.memoryUsed = memory.usedJSHeapSize
        this.metrics.memoryTotal = memory.totalJSHeapSize
        this.metrics.memoryPercentage = this.metrics.memoryUsed / this.metrics.memoryTotal
        
        // 检查内存警告
        if (this.metrics.memoryPercentage > this.thresholds.maxMemoryUsage) {
          this.addWarning({
            type: 'memory_leak',
            severity: this.metrics.memoryPercentage > 0.9 ? 'critical' : 'high',
            message: `内存使用率${Math.round(this.metrics.memoryPercentage * 100)}%，超过警告阈值`,
            metrics: { 
              memoryUsed: this.metrics.memoryUsed,
              memoryPercentage: this.metrics.memoryPercentage 
            },
            suggestions: [
              '清理不需要的图像缓存',
              '关闭未使用的标签页',
              '重启应用程序',
              '检查是否有内存泄漏'
            ]
          })
        }
      }
    }
    
    updateMemory()
    this.memoryTimer = window.setInterval(updateMemory, 1000)
  }

  // 网络监控
  private startNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const updateNetworkInfo = () => {
        this.metrics.networkLatency = connection.rtt || 0
        this.metrics.downloadSpeed = connection.downlink || 0
        
        // 检查网络警告
        if (this.metrics.networkLatency > 500) {
          this.addWarning({
            type: 'network_slow',
            severity: this.metrics.networkLatency > 1000 ? 'high' : 'medium',
            message: `网络延迟${this.metrics.networkLatency}ms，可能影响图像加载速度`,
            metrics: { networkLatency: this.metrics.networkLatency },
            suggestions: [
              '检查网络连接',
              '使用有线网络连接',
              '关闭其他网络应用',
              '联系网络管理员'
            ]
          })
        }
      }
      
      updateNetworkInfo()
      connection.addEventListener('change', updateNetworkInfo)
    }
  }

  // 设置性能观察器
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        for (const entry of entries) {
          if (entry.entryType === 'measure') {
            this.addEvent({
              name: entry.name,
              startTime: entry.startTime,
              endTime: entry.startTime + entry.duration,
              duration: entry.duration,
              category: this.categorizePerformanceEntry(entry.name)
            })
            
            // 检查渲染时间警告
            if (entry.name.includes('render') && entry.duration > this.thresholds.maxRenderTime) {
              this.addWarning({
                type: 'slow_render',
                severity: entry.duration > 50 ? 'high' : 'medium',
                message: `渲染时间${entry.duration.toFixed(2)}ms，超过建议值${this.thresholds.maxRenderTime}ms`,
                metrics: { renderTime: entry.duration },
                suggestions: [
                  '优化渲染算法',
                  '减少DOM操作',
                  '使用GPU加速',
                  '分批处理大量数据'
                ]
              })
            }
          }
        }
      })
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
    }
  }

  // 测量性能事件
  startMeasure(name: string, category: PerformanceEvent['category'] = 'render'): string {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    performance.mark(`${id}-start`)
    
    const event: PerformanceEvent = {
      id,
      name,
      startTime: performance.now(),
      category
    }
    
    this.events.push(event)
    return id
  }

  endMeasure(id: string): number {
    const event = this.events.find(e => e.id === id)
    if (!event) return 0
    
    const endTime = performance.now()
    const duration = endTime - event.startTime
    
    event.endTime = endTime
    event.duration = duration
    
    performance.mark(`${id}-end`)
    performance.measure(event.name, `${id}-start`, `${id}-end`)
    
    return duration
  }

  // 记录图像加载性能
  recordImageLoad(imageId: string, loadTime: number, size: number): void {
    this.metrics.imageLoadTime = loadTime
    
    this.addEvent({
      name: `image-load-${imageId}`,
      startTime: performance.now() - loadTime,
      endTime: performance.now(),
      duration: loadTime,
      category: 'image',
      metadata: { imageId, size }
    })
    
    if (loadTime > this.thresholds.maxImageLoadTime) {
      this.addWarning({
        type: 'network_slow',
        severity: loadTime > 10000 ? 'high' : 'medium',
        message: `图像加载时间${loadTime}ms，超过建议值${this.thresholds.maxImageLoadTime}ms`,
        metrics: { imageLoadTime: loadTime },
        suggestions: [
          '优化图像压缩',
          '使用CDN加速',
          '实现图像预加载',
          '检查网络连接'
        ]
      })
    }
  }

  // 记录用户交互性能
  recordInteraction(type: 'click' | 'scroll' | 'input', latency: number): void {
    switch (type) {
      case 'click':
        this.metrics.clickResponseTime = latency
        break
      case 'scroll':
        this.metrics.scrollPerformance = latency
        break
      case 'input':
        this.metrics.inputLatency = latency
        break
    }
    
    if (latency > this.thresholds.maxInputLatency) {
      this.addWarning({
        type: 'slow_render',
        severity: latency > 200 ? 'high' : 'medium',
        message: `${type}响应时间${latency}ms，超过建议值${this.thresholds.maxInputLatency}ms`,
        metrics: { inputLatency: latency },
        suggestions: [
          '优化事件处理函数',
          '使用防抖和节流',
          '减少DOM查询',
          '使用虚拟滚动'
        ]
      })
    }
  }

  // 添加性能事件
  private addEvent(event: Omit<PerformanceEvent, 'id'>): void {
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.events.push({ id, ...event })
    
    // 保持事件列表大小
    if (this.events.length > 1000) {
      this.events.splice(0, 100)
    }
  }

  // 添加性能警告
  private addWarning(warning: Omit<PerformanceWarning, 'id' | 'timestamp'>): void {
    const id = `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newWarning: PerformanceWarning = {
      id,
      timestamp: Date.now(),
      ...warning
    }
    
    this.warnings.push(newWarning)
    
    // 保持警告列表大小
    if (this.warnings.length > 100) {
      this.warnings.splice(0, 10)
    }
    
    // 通知观察者
    console.warn(`⚠️ Performance Warning [${warning.severity}]: ${warning.message}`)
  }

  // 分类性能条目
  private categorizePerformanceEntry(name: string): PerformanceEvent['category'] {
    if (name.includes('render') || name.includes('paint') || name.includes('draw')) {
      return 'render'
    }
    if (name.includes('network') || name.includes('fetch') || name.includes('load')) {
      return 'network'
    }
    if (name.includes('click') || name.includes('scroll') || name.includes('input')) {
      return 'interaction'
    }
    if (name.includes('image') || name.includes('canvas') || name.includes('dicom')) {
      return 'image'
    }
    return 'system'
  }

  // 获取性能报告
  getPerformanceReport(): {
    metrics: PerformanceMetrics
    events: PerformanceEvent[]
    warnings: PerformanceWarning[]
    summary: {
      overallScore: number
      recommendations: string[]
    }
  } {
    const overallScore = this.calculateOverallScore()
    const recommendations = this.generateRecommendations()
    
    return {
      metrics: { ...this.metrics },
      events: [...this.events],
      warnings: [...this.warnings],
      summary: {
        overallScore,
        recommendations
      }
    }
  }

  // 计算总体性能评分
  private calculateOverallScore(): number {
    let score = 100
    
    // FPS评分 (30%)
    const fpsScore = Math.min(this.metrics.fps / 60, 1) * 30
    
    // 内存评分 (25%)
    const memoryScore = Math.max(1 - this.metrics.memoryPercentage, 0) * 25
    
    // 响应时间评分 (25%)
    const responseScore = Math.max(1 - this.metrics.inputLatency / 200, 0) * 25
    
    // 渲染时间评分 (20%)
    const renderScore = Math.max(1 - this.metrics.renderTime / 50, 0) * 20
    
    score = fpsScore + memoryScore + responseScore + renderScore
    
    return Math.round(Math.max(score, 0))
  }

  // 生成性能建议
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    if (this.metrics.fps < 30) {
      recommendations.push('优化渲染性能，减少不必要的重绘')
    }
    
    if (this.metrics.memoryPercentage > 0.8) {
      recommendations.push('优化内存使用，清理不需要的缓存')
    }
    
    if (this.metrics.inputLatency > 100) {
      recommendations.push('优化用户交互响应时间')
    }
    
    if (this.metrics.imageLoadTime > 3000) {
      recommendations.push('优化图像加载速度')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('性能表现良好，继续保持')
    }
    
    return recommendations
  }

  // 订阅性能更新
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(callback)
    
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  // 通知观察者
  private notifyObservers(): void {
    this.observers.forEach(callback => callback({ ...this.metrics }))
  }

  // 导出性能数据
  exportData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      events: this.events.slice(-100), // 最近100个事件
      warnings: this.warnings.slice(-50), // 最近50个警告
      summary: {
        overallScore: this.calculateOverallScore(),
        recommendations: this.generateRecommendations()
      }
    }
    
    return JSON.stringify(data, null, 2)
  }

  // 清理数据
  clearData(): void {
    this.events.length = 0
    this.warnings.length = 0
    console.log('🧹 Performance data cleared')
  }
}

// 导出单例实例
export const performanceAnalyzer = PerformanceAnalyzer.getInstance()

// 导出类型
export type { PerformanceMetrics, PerformanceEvent, PerformanceWarning }
