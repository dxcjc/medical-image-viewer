import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { designTokens } from '@/design-system/tokens'

// UI状态接口定义
interface UIState {
  // 布局状态
  sidebarCollapsed: boolean
  rightPanelVisible: boolean
  toolbarVisible: boolean
  statusBarVisible: boolean
  
  // 主题状态
  theme: 'light' | 'dark' | 'medical'
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large'
  
  // 响应式状态
  isMobile: boolean
  isTablet: boolean
  screenWidth: number
  screenHeight: number
  
  // 性能状态
  performanceMode: 'high' | 'balanced' | 'low'
  enableAnimations: boolean
  enableTransitions: boolean
  
  // 无障碍状态
  screenReaderActive: boolean
  keyboardNavigation: boolean
  focusVisible: boolean
  
  // 加载状态
  globalLoading: boolean
  loadingMessage: string
  loadingProgress: number
}

// 通知接口
interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
    primary?: boolean
  }>
}

// 模态框接口
interface Modal {
  id: string
  component: string
  props?: Record<string, any>
  persistent?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export const useUIStore = defineStore('ui', () => {
  // 基础状态
  const state = ref<UIState>({
    // 布局状态
    sidebarCollapsed: false,
    rightPanelVisible: false,
    toolbarVisible: true,
    statusBarVisible: true,
    
    // 主题状态
    theme: 'light',
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
    
    // 响应式状态
    isMobile: false,
    isTablet: false,
    screenWidth: 0,
    screenHeight: 0,
    
    // 性能状态
    performanceMode: 'balanced',
    enableAnimations: true,
    enableTransitions: true,
    
    // 无障碍状态
    screenReaderActive: false,
    keyboardNavigation: false,
    focusVisible: false,
    
    // 加载状态
    globalLoading: false,
    loadingMessage: '',
    loadingProgress: 0
  })

  // 通知系统
  const notifications = ref<Notification[]>([])
  const modals = ref<Modal[]>([])

  // 计算属性
  const currentBreakpoint = computed(() => {
    const width = state.value.screenWidth
    if (width >= parseInt(designTokens.breakpoints['2xl'])) return '2xl'
    if (width >= parseInt(designTokens.breakpoints.xl)) return 'xl'
    if (width >= parseInt(designTokens.breakpoints.lg)) return 'lg'
    if (width >= parseInt(designTokens.breakpoints.md)) return 'md'
    if (width >= parseInt(designTokens.breakpoints.sm)) return 'sm'
    return 'xs'
  })

  const isDesktop = computed(() => !state.value.isMobile && !state.value.isTablet)
  
  const shouldReduceMotion = computed(() => 
    state.value.reducedMotion || state.value.performanceMode === 'low'
  )

  const effectiveTheme = computed(() => {
    if (state.value.highContrast) return 'high-contrast'
    return state.value.theme
  })

  // 布局操作
  const toggleSidebar = () => {
    state.value.sidebarCollapsed = !state.value.sidebarCollapsed
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    state.value.sidebarCollapsed = collapsed
  }

  const toggleRightPanel = () => {
    state.value.rightPanelVisible = !state.value.rightPanelVisible
  }

  const setRightPanelVisible = (visible: boolean) => {
    state.value.rightPanelVisible = visible
  }

  // 主题操作
  const setTheme = (theme: UIState['theme']) => {
    state.value.theme = theme
    document.documentElement.setAttribute('data-theme', theme)
    
    // 保存到本地存储
    localStorage.setItem('medical-viewer-theme', theme)
  }

  const toggleHighContrast = () => {
    state.value.highContrast = !state.value.highContrast
    document.documentElement.classList.toggle('high-contrast', state.value.highContrast)
    
    localStorage.setItem('medical-viewer-high-contrast', String(state.value.highContrast))
  }

  const setFontSize = (size: UIState['fontSize']) => {
    state.value.fontSize = size
    document.documentElement.setAttribute('data-font-size', size)
    
    localStorage.setItem('medical-viewer-font-size', size)
  }

  // 响应式操作
  const updateScreenSize = (width: number, height: number) => {
    state.value.screenWidth = width
    state.value.screenHeight = height
    state.value.isMobile = width < parseInt(designTokens.breakpoints.md)
    state.value.isTablet = width >= parseInt(designTokens.breakpoints.md) && 
                          width < parseInt(designTokens.breakpoints.lg)
  }

  // 性能操作
  const setPerformanceMode = (mode: UIState['performanceMode']) => {
    state.value.performanceMode = mode
    
    // 根据性能模式调整动画设置
    switch (mode) {
      case 'low':
        state.value.enableAnimations = false
        state.value.enableTransitions = false
        break
      case 'balanced':
        state.value.enableAnimations = true
        state.value.enableTransitions = true
        break
      case 'high':
        state.value.enableAnimations = true
        state.value.enableTransitions = true
        break
    }
    
    document.documentElement.setAttribute('data-performance-mode', mode)
    localStorage.setItem('medical-viewer-performance-mode', mode)
  }

  // 无障碍操作
  const setScreenReaderActive = (active: boolean) => {
    state.value.screenReaderActive = active
    document.documentElement.classList.toggle('screen-reader-active', active)
  }

  const setKeyboardNavigation = (enabled: boolean) => {
    state.value.keyboardNavigation = enabled
    document.documentElement.classList.toggle('keyboard-navigation', enabled)
  }

  // 加载状态操作
  const setGlobalLoading = (loading: boolean, message = '', progress = 0) => {
    state.value.globalLoading = loading
    state.value.loadingMessage = message
    state.value.loadingProgress = progress
  }

  // 通知系统
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      id,
      duration: 5000,
      persistent: false,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // 自动移除非持久化通知
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  // 模态框系统
  const openModal = (modal: Omit<Modal, 'id'>) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newModal: Modal = {
      id,
      size: 'md',
      persistent: false,
      ...modal
    }
    
    modals.value.push(newModal)
    return id
  }

  const closeModal = (id: string) => {
    const index = modals.value.findIndex(m => m.id === id)
    if (index > -1) {
      modals.value.splice(index, 1)
    }
  }

  const closeAllModals = () => {
    modals.value = []
  }

  // 初始化
  const initialize = () => {
    // 从本地存储恢复设置
    const savedTheme = localStorage.getItem('medical-viewer-theme') as UIState['theme']
    if (savedTheme) {
      setTheme(savedTheme)
    }
    
    const savedHighContrast = localStorage.getItem('medical-viewer-high-contrast')
    if (savedHighContrast === 'true') {
      toggleHighContrast()
    }
    
    const savedFontSize = localStorage.getItem('medical-viewer-font-size') as UIState['fontSize']
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }
    
    const savedPerformanceMode = localStorage.getItem('medical-viewer-performance-mode') as UIState['performanceMode']
    if (savedPerformanceMode) {
      setPerformanceMode(savedPerformanceMode)
    }
    
    // 检测系统偏好
    if (window.matchMedia) {
      // 检测深色模式偏好
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      if (darkModeQuery.matches && !savedTheme) {
        setTheme('dark')
      }
      
      // 检测高对比度偏好
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
      if (highContrastQuery.matches && !savedHighContrast) {
        toggleHighContrast()
      }
      
      // 检测减少动画偏好
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      state.value.reducedMotion = reducedMotionQuery.matches
      
      // 监听偏好变化
      darkModeQuery.addEventListener('change', (e) => {
        if (!savedTheme) {
          setTheme(e.matches ? 'dark' : 'light')
        }
      })
      
      reducedMotionQuery.addEventListener('change', (e) => {
        state.value.reducedMotion = e.matches
      })
    }
    
    // 初始化屏幕尺寸
    updateScreenSize(window.innerWidth, window.innerHeight)
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      updateScreenSize(window.innerWidth, window.innerHeight)
    })
  }

  // 监听状态变化
  watch(() => state.value.theme, (newTheme) => {
    document.body.className = document.body.className.replace(/theme-\w+/g, '')
    document.body.classList.add(`theme-${newTheme}`)
  })

  return {
    // 状态
    state: readonly(state),
    notifications: readonly(notifications),
    modals: readonly(modals),
    
    // 计算属性
    currentBreakpoint,
    isDesktop,
    shouldReduceMotion,
    effectiveTheme,
    
    // 布局操作
    toggleSidebar,
    setSidebarCollapsed,
    toggleRightPanel,
    setRightPanelVisible,
    
    // 主题操作
    setTheme,
    toggleHighContrast,
    setFontSize,
    
    // 响应式操作
    updateScreenSize,
    
    // 性能操作
    setPerformanceMode,
    
    // 无障碍操作
    setScreenReaderActive,
    setKeyboardNavigation,
    
    // 加载状态操作
    setGlobalLoading,
    
    // 通知系统
    addNotification,
    removeNotification,
    clearNotifications,
    
    // 模态框系统
    openModal,
    closeModal,
    closeAllModals,
    
    // 初始化
    initialize
  }
})
