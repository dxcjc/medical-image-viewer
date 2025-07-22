import { DicomImage } from '../dicom/DicomParser'

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
  
  private isDragging = false
  private lastMouseX = 0
  private lastMouseY = 0
  
  /**
   * 初始化查看器
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    if (!this.ctx) {
      throw new Error('无法获取Canvas 2D上下文')
    }
    
    this.setupEventListeners()
    this.updateBounds()
  }
  
  /**
   * 设置DICOM图像
   */
  setDicomImage(dicomImage: DicomImage): void {
    this.dicomImage = dicomImage
    this.resetViewport()
    this.render()
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
    this.render()
  }
  
  /**
   * 缩放操作
   */
  zoom(factor: number, centerX?: number, centerY?: number): void {
    if (!this.canvas) return
    
    const newScale = this.viewport.scale * factor
    const constrainedScale = Math.max(this.bounds.minScale, Math.min(this.bounds.maxScale, newScale))
    
    if (centerX !== undefined && centerY !== undefined) {
      // 以指定点为中心缩放
      const rect = this.canvas.getBoundingClientRect()
      const canvasX = centerX - rect.left
      const canvasY = centerY - rect.top
      
      const scaleFactor = constrainedScale / this.viewport.scale
      
      this.viewport.translateX = canvasX - (canvasX - this.viewport.translateX) * scaleFactor
      this.viewport.translateY = canvasY - (canvasY - this.viewport.translateY) * scaleFactor
    }
    
    this.viewport.scale = constrainedScale
    this.constrainViewport()
    this.render()
  }
  
  /**
   * 平移操作
   */
  pan(deltaX: number, deltaY: number): void {
    this.viewport.translateX += deltaX
    this.viewport.translateY += deltaY
    this.constrainViewport()
    this.render()
  }
  
  /**
   * 重置视口
   */
  resetViewport(): void {
    if (!this.canvas || !this.dicomImage) return
    
    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height
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
    
    this.render()
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
    
    this.viewport.scale = 1
    this.viewport.translateX = this.canvas.width / 2
    this.viewport.translateY = this.canvas.height / 2
    this.constrainViewport()
    this.render()
  }
  
  /**
   * 旋转图像
   */
  rotate(angle: number): void {
    this.viewport.rotation = (this.viewport.rotation + angle) % 360
    this.render()
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
    this.render()
  }
  
  /**
   * 反色显示
   */
  invert(): void {
    this.viewport.invert = !this.viewport.invert
    this.render()
  }
  
  /**
   * 渲染图像
   */
  private render(): void {
    if (!this.ctx || !this.canvas || !this.dicomImage?.canvas) return
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 保存当前状态
    this.ctx.save()
    
    // 应用变换
    this.ctx.translate(this.viewport.translateX, this.viewport.translateY)
    this.ctx.scale(this.viewport.scale, this.viewport.scale)
    this.ctx.rotate((this.viewport.rotation * Math.PI) / 180)
    
    if (this.viewport.flipHorizontal) {
      this.ctx.scale(-1, 1)
    }
    
    if (this.viewport.flipVertical) {
      this.ctx.scale(1, -1)
    }
    
    // 应用反色滤镜
    if (this.viewport.invert) {
      this.ctx.filter = 'invert(1)'
    }
    
    // 绘制图像
    const imageWidth = this.dicomImage.width
    const imageHeight = this.dicomImage.height
    
    this.ctx.drawImage(
      this.dicomImage.canvas,
      -imageWidth / 2,
      -imageHeight / 2,
      imageWidth,
      imageHeight
    )
    
    // 恢复状态
    this.ctx.restore()
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
  }
}
