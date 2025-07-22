// UI优化工具函数库

import { PERFORMANCE_CONFIG, ACCESSIBILITY_CONFIG } from '@/config/ui-optimization'

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = window.setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 延迟执行函数
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 重试函数
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (attempts <= 1) {
      throw error
    }
    
    await delay(delayMs)
    return retry(fn, attempts - 1, delayMs * 2) // 指数退避
  }
}

// 内存管理工具
export class MemoryManager {
  private static instance: MemoryManager
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private cleanupTimer: number | null = null

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  private constructor() {
    this.startCleanup()
  }

  // 设置缓存
  set(key: string, data: any, ttl: number = PERFORMANCE_CONFIG.cache.ttl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // 检查缓存大小
    if (this.cache.size > PERFORMANCE_CONFIG.cache.maxSize) {
      this.cleanup()
    }
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  // 删除缓存
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // 清空缓存
  clear(): void {
    this.cache.clear()
  }

  // 获取缓存统计
  getStats() {
    const now = Date.now()
    let expired = 0
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expired++
      }
    }

    return {
      total: this.cache.size,
      expired,
      active: this.cache.size - expired
    }
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.cache.delete(key))
  }

  // 开始定期清理
  private startCleanup(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup()
    }, PERFORMANCE_CONFIG.cache.cleanupInterval)
  }

  // 停止清理
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }
}

// 对象池
export class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  private maxSize: number

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
  }

  // 获取对象
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  // 释放对象
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj)
      this.pool.push(obj)
    }
  }

  // 清空池
  clear(): void {
    this.pool.length = 0
  }

  // 获取池状态
  getStats() {
    return {
      available: this.pool.length,
      maxSize: this.maxSize
    }
  }
}

// 事件管理器
export class EventManager {
  private listeners = new Map<string, Set<Function>>()
  private onceListeners = new Map<string, Set<Function>>()

  // 添加事件监听器
  on(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(listener)
    
    // 返回取消监听的函数
    return () => this.off(event, listener)
  }

  // 添加一次性事件监听器
  once(event: string, listener: Function): () => void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set())
    }
    
    this.onceListeners.get(event)!.add(listener)
    
    return () => this.offOnce(event, listener)
  }

  // 移除事件监听器
  off(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener)
  }

  // 移除一次性事件监听器
  offOnce(event: string, listener: Function): void {
    this.onceListeners.get(event)?.delete(listener)
  }

  // 触发事件
  emit(event: string, ...args: any[]): void {
    // 触发普通监听器
    this.listeners.get(event)?.forEach(listener => {
      try {
        listener(...args)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })

    // 触发一次性监听器
    const onceListeners = this.onceListeners.get(event)
    if (onceListeners) {
      onceListeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`Error in once event listener for ${event}:`, error)
        }
      })
      onceListeners.clear()
    }
  }

  // 清空所有监听器
  clear(): void {
    this.listeners.clear()
    this.onceListeners.clear()
  }

  // 获取事件统计
  getStats() {
    const regularEvents = Array.from(this.listeners.entries()).map(([event, listeners]) => ({
      event,
      count: listeners.size
    }))

    const onceEvents = Array.from(this.onceListeners.entries()).map(([event, listeners]) => ({
      event,
      count: listeners.size
    }))

    return {
      regular: regularEvents,
      once: onceEvents,
      totalRegular: regularEvents.reduce((sum, e) => sum + e.count, 0),
      totalOnce: onceEvents.reduce((sum, e) => sum + e.count, 0)
    }
  }
}

// 性能测量工具
export class PerformanceMeasurer {
  private marks = new Map<string, number>()
  private measures = new Map<string, number>()

  // 开始测量
  start(name: string): void {
    this.marks.set(name, performance.now())
  }

  // 结束测量
  end(name: string): number {
    const startTime = this.marks.get(name)
    if (!startTime) {
      console.warn(`No start mark found for ${name}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.measures.set(name, duration)
    this.marks.delete(name)
    
    return duration
  }

  // 获取测量结果
  getMeasure(name: string): number | undefined {
    return this.measures.get(name)
  }

  // 获取所有测量结果
  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures)
  }

  // 清空测量结果
  clear(): void {
    this.marks.clear()
    this.measures.clear()
  }

  // 包装函数进行自动测量
  wrap<T extends (...args: any[]) => any>(name: string, fn: T): T {
    return ((...args: any[]) => {
      this.start(name)
      try {
        const result = fn(...args)
        
        // 处理异步函数
        if (result instanceof Promise) {
          return result.finally(() => {
            this.end(name)
          })
        }
        
        this.end(name)
        return result
      } catch (error) {
        this.end(name)
        throw error
      }
    }) as T
  }
}

// 无障碍访问工具
export class AccessibilityHelper {
  // 宣布消息给屏幕阅读器
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    
    document.body.appendChild(announcer)
    
    setTimeout(() => {
      announcer.textContent = message
      
      setTimeout(() => {
        document.body.removeChild(announcer)
      }, 1000)
    }, 100)
  }

  // 检查颜色对比度
  static checkContrast(foreground: string, background: string): {
    ratio: number
    passes: boolean
    level: 'AA' | 'AAA' | 'fail'
  } {
    const ratio = this.getContrastRatio(foreground, background)
    
    let level: 'AA' | 'AAA' | 'fail' = 'fail'
    if (ratio >= ACCESSIBILITY_CONFIG.contrast.preferredRatio) {
      level = 'AAA'
    } else if (ratio >= ACCESSIBILITY_CONFIG.contrast.minRatio) {
      level = 'AA'
    }

    return {
      ratio,
      passes: level !== 'fail',
      level
    }
  }

  // 计算颜色对比度
  private static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1)
    const lum2 = this.getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  // 计算颜色亮度
  private static getLuminance(color: string): number {
    const rgb = this.hexToRgb(color)
    if (!rgb) return 0

    const [r, g, b] = rgb.map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  // 十六进制转RGB
  private static hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null
  }
}

// 导出单例实例
export const memoryManager = MemoryManager.getInstance()
export const eventManager = new EventManager()
export const performanceMeasurer = new PerformanceMeasurer()
