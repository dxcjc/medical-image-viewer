/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      // 医学影像专用颜色配置
      colors: {
        // 主色调
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Element Plus 主色
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        // 医学影像背景色
        medical: {
          bg: {
            primary: '#1f2937',    // 主背景色
            secondary: '#374151',  // 次要背景色
            tertiary: '#4b5563'   // 第三级背景色
          },
          text: {
            primary: '#f9fafb',    // 主文本色
            secondary: '#e5e7eb',  // 次要文本色
            muted: '#9ca3af'      // 静音文本色
          },
          border: '#4b5563',       // 边框色
          overlay: 'rgba(0, 0, 0, 0.7)',
          crosshair: 'rgba(255, 255, 0, 0.8)',
          measurement: '#ffff00',
          annotation: '#00ff00'
        },
        // 灰度色阶（用于医学影像显示）
        gray: {
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
        },
        // 状态颜色
        success: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#67c23a',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#e6a23c',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#f56c6c',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        info: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#909399'
        },
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
      },
      // 医学影像专用间距
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem'
      },
      // 医学影像查看器专用尺寸
      width: {
        'sidebar': '200px',
        'toolbar': '60px',
        'viewer': 'calc(100vw - 200px)'
      },
      height: {
        'header': '60px',
        'footer': '40px',
        'toolbar': '60px',
        'viewer': 'calc(100vh - 60px)',
        'viewer-full': 'calc(100vh - 120px)'
      },
      // 字体配置
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'mono': ['Courier New', 'Consolas', 'Liberation Mono', 'monospace']
      },
      // 阴影配置
      boxShadow: {
        'medical': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'overlay': '0 2px 8px rgba(0, 0, 0, 0.1)'
      },
      // 动画配置
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-top': 'slideInFromTop 0.3s ease-out',
        'slide-in-left': 'slideInFromLeft 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      },
      // 断点配置
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
  // 暗色模式配置
  darkMode: 'class'
}
