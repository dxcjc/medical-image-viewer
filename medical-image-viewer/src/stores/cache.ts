import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 缓存项接口
export interface CacheItem {
  key: string
  data: any
  size: number
  priority: number
  lastAccessed: number
  accessCount: number
  created: number
  expires?: number
}

// 缓存统计接口
export interface CacheStats {
  totalSize: number
  itemCount: number
  hitCount: number
  missCount: number
  hitRate: number
  memoryUsage: number
}

// 缓存配置接口
export interface CacheConfig {
  maxMemoryUsage: number // 最大内存使用量（字节）
  maxItemCount: number // 最大缓存项数量
  defaultTTL: number // 默认过期时间（毫秒）
  cleanupInterval: number // 清理间隔（毫秒）
}

export const useCacheStore = defineStore('cache', () => {
  // 状态
  const cache = ref(new Map<string, CacheItem>())
  const config = ref<CacheConfig>({
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB
    maxItemCount: 1000,
    defaultTTL: 30 * 60 * 1000, // 30分钟
    cleanupInterval: 5 * 60 * 1000 // 5分钟
  })

  const stats = ref({
    hitCount: 0,
    missCount: 0
  })

  let cleanupTimer: number | null = null

  // 计算属性
  const cacheStats = computed((): CacheStats => {
    const items = Array.from(cache.value.values())
    const totalSize = items.reduce((sum, item) => sum + item.size, 0)
    const itemCount = items.length
    const totalRequests = stats.value.hitCount + stats.value.missCount
    const hitRate = totalRequests > 0 ? stats.value.hitCount / totalRequests : 0

    return {
      totalSize,
      itemCount,
      hitCount: stats.value.hitCount,
      missCount: stats.value.missCount,
      hitRate,
      memoryUsage: totalSize / config.value.maxMemoryUsage
    }
  })

  const isMemoryLimitExceeded = computed(() => {
    return cacheStats.value.totalSize > config.value.maxMemoryUsage
  })

  const isItemLimitExceeded = computed(() => {
    return cacheStats.value.itemCount > config.value.maxItemCount
  })

  // 缓存操作方法
  const set = (
    key: string,
    data: any,
    options?: {
      priority?: number
      ttl?: number
    }
  ): void => {
    const size = calculateSize(data)
    const now = Date.now()

    const item: CacheItem = {
      key,
      data,
      size,
      priority: options?.priority || 1,
      lastAccessed: now,
      accessCount: 0,
      created: now,
      expires: options?.ttl ? now + options.ttl : now + config.value.defaultTTL
    }

    // 如果缓存项已存在，更新统计
    if (cache.value.has(key)) {
      const oldItem = cache.value.get(key)!
      item.accessCount = oldItem.accessCount
    }

    cache.value.set(key, item)

    // 检查是否需要清理
    if (isMemoryLimitExceeded.value || isItemLimitExceeded.value) {
      cleanup()
    }
  }

  const get = (key: string): any | null => {
    const item = cache.value.get(key)

    if (!item) {
      stats.value.missCount++
      return null
    }

    // 检查是否过期
    if (item.expires && Date.now() > item.expires) {
      cache.value.delete(key)
      stats.value.missCount++
      return null
    }

    // 更新访问统计
    item.lastAccessed = Date.now()
    item.accessCount++
    stats.value.hitCount++

    return item.data
  }

  const has = (key: string): boolean => {
    const item = cache.value.get(key)
    if (!item) return false

    // 检查是否过期
    if (item.expires && Date.now() > item.expires) {
      cache.value.delete(key)
      return false
    }

    return true
  }

  const remove = (key: string): boolean => {
    return cache.value.delete(key)
  }

  const clear = (): void => {
    cache.value.clear()
    stats.value.hitCount = 0
    stats.value.missCount = 0
  }

  // 清理过期和低优先级项
  const cleanup = (): void => {
    const now = Date.now()
    const items = Array.from(cache.value.values())

    // 1. 清理过期项
    items.forEach(item => {
      if (item.expires && now > item.expires) {
        cache.value.delete(item.key)
      }
    })

    // 2. 如果仍然超限，按优先级和访问频率清理
    if (isMemoryLimitExceeded.value || isItemLimitExceeded.value) {
      const remainingItems = Array.from(cache.value.values())

      // 计算每个项的重要性分数
      remainingItems.forEach(item => {
        const timeFactor = (now - item.lastAccessed) / 1000 // 秒
        const score = (item.priority * item.accessCount) / (1 + timeFactor)
        ;(item as any).score = score
      })

      // 按分数排序，删除分数最低的项
      remainingItems.sort((a, b) => (a as any).score - (b as any).score)

      const targetSize = config.value.maxMemoryUsage * 0.8 // 清理到80%
      const targetCount = config.value.maxItemCount * 0.8

      for (const item of remainingItems) {
        if (cacheStats.value.totalSize <= targetSize && cacheStats.value.itemCount <= targetCount) {
          break
        }
        cache.value.delete(item.key)
      }
    }
  }

  // 强制清理
  const forceCleanup = (): void => {
    cleanup()
  }

  // 计算数据大小（简单估算）
  const calculateSize = (data: any): number => {
    if (data instanceof ArrayBuffer) {
      return data.byteLength
    }

    if (data instanceof Blob) {
      return data.size
    }

    if (typeof data === 'string') {
      return data.length * 2 // Unicode字符
    }

    if (data instanceof ImageData) {
      return data.data.length
    }

    // 对象的粗略估算
    try {
      return JSON.stringify(data).length * 2
    } catch {
      return 1024 // 默认1KB
    }
  }

  // 预加载数据
  const preload = async (
    key: string,
    loader: () => Promise<any>,
    options?: {
      priority?: number
      ttl?: number
    }
  ): Promise<any> => {
    // 如果已经缓存，直接返回
    const cached = get(key)
    if (cached !== null) {
      return cached
    }

    try {
      const data = await loader()
      set(key, data, options)
      return data
    } catch (error) {
      console.error(`预加载失败: ${key}`, error)
      throw error
    }
  }

  // 批量设置
  const setMany = (
    items: Array<{
      key: string
      data: any
      options?: { priority?: number; ttl?: number }
    }>
  ): void => {
    items.forEach(item => {
      set(item.key, item.data, item.options)
    })
  }

  // 批量获取
  const getMany = (keys: string[]): Record<string, any> => {
    const result: Record<string, any> = {}
    keys.forEach(key => {
      const value = get(key)
      if (value !== null) {
        result[key] = value
      }
    })
    return result
  }

  // 获取缓存键列表
  const getKeys = (): string[] => {
    return Array.from(cache.value.keys())
  }

  // 获取缓存项详情
  const getItemInfo = (key: string): CacheItem | null => {
    return cache.value.get(key) || null
  }

  // 更新配置
  const updateConfig = (newConfig: Partial<CacheConfig>): void => {
    Object.assign(config.value, newConfig)

    // 重新启动清理定时器
    if (cleanupTimer) {
      clearInterval(cleanupTimer)
    }
    startCleanupTimer()
  }

  // 启动清理定时器
  const startCleanupTimer = (): void => {
    cleanupTimer = window.setInterval(() => {
      cleanup()
    }, config.value.cleanupInterval)
  }

  // 停止清理定时器
  const stopCleanupTimer = (): void => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }

  // 导出缓存数据
  const exportCache = (): any => {
    const items = Array.from(cache.value.entries()).map(([key, item]) => ({
      key,
      data: item.data,
      metadata: {
        size: item.size,
        priority: item.priority,
        created: item.created,
        lastAccessed: item.lastAccessed,
        accessCount: item.accessCount
      }
    }))

    return {
      items,
      stats: stats.value,
      config: config.value,
      timestamp: Date.now()
    }
  }

  // 导入缓存数据
  const importCache = (data: any): void => {
    clear()

    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        set(item.key, item.data, {
          priority: item.metadata?.priority
        })
      })
    }

    if (data.config) {
      updateConfig(data.config)
    }
  }

  // 初始化
  const initialize = (): void => {
    startCleanupTimer()
  }

  // 销毁
  const destroy = (): void => {
    stopCleanupTimer()
    clear()
  }

  return {
    // 状态
    cache,
    config,

    // 计算属性
    cacheStats,
    isMemoryLimitExceeded,
    isItemLimitExceeded,

    // 方法
    set,
    get,
    has,
    remove,
    clear,
    cleanup,
    forceCleanup,
    preload,
    setMany,
    getMany,
    getKeys,
    getItemInfo,
    updateConfig,
    exportCache,
    importCache,
    initialize,
    destroy
  }
})
