/**
 * 图像缓存管理器
 * 优化大文件加载性能和内存使用
 */

export interface CacheEntry {
  id: string
  imageData: ImageData
  canvas: HTMLCanvasElement
  lastAccessed: number
  size: number // 字节数
  metadata: {
    width: number
    height: number
    scale: number
    windowCenter: number
    windowWidth: number
    interpolationType: string
  }
}

export interface CacheOptions {
  maxMemoryUsage: number // MB
  maxEntries: number
  enableCompression: boolean
  compressionQuality: number
  enablePrefetch: boolean
  prefetchDistance: number
}

export class ImageCacheManager {
  private cache = new Map<string, CacheEntry>()
  private totalMemoryUsage = 0 // bytes
  private options: CacheOptions
  private compressionCanvas?: HTMLCanvasElement
  private compressionContext?: CanvasRenderingContext2D

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxMemoryUsage: 512, // 512MB
      maxEntries: 100,
      enableCompression: true,
      compressionQuality: 0.8,
      enablePrefetch: false,
      prefetchDistance: 2,
      ...options
    }

    // 初始化压缩Canvas
    if (this.options.enableCompression) {
      this.compressionCanvas = document.createElement('canvas')
      this.compressionContext = this.compressionCanvas.getContext('2d') || undefined
    }

    // 监听内存压力事件
    this.setupMemoryPressureHandling()
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    imageId: string,
    width: number,
    height: number,
    scale: number,
    windowCenter: number,
    windowWidth: number,
    interpolationType: string
  ): string {
    return `${imageId}_${width}x${height}_s${scale.toFixed(2)}_wc${windowCenter}_ww${windowWidth}_${interpolationType}`
  }

  /**
   * 计算图像数据大小
   */
  private calculateImageSize(imageData: ImageData): number {
    return imageData.width * imageData.height * 4 // RGBA
  }

  /**
   * 压缩图像数据
   */
  private compressImageData(imageData: ImageData, canvas: HTMLCanvasElement): string | null {
    if (!this.compressionCanvas || !this.compressionContext) {
      return null
    }

    try {
      this.compressionCanvas.width = imageData.width
      this.compressionCanvas.height = imageData.height
      this.compressionContext.putImageData(imageData, 0, 0)

      return this.compressionCanvas.toDataURL('image/jpeg', this.options.compressionQuality)
    } catch (error) {
      console.warn('图像压缩失败:', error)
      return null
    }
  }

  /**
   * 解压缩图像数据
   */
  private async decompressImageData(compressedData: string): Promise<{ imageData: ImageData; canvas: HTMLCanvasElement } | null> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          resolve({ imageData, canvas })
        } else {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = compressedData
    })
  }

  /**
   * 清理最少使用的缓存项
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return

    let oldestEntry: CacheEntry | null = null
    let oldestKey = ''

    for (const [key, entry] of this.cache) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = entry
        oldestKey = key
      }
    }

    if (oldestEntry) {
      this.totalMemoryUsage -= oldestEntry.size
      this.cache.delete(oldestKey)
      console.log(`缓存清理: 移除 ${oldestKey}, 释放 ${(oldestEntry.size / 1024 / 1024).toFixed(2)}MB`)
    }
  }

  /**
   * 检查并清理缓存
   */
  private checkAndCleanCache(): void {
    const maxMemoryBytes = this.options.maxMemoryUsage * 1024 * 1024

    // 清理超出内存限制的缓存
    while (this.totalMemoryUsage > maxMemoryBytes && this.cache.size > 0) {
      this.evictLeastRecentlyUsed()
    }

    // 清理超出数量限制的缓存
    while (this.cache.size > this.options.maxEntries) {
      this.evictLeastRecentlyUsed()
    }
  }

  /**
   * 设置内存压力处理
   */
  private setupMemoryPressureHandling(): void {
    // 监听内存压力事件（如果浏览器支持）
    if ('memory' in performance && 'addEventListener' in window) {
      window.addEventListener('beforeunload', () => {
        this.clear()
      })
    }

    // 定期检查内存使用情况
    setInterval(() => {
      if (this.totalMemoryUsage > this.options.maxMemoryUsage * 1024 * 1024 * 0.8) {
        console.log('内存使用接近限制，开始清理缓存')
        this.checkAndCleanCache()
      }
    }, 30000) // 每30秒检查一次
  }

  /**
   * 添加缓存项
   */
  async set(
    imageId: string,
    imageData: ImageData,
    canvas: HTMLCanvasElement,
    metadata: {
      width: number
      height: number
      scale: number
      windowCenter: number
      windowWidth: number
      interpolationType: string
    }
  ): Promise<void> {
    const key = this.generateCacheKey(
      imageId,
      metadata.width,
      metadata.height,
      metadata.scale,
      metadata.windowCenter,
      metadata.windowWidth,
      metadata.interpolationType
    )

    const size = this.calculateImageSize(imageData)
    const entry: CacheEntry = {
      id: imageId,
      imageData,
      canvas,
      lastAccessed: Date.now(),
      size,
      metadata
    }

    // 检查是否需要清理缓存
    this.checkAndCleanCache()

    // 添加新缓存项
    this.cache.set(key, entry)
    this.totalMemoryUsage += size

    console.log(`缓存添加: ${key}, 大小: ${(size / 1024 / 1024).toFixed(2)}MB, 总使用: ${(this.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`)
  }

  /**
   * 获取缓存项
   */
  get(
    imageId: string,
    width: number,
    height: number,
    scale: number,
    windowCenter: number,
    windowWidth: number,
    interpolationType: string
  ): CacheEntry | null {
    const key = this.generateCacheKey(
      imageId,
      width,
      height,
      scale,
      windowCenter,
      windowWidth,
      interpolationType
    )

    const entry = this.cache.get(key)
    if (entry) {
      entry.lastAccessed = Date.now()
      console.log(`缓存命中: ${key}`)
      return entry
    }

    console.log(`缓存未命中: ${key}`)
    return null
  }

  /**
   * 检查缓存是否存在
   */
  has(
    imageId: string,
    width: number,
    height: number,
    scale: number,
    windowCenter: number,
    windowWidth: number,
    interpolationType: string
  ): boolean {
    const key = this.generateCacheKey(
      imageId,
      width,
      height,
      scale,
      windowCenter,
      windowWidth,
      interpolationType
    )

    return this.cache.has(key)
  }

  /**
   * 删除特定图像的所有缓存
   */
  removeImage(imageId: string): void {
    const keysToRemove: string[] = []

    for (const [key, entry] of this.cache) {
      if (entry.id === imageId) {
        keysToRemove.push(key)
        this.totalMemoryUsage -= entry.size
      }
    }

    keysToRemove.forEach(key => this.cache.delete(key))
    console.log(`移除图像缓存: ${imageId}, 清理 ${keysToRemove.length} 个缓存项`)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.totalMemoryUsage = 0
    console.log('缓存已清空')
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    entryCount: number
    memoryUsage: number // MB
    memoryUsagePercent: number
    hitRate: number
  } {
    const memoryUsageMB = this.totalMemoryUsage / 1024 / 1024
    const maxMemoryMB = this.options.maxMemoryUsage
    const memoryUsagePercent = (memoryUsageMB / maxMemoryMB) * 100

    return {
      entryCount: this.cache.size,
      memoryUsage: memoryUsageMB,
      memoryUsagePercent,
      hitRate: 0 // TODO: 实现命中率统计
    }
  }

  /**
   * 预取相邻帧或相关图像
   */
  async prefetch(
    imageIds: string[],
    currentIndex: number,
    renderFunction: (imageId: string) => Promise<{ imageData: ImageData; canvas: HTMLCanvasElement; metadata: any }>
  ): Promise<void> {
    if (!this.options.enablePrefetch) return

    const prefetchPromises: Promise<void>[] = []

    for (let i = 1; i <= this.options.prefetchDistance; i++) {
      // 预取前面的图像
      const prevIndex = currentIndex - i
      if (prevIndex >= 0 && prevIndex < imageIds.length) {
        const imageId = imageIds[prevIndex]
        if (!this.hasAnyCache(imageId)) {
          prefetchPromises.push(this.prefetchImage(imageId, renderFunction))
        }
      }

      // 预取后面的图像
      const nextIndex = currentIndex + i
      if (nextIndex >= 0 && nextIndex < imageIds.length) {
        const imageId = imageIds[nextIndex]
        if (!this.hasAnyCache(imageId)) {
          prefetchPromises.push(this.prefetchImage(imageId, renderFunction))
        }
      }
    }

    // 并行执行预取
    await Promise.allSettled(prefetchPromises)
  }

  /**
   * 检查图像是否有任何缓存
   */
  private hasAnyCache(imageId: string): boolean {
    for (const entry of this.cache.values()) {
      if (entry.id === imageId) {
        return true
      }
    }
    return false
  }

  /**
   * 预取单个图像
   */
  private async prefetchImage(
    imageId: string,
    renderFunction: (imageId: string) => Promise<{ imageData: ImageData; canvas: HTMLCanvasElement; metadata: any }>
  ): Promise<void> {
    try {
      const result = await renderFunction(imageId)
      await this.set(imageId, result.imageData, result.canvas, result.metadata)
    } catch (error) {
      console.warn(`预取图像失败: ${imageId}`, error)
    }
  }

  /**
   * 设置缓存选项
   */
  setOptions(options: Partial<CacheOptions>): void {
    this.options = { ...this.options, ...options }
    this.checkAndCleanCache()
  }

  /**
   * 获取缓存选项
   */
  getOptions(): CacheOptions {
    return { ...this.options }
  }
}
