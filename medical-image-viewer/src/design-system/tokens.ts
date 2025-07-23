// 医疗图像查看器设计令牌系统
// Design Tokens for Medical Image Viewer

export const designTokens = {
  // 色彩系统 - 专为医疗软件设计
  colors: {
    // 主色调 - 医疗蓝
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // 主色
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },

    // 医疗专用色彩
    medical: {
      // 影像背景色 - 深色系，减少眼疲劳
      background: '#0a0a0a',
      backgroundSecondary: '#1a1a1a',
      backgroundTertiary: '#2a2a2a',
      
      // 影像文本色 - 高对比度
      text: '#ffffff',
      textSecondary: '#e5e5e5',
      textMuted: '#a3a3a3',
      
      // 测量工具色彩
      measurement: '#fbbf24', // 黄色 - 测量线条
      annotation: '#10b981', // 绿色 - 标注
      crosshair: '#ef4444', // 红色 - 十字线
      
      // 状态色彩
      overlay: 'rgba(0, 0, 0, 0.8)',
      highlight: 'rgba(59, 130, 246, 0.3)',
      selection: 'rgba(16, 185, 129, 0.2)'
    },

    // 语义化色彩
    semantic: {
      success: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d'
      },
      warning: {
        50: '#fffbeb',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309'
      },
      error: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c'
      },
      info: {
        50: '#f0f9ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8'
      }
    },

    // 中性色彩
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    }
  },

  // 字体系统
  typography: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif'
      ],
      mono: [
        '"SF Mono"',
        'Monaco',
        '"Cascadia Code"',
        '"Roboto Mono"',
        'Consolas',
        '"Liberation Mono"',
        'monospace'
      ],
      medical: [
        '"Inter"',
        '-apple-system',
        'BlinkMacSystemFont',
        'sans-serif'
      ]
    },

    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }]  // 36px
    },

    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },

    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em'
    }
  },

  // 间距系统
  spacing: {
    0: '0px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
    56: '14rem',    // 224px
    64: '16rem'     // 256px
  },

  // 圆角系统
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },

  // 阴影系统
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000'
  },

  // 断点系统
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px'
  },

  // 动画系统
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },

  // Z-index 层级系统
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  },

  // 医疗专用尺寸
  medical: {
    // 工具栏高度
    toolbarHeight: {
      mobile: '48px',
      desktop: '56px'
    },
    
    // 侧边栏宽度
    sidebarWidth: {
      collapsed: '64px',
      expanded: '280px'
    },
    
    // 影像查看器最小尺寸
    viewerMinSize: {
      width: '400px',
      height: '300px'
    },
    
    // 缩略图尺寸
    thumbnailSize: {
      small: '64px',
      medium: '96px',
      large: '128px'
    }
  }
} as const

// 类型定义
export type DesignTokens = typeof designTokens
export type ColorScale = keyof typeof designTokens.colors.primary
export type SemanticColor = keyof typeof designTokens.colors.semantic
export type FontSize = keyof typeof designTokens.typography.fontSize
export type Spacing = keyof typeof designTokens.spacing
export type BorderRadius = keyof typeof designTokens.borderRadius
export type Breakpoint = keyof typeof designTokens.breakpoints

// 工具函数
export const getColor = (color: string, scale?: ColorScale) => {
  const colorPath = color.split('.')
  let result: any = designTokens.colors
  
  for (const path of colorPath) {
    result = result[path]
  }
  
  if (scale && typeof result === 'object') {
    return result[scale]
  }
  
  return result
}

export const getSpacing = (size: Spacing) => {
  return designTokens.spacing[size]
}

export const getFontSize = (size: FontSize) => {
  return designTokens.typography.fontSize[size]
}

export const getBreakpoint = (bp: Breakpoint) => {
  return designTokens.breakpoints[bp]
}
