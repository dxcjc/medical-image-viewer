import type { DicomImage } from '../dicom/DicomParser'
import { DicomParser } from '../dicom/DicomParser'
import { ImageInterpolation, InterpolationType } from './ImageInterpolation'
import { ImageCacheManager } from './ImageCacheManager'

export interface ViewportState {
  scale: number
  translateX: number
  translateY: number
  rotation: number
  flipHorizontal: boolean
  flipVertical: boolean
  invert: boolean
}

export interface ViewportBounds {
  minScale: number
  maxScale: number
  width: number
  height: number
}

export interface RenderOptions {
  interpolationType: InterpolationType
  enableCaching: boolean
  enableAntiAliasing: boolean
  devicePixelRatio: number
  preservePixelValues: boolean
  enableGPUAcceleration: boolean
}

export interface PerformanceMetrics {
  renderTime: number
  cacheHitRate: number
  memoryUsage: number
  frameRate: number
  lastRenderTimestamp: number
}

export class ImageViewerService {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private dicomImage: DicomImage | null = null
  private viewport: ViewportState = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    invert: false
  }
  private bounds: ViewportBounds = {
    minScale: 0.1,
    maxScale: 10,
    width: 0,
    height: 0
  }

  private renderOptions: RenderOptions = {
    interpolationType: InterpolationType.BILINEAR,
    enableCaching: true,
    enableAntiAliasing: false,
    devicePixelRatio: window.devicePixelRatio || 1,
    preservePixelValues: true,
    enableGPUAcceleration: true
  }

  private cacheManager: ImageCacheManager
  private performanceMetrics: PerformanceMetrics = {
    renderTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    frameRate: 0,
    lastRenderTimestamp: 0
  }

  private isDragging = false
  private lastMouseX = 0
  private lastMouseY = 0
  private animationFrameId: number | null = null
  private renderQueue: Array<() => void> = []
  private isRendering = false
  
  constructor() {
    this.cacheManager = new ImageCacheManager({
      maxMemoryUsage: 512,
      maxEntries: 50,
      enableCompression: true,
      enablePrefetch: true
    })
  }

  /**
   * 初始化查看器
   */
  initialize(canvas: HTMLCanvasElement, options: Partial<RenderOptions> = {}): void {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

    if (!this.ctx) {
      throw new Error('无法获取Canvas 2D上下文')
    }

    // 合并渲染选项
    this.renderOptions = { ...this.renderOptions, ...options }

    // 设置高DPI支持
    this.setupHighDPICanvas()

    // 启用GPU加速（如果支持）
    if (this.renderOptions.enableGPUAcceleration) {
      this.enableGPUAcceleration()
    }

    this.setupEventListeners()
    this.updateBounds()

    console.log('ImageViewerService 初始化完成', {
      devicePixelRatio: this.renderOptions.devicePixelRatio,
      interpolationType: this.renderOptions.interpolationType,
      enableCaching: this.renderOptions.enableCaching
    })
  }
  
  /**
   * 设置高DPI Canvas
   */
  private setupHighDPICanvas(): void {
    if (!this.canvas || !this.ctx) return

    const dpr = this.renderOptions.devicePixelRatio
    const rect = this.canvas.getBoundingClientRect()

    // 设置Canvas的实际尺寸
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr

    // 设置Canvas的显示尺寸
    this.canvas.style.width = rect.width + 'px'
    this.canvas.style.height = rect.height + 'px'

    // 缩放上下文以匹配设备像素比
    this.ctx.scale(dpr, dpr)
  }

  /**
   * 启用GPU加速
   */
  private enableGPUAcceleration(): void {
    if (!this.ctx) return

    // 启用硬件加速提示
    this.ctx.imageSmoothingEnabled = !this.renderOptions.preservePixelValues
    this.ctx.imageSmoothingQuality = 'high'

    // 设置合成操作以利用GPU
    this.ctx.globalCompositeOperation = 'source-over'
  }

  /**
   * 设置DICOM图像
   */
  setDicomImage(dicomImage: DicomImage): void {
    this.dicomImage = dicomImage

    // 清除相关缓存
    if (this.renderOptions.enableCaching) {
      this.cacheManager.removeImage(dicomImage.metadata.sopInstanceUID || 'unknown')
    }

    this.resetViewport()
    this.queueRender()
  }
  
  /**
   * 获取当前视口状态
   */
  getViewportState(): ViewportState {
    return { ...this.viewport }
  }
  
  /**
   * 设置视口状态
   */
  setViewportState(state: Partial<ViewportState>): void {
    this.viewport = { ...this.viewport, ...state }
    this.constrainViewport()
    this.queueRender()
  }

  /**
   * 立即渲染（同步方法）
   */
  render(): void {
    this.queueRender()
  }
  
  /**
   * 渲染队列管理
   */
  private queueRender(): void {
    if (this.isRendering) {
      return
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.performRender()
    })
  }

  /**
   * 执行渲染
   */
  private async performRender(): Promise<void> {
    if (!this.ctx || !this.canvas || !this.dicomImage) return

    this.isRendering = true
    const startTime = performance.now()

    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey()
      let cachedEntry = null

      if (this.renderOptions.enableCaching) {
        cachedEntry = this.cacheManager.get(
          this.dicomImage.metadata.sopInstanceUID || 'unknown',
          this.canvas.width,
          this.canvas.height,
          this.viewport.scale,
          this.getCurrentWindowCenter(),
          this.getCurrentWindowWidth(),
          this.renderOptions.interpolationType
        )
      }

      if (cachedEntry) {
        // 使用缓存的图像
        this.renderCachedImage(cachedEntry)
      } else {
        // 渲染新图像
        await this.renderNewImage()
      }

      // 更新性能指标
      const renderTime = performance.now() - startTime
      this.updatePerformanceMetrics(renderTime)

    } catch (error) {
      console.error('渲染失败:', error)
    } finally {
      this.isRendering = false
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(): string {
    if (!this.dicomImage || !this.canvas) return ''

    return `${this.dicomImage.metadata.sopInstanceUID}_${this.canvas.width}x${this.canvas.height}_s${this.viewport.scale.toFixed(2)}_wc${this.getCurrentWindowCenter()}_ww${this.getCurrentWindowWidth()}_${this.renderOptions.interpolationType}`
  }

  /**
   * 渲染缓存的图像
   */
  private renderCachedImage(cachedEntry: any): void {
    if (!this.ctx || !this.canvas) return

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // 应用变换
    this.ctx.save()
    this.applyViewportTransform()

    // 绘制缓存的图像
    this.ctx.drawImage(cachedEntry.canvas, 0, 0)

    this.ctx.restore()
  }

  /**
   * 渲染新图像
   */
  private async renderNewImage(): Promise<void> {
    if (!this.ctx || !this.canvas || !this.dicomImage) return

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // 计算渲染尺寸
    const renderWidth = Math.ceil(this.dicomImage.width * this.viewport.scale)
    const renderHeight = Math.ceil(this.dicomImage.height * this.viewport.scale)

    // 创建或获取渲染用的ImageData
    let renderImageData: ImageData

    if (this.viewport.scale !== 1 && this.renderOptions.interpolationType !== InterpolationType.NEAREST_NEIGHBOR) {
      // 需要插值缩放
      renderImageData = await this.createInterpolatedImageData(renderWidth, renderHeight)
    } else {
      // 使用原始图像数据
      renderImageData = this.dicomImage.imageData || this.createFallbackImageData()
    }

    // 应用后处理
    if (this.renderOptions.enableAntiAliasing && this.viewport.scale > 1) {
      renderImageData = ImageInterpolation.applyAntiAliasing(renderImageData, 0.3)
    }

    // 创建渲染Canvas
    const renderCanvas = this.createRenderCanvas(renderImageData)

    // 缓存渲染结果
    if (this.renderOptions.enableCaching) {
      await this.cacheManager.set(
        this.dicomImage.metadata.sopInstanceUID || 'unknown',
        renderImageData,
        renderCanvas,
        {
          width: this.canvas.width,
          height: this.canvas.height,
          scale: this.viewport.scale,
          windowCenter: this.getCurrentWindowCenter(),
          windowWidth: this.getCurrentWindowWidth(),
          interpolationType: this.renderOptions.interpolationType
        }
      )
    }

    // 应用变换并绘制
    this.ctx.save()
    this.applyViewportTransform()
    this.ctx.drawImage(renderCanvas, 0, 0)
    this.ctx.restore()
  }

  /**
   * 缩放操作（增强版）
   */
  zoom(factor: number, centerX?: number, centerY?: number): void {
    if (!this.canvas) return

    const newScale = this.viewport.scale * factor
    const constrainedScale = Math.max(this.bounds.minScale, Math.min(this.bounds.maxScale, newScale))

    if (centerX !== undefined && centerY !== undefined) {
      // 以指定点为中心缩放
      const rect = this.canvas.getBoundingClientRect()
      const canvasX = (centerX - rect.left) / this.renderOptions.devicePixelRatio
      const canvasY = (centerY - rect.top) / this.renderOptions.devicePixelRatio

      const scaleFactor = constrainedScale / this.viewport.scale

      this.viewport.translateX = canvasX - (canvasX - this.viewport.translateX) * scaleFactor
      this.viewport.translateY = canvasY - (canvasY - this.viewport.translateY) * scaleFactor
    }

    this.viewport.scale = constrainedScale
    this.constrainViewport()

    // 根据缩放级别选择最佳插值类型
    if (this.dicomImage) {
      this.renderOptions.interpolationType = ImageInterpolation.getBestInterpolationType(
        this.dicomImage.width,
        this.dicomImage.height,
        this.dicomImage.width * constrainedScale,
        this.dicomImage.height * constrainedScale,
        false
      )
    }

    this.queueRender()
  }
  
  /**
   * 创建插值后的ImageData
   */
  private async createInterpolatedImageData(targetWidth: number, targetHeight: number): Promise<ImageData> {
    if (!this.dicomImage?.imageData) {
      throw new Error('没有可用的图像数据')
    }

    return ImageInterpolation.createScaledImageData(
      this.dicomImage.imageData,
      targetWidth,
      targetHeight,
      this.renderOptions.interpolationType
    )
  }

  /**
   * 创建备用ImageData
   */
  private createFallbackImageData(): ImageData {
    if (!this.dicomImage) {
      throw new Error('没有DICOM图像')
    }

    const width = this.dicomImage.width
    const height = this.dicomImage.height
    const data = new Uint8ClampedArray(width * height * 4)

    // 填充为灰色
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128     // R
      data[i + 1] = 128 // G
      data[i + 2] = 128 // B
      data[i + 3] = 255 // A
    }

    return new ImageData(data, width, height)
  }

  /**
   * 创建渲染Canvas
   */
  private createRenderCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.imageSmoothingEnabled = !this.renderOptions.preservePixelValues
      ctx.putImageData(imageData, 0, 0)
    }

    return canvas
  }

  /**
   * 应用视口变换
   */
  private applyViewportTransform(): void {
    if (!this.ctx || !this.dicomImage) return

    // 平移到中心点
    this.ctx.translate(this.viewport.translateX, this.viewport.translateY)

    // 缩放
    this.ctx.scale(this.viewport.scale, this.viewport.scale)

    // 旋转
    if (this.viewport.rotation !== 0) {
      this.ctx.rotate((this.viewport.rotation * Math.PI) / 180)
    }

    // 翻转
    if (this.viewport.flipHorizontal || this.viewport.flipVertical) {
      this.ctx.scale(
        this.viewport.flipHorizontal ? -1 : 1,
        this.viewport.flipVertical ? -1 : 1
      )
    }

    // 应用反色滤镜
    if (this.viewport.invert) {
      this.ctx.filter = 'invert(1)'
    }

    // 平移到图像中心
    this.ctx.translate(-this.dicomImage.width / 2, -this.dicomImage.height / 2)
  }

  /**
   * 获取当前窗位
   */
  private getCurrentWindowCenter(): number {
    if (!this.dicomImage) return 128

    const wc = this.dicomImage.metadata.windowCenter
    return Array.isArray(wc) ? wc[0] : wc || 128
  }

  /**
   * 获取当前窗宽
   */
  private getCurrentWindowWidth(): number {
    if (!this.dicomImage) return 256

    const ww = this.dicomImage.metadata.windowWidth
    return Array.isArray(ww) ? ww[0] : ww || 256
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(renderTime: number): void {
    const now = performance.now()

    this.performanceMetrics.renderTime = renderTime

    // 计算帧率
    if (this.performanceMetrics.lastRenderTimestamp > 0) {
      const timeDiff = now - this.performanceMetrics.lastRenderTimestamp
      this.performanceMetrics.frameRate = 1000 / timeDiff
    }

    this.performanceMetrics.lastRenderTimestamp = now

    // 更新缓存统计
    if (this.renderOptions.enableCaching) {
      const cacheStats = this.cacheManager.getStats()
      this.performanceMetrics.cacheHitRate = cacheStats.hitRate
      this.performanceMetrics.memoryUsage = cacheStats.memoryUsage
    }
  }

  /**
   * 平移操作（增强版）
   */
  pan(deltaX: number, deltaY: number): void {
    // 考虑设备像素比
    const adjustedDeltaX = deltaX / this.renderOptions.devicePixelRatio
    const adjustedDeltaY = deltaY / this.renderOptions.devicePixelRatio

    this.viewport.translateX += adjustedDeltaX
    this.viewport.translateY += adjustedDeltaY
    this.constrainViewport()
    this.queueRender()
  }
  
  /**
   * 重置视口
   */
  resetViewport(): void {
    if (!this.canvas || !this.dicomImage) return

    const canvasWidth = this.canvas.width / this.renderOptions.devicePixelRatio
    const canvasHeight = this.canvas.height / this.renderOptions.devicePixelRatio
    const imageWidth = this.dicomImage.width
    const imageHeight = this.dicomImage.height

    // 计算适合的缩放比例
    const scaleX = canvasWidth / imageWidth
    const scaleY = canvasHeight / imageHeight
    const fitScale = Math.min(scaleX, scaleY) * 0.9 // 留一些边距

    this.viewport = {
      scale: fitScale,
      translateX: canvasWidth / 2,
      translateY: canvasHeight / 2,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      invert: false
    }

    // 选择最佳插值类型
    this.renderOptions.interpolationType = ImageInterpolation.getBestInterpolationType(
      imageWidth,
      imageHeight,
      imageWidth * fitScale,
      imageHeight * fitScale,
      false
    )

    this.queueRender()
  }
  
  /**
   * 适应窗口
   */
  fitToWindow(): void {
    this.resetViewport()
  }

  /**
   * 实际尺寸显示
   */
  actualSize(): void {
    if (!this.canvas) return

    const canvasWidth = this.canvas.width / this.renderOptions.devicePixelRatio
    const canvasHeight = this.canvas.height / this.renderOptions.devicePixelRatio

    this.viewport.scale = 1
    this.viewport.translateX = canvasWidth / 2
    this.viewport.translateY = canvasHeight / 2

    // 1:1显示时使用最近邻插值保持像素精确性
    this.renderOptions.interpolationType = InterpolationType.NEAREST_NEIGHBOR

    this.constrainViewport()
    this.queueRender()
  }

  /**
   * 旋转图像
   */
  rotate(angle: number): void {
    this.viewport.rotation = (this.viewport.rotation + angle) % 360
    this.queueRender()
  }

  /**
   * 翻转图像
   */
  flip(horizontal: boolean): void {
    if (horizontal) {
      this.viewport.flipHorizontal = !this.viewport.flipHorizontal
    } else {
      this.viewport.flipVertical = !this.viewport.flipVertical
    }
    this.queueRender()
  }

  /**
   * 反色显示
   */
  invert(): void {
    this.viewport.invert = !this.viewport.invert
    this.queueRender()
  }

  /**
   * 设置渲染选项
   */
  setRenderOptions(options: Partial<RenderOptions>): void {
    this.renderOptions = { ...this.renderOptions, ...options }

    // 如果启用了GPU加速，重新配置
    if (options.enableGPUAcceleration !== undefined) {
      this.enableGPUAcceleration()
    }

    // 如果设备像素比改变，重新设置Canvas
    if (options.devicePixelRatio !== undefined) {
      this.setupHighDPICanvas()
    }

    this.queueRender()
  }

  /**
   * 获取渲染选项
   */
  getRenderOptions(): RenderOptions {
    return { ...this.renderOptions }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * 设置窗宽窗位
   */
  setWindowLevel(windowCenter: number, windowWidth: number): void {
    if (!this.dicomImage) return

    // 更新DICOM图像的窗宽窗位
    DicomParser.applyEnhancedWindowLevel(this.dicomImage, windowCenter, windowWidth, this.viewport.invert)

    // 清除相关缓存
    if (this.renderOptions.enableCaching) {
      this.cacheManager.removeImage(this.dicomImage.metadata.sopInstanceUID || 'unknown')
    }

    this.queueRender()
  }
  
  /**
   * 获取缓存管理器
   */
  getCacheManager(): ImageCacheManager {
    return this.cacheManager
  }

  /**
   * 预加载图像
   */
  async preloadImages(imageIds: string[], currentIndex: number): Promise<void> {
    if (!this.renderOptions.enableCaching) return

    const renderFunction = async (imageId: string) => {
      // 这里需要实际的图像加载逻辑
      // 暂时返回模拟数据
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512

      const imageData = new ImageData(512, 512)

      return {
        imageData,
        canvas,
        metadata: {
          width: 512,
          height: 512,
          scale: 1,
          windowCenter: 128,
          windowWidth: 256,
          interpolationType: this.renderOptions.interpolationType
        }
      }
    }

    await this.cacheManager.prefetch(imageIds, currentIndex, renderFunction)
  }

  /**
   * 获取像素值
   */
  getPixelValue(x: number, y: number): number | null {
    if (!this.dicomImage) return null

    // 转换屏幕坐标到图像坐标
    const imageCoords = this.screenToImageCoordinates(x, y)
    if (!imageCoords) return null

    return DicomParser.getPixelValue(this.dicomImage, imageCoords.x, imageCoords.y)
  }

  /**
   * 屏幕坐标转图像坐标
   */
  private screenToImageCoordinates(screenX: number, screenY: number): { x: number; y: number } | null {
    if (!this.canvas || !this.dicomImage) return null

    const rect = this.canvas.getBoundingClientRect()
    const canvasX = (screenX - rect.left) / this.renderOptions.devicePixelRatio
    const canvasY = (screenY - rect.top) / this.renderOptions.devicePixelRatio

    // 应用逆变换
    const imageX = (canvasX - this.viewport.translateX) / this.viewport.scale + this.dicomImage.width / 2
    const imageY = (canvasY - this.viewport.translateY) / this.viewport.scale + this.dicomImage.height / 2

    // 检查边界
    if (imageX < 0 || imageX >= this.dicomImage.width || imageY < 0 || imageY >= this.dicomImage.height) {
      return null
    }

    return { x: Math.floor(imageX), y: Math.floor(imageY) }
  }
  
  /**
   * 约束视口范围
   */
  private constrainViewport(): void {
    // 约束缩放范围
    this.viewport.scale = Math.max(this.bounds.minScale, Math.min(this.bounds.maxScale, this.viewport.scale))
    
    // 约束平移范围（可选，根据需求调整）
    // 这里暂时不约束平移范围，允许用户将图像移出视野
  }
  
  /**
   * 更新边界
   */
  private updateBounds(): void {
    if (!this.canvas) return
    
    this.bounds.width = this.canvas.width
    this.bounds.height = this.canvas.height
  }
  
  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.canvas) return
    
    // 鼠标事件
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this))
    
    // 触摸事件
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this))
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))
    
    // 防止右键菜单
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }
  
  /**
   * 鼠标按下事件
   */
  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // 左键
      this.isDragging = true
      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY
      this.canvas!.style.cursor = 'grabbing'
    }
  }
  
  /**
   * 鼠标移动事件
   */
  private handleMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const deltaX = event.clientX - this.lastMouseX
      const deltaY = event.clientY - this.lastMouseY
      
      this.pan(deltaX, deltaY)
      
      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY
    }
  }
  
  /**
   * 鼠标释放事件
   */
  private handleMouseUp(event: MouseEvent): void {
    if (event.button === 0) {
      this.isDragging = false
      this.canvas!.style.cursor = 'grab'
    }
  }
  
  /**
   * 鼠标滚轮事件
   */
  private handleWheel(event: WheelEvent): void {
    event.preventDefault()
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    this.zoom(zoomFactor, event.clientX, event.clientY)
  }
  
  /**
   * 触摸开始事件
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault()
    
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      this.isDragging = true
      this.lastMouseX = touch.clientX
      this.lastMouseY = touch.clientY
    }
  }
  
  /**
   * 触摸移动事件
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault()
    
    if (this.isDragging && event.touches.length === 1) {
      const touch = event.touches[0]
      const deltaX = touch.clientX - this.lastMouseX
      const deltaY = touch.clientY - this.lastMouseY
      
      this.pan(deltaX, deltaY)
      
      this.lastMouseX = touch.clientX
      this.lastMouseY = touch.clientY
    }
  }
  
  /**
   * 触摸结束事件
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault()
    this.isDragging = false
  }
  
  /**
   * 销毁查看器
   */
  destroy(): void {
    // 取消待处理的动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    // 清空渲染队列
    this.renderQueue = []

    // 清空缓存
    this.cacheManager.clear()

    if (this.canvas) {
      // 移除事件监听器
      this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
      this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
      this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
      this.canvas.removeEventListener('wheel', this.handleWheel.bind(this))
      this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this))
      this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this))
      this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    }

    this.canvas = null
    this.ctx = null
    this.dicomImage = null
    this.isRendering = false

    console.log('ImageViewerService 已销毁')
  }
}
