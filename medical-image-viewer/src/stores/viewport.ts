import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 视口配置接口
export interface Viewport {
  id: string
  element?: HTMLElement
  scale: number
  translation: { x: number; y: number }
  rotation: number
  windowLevel: { center: number; width: number }
  invert: boolean
  flipHorizontal: boolean
  flipVertical: boolean
  interpolation: 'nearest' | 'linear'
  colormap?: string
}

// 视口布局接口
export interface ViewportLayout {
  rows: number
  columns: number
  activeViewport: number
}

// 同步配置接口
export interface SynchronizationConfig {
  enabled: boolean
  type: 'none' | 'scroll' | 'zoom' | 'windowLevel' | 'all'
  viewports: string[]
}

export const useViewportStore = defineStore('viewport', () => {
  // 状态
  const viewports = ref(new Map<string, Viewport>())
  const activeViewport = ref<string | null>(null)
  const layout = ref<ViewportLayout>({ rows: 1, columns: 1, activeViewport: 0 })
  const synchronization = ref<SynchronizationConfig>({
    enabled: false,
    type: 'none',
    viewports: []
  })

  // 默认视口配置
  const defaultViewportConfig: Omit<Viewport, 'id'> = {
    scale: 1.0,
    translation: { x: 0, y: 0 },
    rotation: 0,
    windowLevel: { center: 128, width: 256 },
    invert: false,
    flipHorizontal: false,
    flipVertical: false,
    interpolation: 'linear'
  }

  // 计算属性
  const viewportList = computed(() => Array.from(viewports.value.values()))

  const activeViewportData = computed(() => {
    return activeViewport.value ? viewports.value.get(activeViewport.value) : null
  })

  const viewportCount = computed(() => layout.value.rows * layout.value.columns)

  const isSynchronized = computed(() => synchronization.value.enabled)

  // 操作方法
  const createViewport = (id: string, element?: HTMLElement): Viewport => {
    const viewport: Viewport = {
      id,
      element,
      ...defaultViewportConfig
    }

    viewports.value.set(id, viewport)

    // 如果是第一个视口，设为活动视口
    if (!activeViewport.value) {
      activeViewport.value = id
    }

    return viewport
  }

  const removeViewport = (id: string) => {
    viewports.value.delete(id)

    // 如果删除的是活动视口，选择下一个
    if (activeViewport.value === id) {
      const remaining = Array.from(viewports.value.keys())
      activeViewport.value = remaining.length > 0 ? remaining[0] : null
    }
  }

  const setActiveViewport = (id: string) => {
    if (viewports.value.has(id)) {
      activeViewport.value = id
    }
  }

  const updateViewport = (id: string, updates: Partial<Viewport>) => {
    const viewport = viewports.value.get(id)
    if (viewport) {
      Object.assign(viewport, updates)

      // 如果启用了同步，同步到其他视口
      if (synchronization.value.enabled && synchronization.value.viewports.includes(id)) {
        syncViewports(id, updates)
      }
    }
  }

  const updateScale = (id: string, scale: number, centerX?: number, centerY?: number) => {
    const viewport = viewports.value.get(id)
    if (!viewport) return

    // 如果提供了中心点，计算新的平移以保持中心点不变
    if (centerX !== undefined && centerY !== undefined && viewport.element) {
      const rect = viewport.element.getBoundingClientRect()
      const oldScale = viewport.scale

      // 计算相对于视口中心的偏移
      const offsetX = centerX - rect.width / 2
      const offsetY = centerY - rect.height / 2

      // 计算新的平移
      const scaleDiff = scale - oldScale
      const newTranslationX = viewport.translation.x - offsetX * scaleDiff
      const newTranslationY = viewport.translation.y - offsetY * scaleDiff

      updateViewport(id, {
        scale,
        translation: { x: newTranslationX, y: newTranslationY }
      })
    } else {
      updateViewport(id, { scale })
    }
  }

  const updateTranslation = (id: string, deltaX: number, deltaY: number) => {
    const viewport = viewports.value.get(id)
    if (viewport) {
      const newTranslation = {
        x: viewport.translation.x + deltaX,
        y: viewport.translation.y + deltaY
      }
      updateViewport(id, { translation: newTranslation })
    }
  }

  const updateRotation = (id: string, rotation: number) => {
    updateViewport(id, { rotation: rotation % 360 })
  }

  const updateWindowLevel = (id: string, center: number, width: number) => {
    updateViewport(id, {
      windowLevel: { center, width: Math.max(1, width) }
    })
  }

  const toggleInvert = (id: string) => {
    const viewport = viewports.value.get(id)
    if (viewport) {
      updateViewport(id, { invert: !viewport.invert })
    }
  }

  const toggleFlipHorizontal = (id: string) => {
    const viewport = viewports.value.get(id)
    if (viewport) {
      updateViewport(id, { flipHorizontal: !viewport.flipHorizontal })
    }
  }

  const toggleFlipVertical = (id: string) => {
    const viewport = viewports.value.get(id)
    if (viewport) {
      updateViewport(id, { flipVertical: !viewport.flipVertical })
    }
  }

  const resetViewport = (id: string) => {
    updateViewport(id, {
      scale: 1.0,
      translation: { x: 0, y: 0 },
      rotation: 0,
      invert: false,
      flipHorizontal: false,
      flipVertical: false
    })
  }

  const fitToWindow = (id: string, imageWidth: number, imageHeight: number) => {
    const viewport = viewports.value.get(id)
    if (!viewport?.element) return

    const rect = viewport.element.getBoundingClientRect()
    const containerWidth = rect.width
    const containerHeight = rect.height

    // 计算适应窗口的缩放比例
    const scaleX = containerWidth / imageWidth
    const scaleY = containerHeight / imageHeight
    const scale = Math.min(scaleX, scaleY) * 0.9 // 留一些边距

    updateViewport(id, {
      scale,
      translation: { x: 0, y: 0 },
      rotation: 0
    })
  }

  const setLayout = (rows: number, columns: number) => {
    layout.value = { rows, columns, activeViewport: 0 }

    // 清理多余的视口
    const maxViewports = rows * columns
    const currentViewports = Array.from(viewports.value.keys())

    if (currentViewports.length > maxViewports) {
      currentViewports.slice(maxViewports).forEach(id => {
        removeViewport(id)
      })
    }
  }

  const setSynchronization = (config: Partial<SynchronizationConfig>) => {
    Object.assign(synchronization.value, config)
  }

  const syncViewports = (sourceId: string, updates: Partial<Viewport>) => {
    if (!synchronization.value.enabled) return

    const syncType = synchronization.value.type
    const targetViewports = synchronization.value.viewports.filter(id => id !== sourceId)

    targetViewports.forEach(targetId => {
      const viewport = viewports.value.get(targetId)
      if (!viewport) return

      const syncUpdates: Partial<Viewport> = {}

      switch (syncType) {
        case 'scroll':
          if (updates.translation) {
            syncUpdates.translation = updates.translation
          }
          break
        case 'zoom':
          if (updates.scale !== undefined) {
            syncUpdates.scale = updates.scale
          }
          break
        case 'windowLevel':
          if (updates.windowLevel) {
            syncUpdates.windowLevel = updates.windowLevel
          }
          break
        case 'all':
          Object.assign(syncUpdates, updates)
          break
      }

      if (Object.keys(syncUpdates).length > 0) {
        Object.assign(viewport, syncUpdates)
      }
    })
  }

  const addToSynchronization = (viewportId: string) => {
    if (!synchronization.value.viewports.includes(viewportId)) {
      synchronization.value.viewports.push(viewportId)
    }
  }

  const removeFromSynchronization = (viewportId: string) => {
    const index = synchronization.value.viewports.indexOf(viewportId)
    if (index > -1) {
      synchronization.value.viewports.splice(index, 1)
    }
  }

  const clearAllViewports = () => {
    viewports.value.clear()
    activeViewport.value = null
    synchronization.value.viewports = []
  }

  return {
    // 状态
    viewports,
    activeViewport,
    layout,
    synchronization,

    // 计算属性
    viewportList,
    activeViewportData,
    viewportCount,
    isSynchronized,

    // 方法
    createViewport,
    removeViewport,
    setActiveViewport,
    updateViewport,
    updateScale,
    updateTranslation,
    updateRotation,
    updateWindowLevel,
    toggleInvert,
    toggleFlipHorizontal,
    toggleFlipVertical,
    resetViewport,
    fitToWindow,
    setLayout,
    setSynchronization,
    syncViewports,
    addToSynchronization,
    removeFromSynchronization,
    clearAllViewports
  }
})
