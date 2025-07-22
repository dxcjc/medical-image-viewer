import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ImageViewerService } from '@/services/viewer/ImageViewerService'

describe('ImageViewerService', () => {
  let viewerService: ImageViewerService
  let mockCanvas: HTMLCanvasElement
  let mockDicomImage: any

  beforeEach(() => {
    viewerService = new ImageViewerService()
    
    // 创建模拟Canvas
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600
    
    // 创建模拟DICOM图像
    mockDicomImage = {
      metadata: {
        columns: 512,
        rows: 512,
        windowCenter: 128,
        windowWidth: 256
      },
      pixelData: new Uint8Array(512 * 512),
      width: 512,
      height: 512,
      canvas: document.createElement('canvas')
    }
    
    mockDicomImage.canvas.width = 512
    mockDicomImage.canvas.height = 512
  })

  afterEach(() => {
    viewerService.destroy()
  })

  describe('初始化', () => {
    it('应该能够初始化查看器', () => {
      expect(() => {
        viewerService.initialize(mockCanvas)
      }).not.toThrow()
    })

    it('应该在没有Canvas时抛出错误', () => {
      const invalidCanvas = document.createElement('div') as any
      
      expect(() => {
        viewerService.initialize(invalidCanvas)
      }).toThrow('无法获取Canvas 2D上下文')
    })
  })

  describe('视口操作', () => {
    beforeEach(() => {
      viewerService.initialize(mockCanvas)
    })

    it('应该能够设置DICOM图像', () => {
      expect(() => {
        viewerService.setDicomImage(mockDicomImage)
      }).not.toThrow()
    })

    it('应该能够获取视口状态', () => {
      const state = viewerService.getViewportState()
      
      expect(state).toHaveProperty('scale')
      expect(state).toHaveProperty('translateX')
      expect(state).toHaveProperty('translateY')
      expect(state).toHaveProperty('rotation')
      expect(state).toHaveProperty('flipHorizontal')
      expect(state).toHaveProperty('flipVertical')
      expect(state).toHaveProperty('invert')
    })

    it('应该能够设置视口状态', () => {
      const newState = {
        scale: 2.0,
        translateX: 100,
        translateY: 50
      }

      viewerService.setViewportState(newState)
      const currentState = viewerService.getViewportState()

      expect(currentState.scale).toBe(2.0)
      expect(currentState.translateX).toBe(100)
      expect(currentState.translateY).toBe(50)
    })
  })

  describe('缩放操作', () => {
    beforeEach(() => {
      viewerService.initialize(mockCanvas)
      viewerService.setDicomImage(mockDicomImage)
    })

    it('应该能够进行缩放', () => {
      const initialState = viewerService.getViewportState()
      const initialScale = initialState.scale

      viewerService.zoom(2.0)
      
      const newState = viewerService.getViewportState()
      expect(newState.scale).toBeGreaterThan(initialScale)
    })

    it('应该限制最小缩放比例', () => {
      viewerService.zoom(0.01) // 尝试缩放到很小
      
      const state = viewerService.getViewportState()
      expect(state.scale).toBeGreaterThanOrEqual(0.1) // 最小缩放比例
    })

    it('应该限制最大缩放比例', () => {
      viewerService.zoom(100) // 尝试缩放到很大
      
      const state = viewerService.getViewportState()
      expect(state.scale).toBeLessThanOrEqual(10) // 最大缩放比例
    })

    it('应该能够以指定点为中心缩放', () => {
      const centerX = 400
      const centerY = 300

      expect(() => {
        viewerService.zoom(2.0, centerX, centerY)
      }).not.toThrow()
    })
  })

  describe('平移操作', () => {
    beforeEach(() => {
      viewerService.initialize(mockCanvas)
      viewerService.setDicomImage(mockDicomImage)
    })

    it('应该能够进行平移', () => {
      const initialState = viewerService.getViewportState()
      const deltaX = 50
      const deltaY = 30

      viewerService.pan(deltaX, deltaY)
      
      const newState = viewerService.getViewportState()
      expect(newState.translateX).toBe(initialState.translateX + deltaX)
      expect(newState.translateY).toBe(initialState.translateY + deltaY)
    })
  })

  describe('视图重置', () => {
    beforeEach(() => {
      viewerService.initialize(mockCanvas)
      viewerService.setDicomImage(mockDicomImage)
    })

    it('应该能够重置视口', () => {
      // 先进行一些变换
      viewerService.zoom(2.0)
      viewerService.pan(100, 100)
      viewerService.rotate(90)

      // 重置视口
      viewerService.resetViewport()
      
      const state = viewerService.getViewportState()
      expect(state.rotation).toBe(0)
      // 缩放和平移会根据适应窗口的逻辑设置，不一定是初始值
    })

    it('应该能够适应窗口', () => {
      viewerService.zoom(5.0) // 先放大
      
      viewerService.fitToWindow()
      
      // 应该调整到合适的大小
      const state = viewerService.getViewportState()
      expect(state.scale).toBeLessThan(5.0)
    })

    it('应该能够显示实际尺寸', () => {
      viewerService.actualSize()
      
      const state = viewerService.getViewportState()
      expect(state.scale).toBe(1)
    })
  })

  describe('图像变换', () => {
    beforeEach(() => {
      viewerService.initialize(mockCanvas)
      viewerService.setDicomImage(mockDicomImage)
    })

    it('应该能够旋转图像', () => {
      viewerService.rotate(90)
      
      const state = viewerService.getViewportState()
      expect(state.rotation).toBe(90)
    })

    it('应该能够处理旋转角度的循环', () => {
      viewerService.rotate(270)
      viewerService.rotate(180)
      
      const state = viewerService.getViewportState()
      expect(state.rotation).toBe(90) // (270 + 180) % 360 = 90
    })

    it('应该能够水平翻转图像', () => {
      const initialState = viewerService.getViewportState()
      
      viewerService.flip(true) // 水平翻转
      
      const newState = viewerService.getViewportState()
      expect(newState.flipHorizontal).toBe(!initialState.flipHorizontal)
    })

    it('应该能够垂直翻转图像', () => {
      const initialState = viewerService.getViewportState()
      
      viewerService.flip(false) // 垂直翻转
      
      const newState = viewerService.getViewportState()
      expect(newState.flipVertical).toBe(!initialState.flipVertical)
    })

    it('应该能够反色显示', () => {
      const initialState = viewerService.getViewportState()
      
      viewerService.invert()
      
      const newState = viewerService.getViewportState()
      expect(newState.invert).toBe(!initialState.invert)
    })
  })

  describe('事件处理', () => {
    beforeEach(() => {
      viewerService.initialize(mockCanvas)
      viewerService.setDicomImage(mockDicomImage)
    })

    it('应该能够处理鼠标事件', () => {
      // 模拟鼠标按下事件
      const mouseDownEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      })

      expect(() => {
        mockCanvas.dispatchEvent(mouseDownEvent)
      }).not.toThrow()
    })

    it('应该能够处理滚轮事件', () => {
      // 模拟滚轮事件
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        clientX: 400,
        clientY: 300
      })

      expect(() => {
        mockCanvas.dispatchEvent(wheelEvent)
      }).not.toThrow()
    })

    it('应该能够处理触摸事件', () => {
      // 模拟触摸开始事件
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({
            identifier: 0,
            target: mockCanvas,
            clientX: 100,
            clientY: 100
          })
        ]
      })

      expect(() => {
        mockCanvas.dispatchEvent(touchStartEvent)
      }).not.toThrow()
    })
  })

  describe('资源清理', () => {
    it('应该能够正确销毁查看器', () => {
      viewerService.initialize(mockCanvas)
      
      expect(() => {
        viewerService.destroy()
      }).not.toThrow()
    })
  })
})
