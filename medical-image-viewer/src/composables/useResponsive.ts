import { ref, computed, onMounted, onUnmounted } from 'vue'

// 响应式断点定义
export const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920
} as const

export type Breakpoint = keyof typeof breakpoints

// 响应式组合函数
export function useResponsive() {
  const windowWidth = ref(0)
  const windowHeight = ref(0)

  // 更新窗口尺寸
  const updateSize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  // 计算当前断点
  const currentBreakpoint = computed<Breakpoint>(() => {
    const width = windowWidth.value
    if (width >= breakpoints['3xl']) return '3xl'
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  })

  // 响应式状态
  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  const isTablet = computed(() => 
    windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg
  )
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)
  const isLargeScreen = computed(() => windowWidth.value >= breakpoints.xl)

  // 设备方向
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)
  const isPortrait = computed(() => windowWidth.value <= windowHeight.value)

  // 断点匹配函数
  const matches = (breakpoint: Breakpoint) => {
    return computed(() => windowWidth.value >= breakpoints[breakpoint])
  }

  // 范围匹配函数
  const between = (min: Breakpoint, max: Breakpoint) => {
    return computed(() => 
      windowWidth.value >= breakpoints[min] && windowWidth.value < breakpoints[max]
    )
  }

  // 获取响应式值
  const getResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>, fallback: T): T => {
    const bp = currentBreakpoint.value
    
    // 按优先级查找值
    const priorities: Breakpoint[] = ['3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs']
    const currentIndex = priorities.indexOf(bp)
    
    // 从当前断点开始向下查找
    for (let i = currentIndex; i < priorities.length; i++) {
      const key = priorities[i]
      if (values[key] !== undefined) {
        return values[key] as T
      }
    }
    
    return fallback
  }

  // 生命周期
  onMounted(() => {
    updateSize()
    window.addEventListener('resize', updateSize, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize)
  })

  return {
    // 尺寸
    windowWidth: readonly(windowWidth),
    windowHeight: readonly(windowHeight),
    
    // 断点
    currentBreakpoint,
    
    // 设备类型
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    
    // 方向
    isLandscape,
    isPortrait,
    
    // 工具函数
    matches,
    between,
    getResponsiveValue
  }
}

// 响应式样式组合函数
export function useResponsiveStyles() {
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsive()

  // 获取响应式类名
  const getResponsiveClass = (classes: Partial<Record<Breakpoint, string>>) => {
    return computed(() => {
      const bp = currentBreakpoint.value
      return classes[bp] || classes.xs || ''
    })
  }

  // 获取响应式样式
  const getResponsiveStyle = (styles: Partial<Record<Breakpoint, any>>) => {
    return computed(() => {
      const bp = currentBreakpoint.value
      return styles[bp] || styles.xs || {}
    })
  }

  // 预定义的响应式类
  const responsiveClasses = computed(() => ({
    'is-mobile': isMobile.value,
    'is-tablet': isTablet.value,
    'is-desktop': isDesktop.value,
    [`is-${currentBreakpoint.value}`]: true
  }))

  return {
    currentBreakpoint,
    getResponsiveClass,
    getResponsiveStyle,
    responsiveClasses
  }
}

// 响应式组件大小组合函数
export function useResponsiveSize() {
  const { getResponsiveValue, isMobile } = useResponsive()

  // 按钮大小
  const buttonSize = computed(() => 
    getResponsiveValue({
      xs: 'small',
      sm: 'small',
      md: 'default',
      lg: 'default'
    }, 'default')
  )

  // 输入框大小
  const inputSize = computed(() => 
    getResponsiveValue({
      xs: 'small',
      sm: 'small', 
      md: 'default',
      lg: 'default'
    }, 'default')
  )

  // 表格大小
  const tableSize = computed(() =>
    getResponsiveValue({
      xs: 'small',
      sm: 'small',
      md: 'default',
      lg: 'default'
    }, 'default')
  )

  // 间距大小
  const spacing = computed(() => ({
    xs: isMobile.value ? '8px' : '12px',
    sm: isMobile.value ? '12px' : '16px',
    md: isMobile.value ? '16px' : '24px',
    lg: isMobile.value ? '24px' : '32px',
    xl: isMobile.value ? '32px' : '48px'
  }))

  // 字体大小
  const fontSize = computed(() => ({
    xs: isMobile.value ? '12px' : '12px',
    sm: isMobile.value ? '14px' : '14px',
    base: isMobile.value ? '14px' : '16px',
    lg: isMobile.value ? '16px' : '18px',
    xl: isMobile.value ? '18px' : '20px',
    '2xl': isMobile.value ? '20px' : '24px'
  }))

  return {
    buttonSize,
    inputSize,
    tableSize,
    spacing,
    fontSize
  }
}

// 触摸设备检测
export function useTouchDevice() {
  const isTouchDevice = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  const hasHover = computed(() => {
    return window.matchMedia('(hover: hover)').matches
  })

  const hasFinePointer = computed(() => {
    return window.matchMedia('(pointer: fine)').matches
  })

  return {
    isTouchDevice,
    hasHover,
    hasFinePointer
  }
}

// 设备性能检测
export function useDevicePerformance() {
  const deviceMemory = ref(0)
  const hardwareConcurrency = ref(0)
  const connectionType = ref('unknown')

  onMounted(() => {
    // 设备内存
    if ('deviceMemory' in navigator) {
      deviceMemory.value = (navigator as any).deviceMemory
    }

    // CPU核心数
    hardwareConcurrency.value = navigator.hardwareConcurrency || 0

    // 网络连接类型
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connectionType.value = connection.effectiveType || 'unknown'
    }
  })

  // 性能等级评估
  const performanceLevel = computed(() => {
    const memory = deviceMemory.value
    const cores = hardwareConcurrency.value

    if (memory >= 8 && cores >= 8) return 'high'
    if (memory >= 4 && cores >= 4) return 'medium'
    return 'low'
  })

  // 是否为低性能设备
  const isLowPerformance = computed(() => performanceLevel.value === 'low')

  return {
    deviceMemory: readonly(deviceMemory),
    hardwareConcurrency: readonly(hardwareConcurrency),
    connectionType: readonly(connectionType),
    performanceLevel,
    isLowPerformance
  }
}
