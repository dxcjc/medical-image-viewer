// UI优化配置文件

// 响应式断点配置
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920
} as const

// 性能优化配置
export const PERFORMANCE_CONFIG = {
  // 虚拟滚动配置
  virtualScroll: {
    itemHeight: {
      mobile: 80,
      desktop: 100
    },
    buffer: 5,
    threshold: 50 // 超过50个项目时启用虚拟滚动
  },
  
  // 防抖延迟配置
  debounce: {
    search: 300,
    resize: 150,
    scroll: 16 // 约60fps
  },
  
  // 缓存配置
  cache: {
    maxSize: 100, // 最大缓存项目数
    ttl: 5 * 60 * 1000, // 5分钟TTL
    cleanupInterval: 60 * 1000 // 1分钟清理间隔
  },
  
  // 图像优化配置
  image: {
    lazyLoadThreshold: 100, // 提前100px开始加载
    maxConcurrentLoads: 3,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  // 内存管理配置
  memory: {
    maxHeapSize: 200 * 1024 * 1024, // 200MB
    gcThreshold: 0.8, // 80%时触发清理
    monitorInterval: 5000 // 5秒监控间隔
  }
}

// 无障碍访问配置
export const ACCESSIBILITY_CONFIG = {
  // 键盘快捷键
  shortcuts: {
    navigation: {
      'alt+1': 'main-content',
      'alt+2': 'navigation',
      'alt+3': 'sidebar',
      'f6': 'cycle-regions'
    },
    tools: {
      'p': 'pan',
      'z': 'zoom',
      'w': 'window-level',
      'l': 'length',
      'a': 'angle',
      'r': 'rectangle',
      'shift+r': 'reset-view',
      'f': 'fit-to-window',
      'i': 'invert',
      'ctrl+i': 'image-info',
      'ctrl+o': 'open-file',
      'ctrl+s': 'save-image'
    }
  },
  
  // ARIA标签
  labels: {
    fileList: '文件列表',
    toolbar: '工具栏',
    imageViewer: '医学影像查看器',
    sidebar: '侧边栏',
    mainContent: '主要内容',
    navigation: '导航菜单'
  },
  
  // 颜色对比度
  contrast: {
    minRatio: 4.5, // WCAG AA标准
    preferredRatio: 7, // WCAG AAA标准
    colors: {
      primary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#6b7280'
    }
  },
  
  // 字体大小
  fontSize: {
    min: 12,
    default: 16,
    max: 24,
    step: 2
  }
}

// 动画配置
export const ANIMATION_CONFIG = {
  // 动画持续时间
  duration: {
    fast: 150,
    normal: 300,
    slow: 500
  },
  
  // 缓动函数
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // 减少动画偏好
  respectReducedMotion: true,
  
  // 性能优化动画
  useTransform: true,
  useWillChange: true
}

// 主题配置
export const THEME_CONFIG = {
  // 颜色系统
  colors: {
    // 主色调
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    
    // 医学影像专用色彩
    medical: {
      bg: '#000000',
      text: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.7)',
      crosshair: 'rgba(255, 255, 0, 0.8)',
      measurement: '#ffff00',
      annotation: '#00ff00'
    },
    
    // 语义化颜色
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#6b7280'
    }
  },
  
  // 间距系统
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  
  // 圆角系统
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  
  // 阴影系统
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  }
}

// 布局配置
export const LAYOUT_CONFIG = {
  // 头部高度
  header: {
    mobile: '50px',
    desktop: '60px'
  },
  
  // 底部高度
  footer: {
    height: '40px'
  },
  
  // 侧边栏宽度
  sidebar: {
    mobile: '100%',
    desktop: '240px'
  },
  
  // 右侧面板宽度
  rightPanel: {
    mobile: '100%',
    desktop: '320px'
  },
  
  // 工具栏高度
  toolbar: {
    height: '60px'
  },
  
  // 内容区域
  content: {
    maxWidth: '1920px',
    padding: {
      mobile: '1rem',
      desktop: '2rem'
    }
  }
}

// 组件配置
export const COMPONENT_CONFIG = {
  // 按钮配置
  button: {
    sizes: {
      small: {
        height: '32px',
        padding: '0 12px',
        fontSize: '14px'
      },
      default: {
        height: '40px',
        padding: '0 16px',
        fontSize: '16px'
      },
      large: {
        height: '48px',
        padding: '0 20px',
        fontSize: '18px'
      }
    }
  },
  
  // 输入框配置
  input: {
    sizes: {
      small: {
        height: '32px',
        fontSize: '14px'
      },
      default: {
        height: '40px',
        fontSize: '16px'
      },
      large: {
        height: '48px',
        fontSize: '18px'
      }
    }
  },
  
  // 文件列表配置
  fileList: {
    itemHeight: {
      mobile: 80,
      desktop: 100
    },
    maxVisibleItems: 50,
    loadMoreThreshold: 10
  },
  
  // 工具栏配置
  toolbar: {
    sections: ['file', 'basic', 'measure', 'view'],
    mobileMode: 'tabs', // 'tabs' | 'dropdown' | 'collapse'
    showLabels: {
      mobile: false,
      desktop: true
    }
  }
}

// 开发配置
export const DEVELOPMENT_CONFIG = {
  // 性能监控
  performanceMonitor: {
    enabled: process.env.NODE_ENV === 'development',
    position: 'top-right' as const,
    updateInterval: 1000
  },
  
  // 调试工具
  debug: {
    showBoundingBoxes: false,
    logPerformanceMetrics: true,
    logAccessibilityIssues: true,
    showResponsiveBreakpoints: false
  },
  
  // 热重载配置
  hotReload: {
    enabled: true,
    preserveState: true
  }
}

// 导出默认配置
export const UI_OPTIMIZATION_CONFIG = {
  breakpoints: BREAKPOINTS,
  performance: PERFORMANCE_CONFIG,
  accessibility: ACCESSIBILITY_CONFIG,
  animation: ANIMATION_CONFIG,
  theme: THEME_CONFIG,
  layout: LAYOUT_CONFIG,
  component: COMPONENT_CONFIG,
  development: DEVELOPMENT_CONFIG
} as const

// 配置类型定义
export type UIOptimizationConfig = typeof UI_OPTIMIZATION_CONFIG
export type BreakpointKey = keyof typeof BREAKPOINTS
export type ThemeColor = keyof typeof THEME_CONFIG.colors
export type ComponentSize = 'small' | 'default' | 'large'
