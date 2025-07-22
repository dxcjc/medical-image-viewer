import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// 无障碍访问组合函数
export function useAccessibility() {
  const isScreenReaderActive = ref(false)
  const isHighContrast = ref(false)
  const isReducedMotion = ref(false)
  const fontSize = ref('medium')

  // 检测屏幕阅读器
  const detectScreenReader = () => {
    // 创建隐藏元素来检测屏幕阅读器
    const testElement = document.createElement('div')
    testElement.setAttribute('aria-hidden', 'true')
    testElement.style.position = 'absolute'
    testElement.style.left = '-9999px'
    testElement.textContent = 'Screen reader test'
    
    document.body.appendChild(testElement)
    
    // 检测是否被屏幕阅读器读取
    setTimeout(() => {
      const isRead = testElement.offsetHeight > 0 || testElement.offsetWidth > 0
      isScreenReaderActive.value = isRead
      document.body.removeChild(testElement)
    }, 100)
  }

  // 检测高对比度模式
  const detectHighContrast = () => {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)')
      isHighContrast.value = mediaQuery.matches
      
      mediaQuery.addEventListener('change', (e) => {
        isHighContrast.value = e.matches
      })
    }
  }

  // 检测减少动画偏好
  const detectReducedMotion = () => {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      isReducedMotion.value = mediaQuery.matches
      
      mediaQuery.addEventListener('change', (e) => {
        isReducedMotion.value = e.matches
      })
    }
  }

  // 检测字体大小偏好
  const detectFontSize = () => {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
    if (rootFontSize >= 20) fontSize.value = 'large'
    else if (rootFontSize >= 16) fontSize.value = 'medium'
    else fontSize.value = 'small'
  }

  onMounted(() => {
    detectScreenReader()
    detectHighContrast()
    detectReducedMotion()
    detectFontSize()
  })

  return {
    isScreenReaderActive: readonly(isScreenReaderActive),
    isHighContrast: readonly(isHighContrast),
    isReducedMotion: readonly(isReducedMotion),
    fontSize: readonly(fontSize)
  }
}

// 焦点管理
export function useFocusManagement() {
  const focusedElement = ref<HTMLElement | null>(null)
  const focusHistory = ref<HTMLElement[]>([])

  // 设置焦点
  const setFocus = (element: HTMLElement | string) => {
    nextTick(() => {
      const targetElement = typeof element === 'string' 
        ? document.querySelector(element) as HTMLElement
        : element

      if (targetElement && targetElement.focus) {
        // 保存当前焦点到历史
        if (document.activeElement && document.activeElement !== targetElement) {
          focusHistory.value.push(document.activeElement as HTMLElement)
        }
        
        targetElement.focus()
        focusedElement.value = targetElement
      }
    })
  }

  // 返回上一个焦点
  const restoreFocus = () => {
    const previousElement = focusHistory.value.pop()
    if (previousElement && previousElement.focus) {
      previousElement.focus()
      focusedElement.value = previousElement
    }
  }

  // 焦点陷阱（用于模态框等）
  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    
    // 设置初始焦点
    if (firstElement) {
      firstElement.focus()
    }

    // 返回清理函数
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  return {
    focusedElement: readonly(focusedElement),
    setFocus,
    restoreFocus,
    trapFocus
  }
}

// 键盘导航
export function useKeyboardNavigation() {
  const navigationHandlers = ref<Map<string, (event: KeyboardEvent) => void>>(new Map())

  // 注册键盘快捷键
  const registerShortcut = (key: string, handler: (event: KeyboardEvent) => void) => {
    navigationHandlers.value.set(key.toLowerCase(), handler)
  }

  // 注销键盘快捷键
  const unregisterShortcut = (key: string) => {
    navigationHandlers.value.delete(key.toLowerCase())
  }

  // 处理键盘事件
  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase()
    const handler = navigationHandlers.value.get(key)
    
    if (handler) {
      handler(event)
    }

    // 通用导航处理
    switch (key) {
      case 'escape':
        // 关闭模态框或返回上级
        const modal = document.querySelector('[role="dialog"]')
        if (modal) {
          const closeButton = modal.querySelector('[aria-label*="关闭"], [aria-label*="close"]') as HTMLElement
          if (closeButton) {
            closeButton.click()
          }
        }
        break
        
      case 'f6':
        // 在主要区域间切换焦点
        event.preventDefault()
        cycleFocusRegions()
        break
    }
  }

  // 在主要区域间循环焦点
  const cycleFocusRegions = () => {
    const regions = document.querySelectorAll('[role="main"], [role="navigation"], [role="complementary"]')
    const currentRegion = document.activeElement?.closest('[role]')
    
    if (regions.length > 0) {
      let nextIndex = 0
      
      if (currentRegion) {
        const currentIndex = Array.from(regions).indexOf(currentRegion as Element)
        nextIndex = (currentIndex + 1) % regions.length
      }
      
      const nextRegion = regions[nextIndex] as HTMLElement
      const firstFocusable = nextRegion.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      
      if (firstFocusable) {
        firstFocusable.focus()
      } else {
        nextRegion.focus()
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return {
    registerShortcut,
    unregisterShortcut
  }
}

// ARIA 属性管理
export function useAriaAttributes() {
  // 设置 ARIA 属性
  const setAriaAttribute = (element: HTMLElement | string, attribute: string, value: string) => {
    const targetElement = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element

    if (targetElement) {
      targetElement.setAttribute(`aria-${attribute}`, value)
    }
  }

  // 切换 ARIA 属性
  const toggleAriaAttribute = (element: HTMLElement | string, attribute: string) => {
    const targetElement = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element

    if (targetElement) {
      const currentValue = targetElement.getAttribute(`aria-${attribute}`)
      const newValue = currentValue === 'true' ? 'false' : 'true'
      targetElement.setAttribute(`aria-${attribute}`, newValue)
    }
  }

  // 宣布消息给屏幕阅读器
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
    announcer.style.left = '-9999px'
    announcer.style.width = '1px'
    announcer.style.height = '1px'
    announcer.style.overflow = 'hidden'
    
    document.body.appendChild(announcer)
    
    // 延迟添加消息以确保屏幕阅读器能够检测到
    setTimeout(() => {
      announcer.textContent = message
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(announcer)
      }, 1000)
    }, 100)
  }

  return {
    setAriaAttribute,
    toggleAriaAttribute,
    announceToScreenReader
  }
}

// 颜色对比度检查
export function useColorContrast() {
  // 计算颜色亮度
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color)
    if (!rgb) return 0

    const [r, g, b] = rgb.map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  // 十六进制转RGB
  const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null
  }

  // 计算对比度
  const getContrastRatio = (color1: string, color2: string): number => {
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  // 检查对比度是否符合WCAG标准
  const checkWCAGCompliance = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA') => {
    const ratio = getContrastRatio(foreground, background)
    const minRatio = level === 'AAA' ? 7 : 4.5
    
    return {
      ratio,
      passes: ratio >= minRatio,
      level
    }
  }

  return {
    getLuminance,
    getContrastRatio,
    checkWCAGCompliance
  }
}
