/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 现代化医学影像专用颜色配置
      colors: {
        // 主色调 - 医学蓝
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // 主色调
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // 医学影像专用色彩
        medical: {
          // 深色主题背景
          bg: {
            primary: '#0a0a0a',
            secondary: '#1a1a1a',
            tertiary: '#2a2a2a',
          },
          // 文本颜色
          text: {
            primary: '#ffffff',
            secondary: '#e5e5e5',
            muted: '#a3a3a3',
          },
          // 功能色彩
          overlay: 'rgba(0, 0, 0, 0.8)',
          crosshair: '#00d4ff',
          measurement: '#ffd700',
          annotation: '#00ff88',
          border: '#404040',
          hover: '#333333',
        },
        // 现代化灰度色阶
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // 状态颜色 - 现代化调色板
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // 特殊功能色
        accent: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          violet: '#8b5cf6',
          pink: '#ec4899',
        },
      },
      // 医学影像专用间距
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      // 医学影像查看器专用尺寸
      width: {
        'sidebar': '200px',
        'toolbar': '60px',
        'viewer': 'calc(100vw - 200px)',
      },
      height: {
        'header': '60px',
        'footer': '40px',
        'toolbar': '60px',
        'viewer': 'calc(100vh - 60px)',
        'viewer-full': 'calc(100vh - 120px)',
      },
      // 字体配置
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'mono': ['Courier New', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      // 现代化阴影配置
      boxShadow: {
        'medical': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'overlay': '0 4px 16px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(14, 165, 233, 0.3)',
        'glow-strong': '0 0 30px rgba(14, 165, 233, 0.5)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'toolbar': '0 2px 12px rgba(0, 0, 0, 0.25)',
      },
      // 现代化动画配置
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'slide-in-top': 'slideInFromTop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInFromLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-bottom': 'slideInFromBottom 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInFromTop: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(14, 165, 233, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      // 断点配置
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  // 暗色模式配置
  darkMode: 'class',
}
