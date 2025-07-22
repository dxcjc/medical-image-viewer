<template>
  <div 
    class="enhanced-layout"
    :class="layoutClasses"
    :style="layoutStyles"
  >
    <!-- 跳转链接（无障碍访问） -->
    <div class="skip-links">
      <a href="#main-content" class="skip-link">跳转到主要内容</a>
      <a href="#navigation" class="skip-link">跳转到导航</a>
      <a href="#sidebar" class="skip-link">跳转到侧边栏</a>
    </div>

    <!-- 头部区域 -->
    <header 
      class="layout-header"
      role="banner"
      :style="{ height: headerHeight }"
    >
      <slot name="header">
        <HeaderComponent />
      </slot>
    </header>

    <!-- 主要内容区域 -->
    <div class="layout-main-wrapper">
      <!-- 侧边导航 -->
      <aside 
        v-if="showSidebar"
        id="navigation"
        class="layout-sidebar"
        role="navigation"
        :aria-label="sidebarLabel"
        :style="sidebarStyles"
      >
        <slot name="sidebar">
          <SidebarComponent />
        </slot>
      </aside>

      <!-- 主要内容 -->
      <main 
        id="main-content"
        class="layout-content"
        role="main"
        :aria-label="mainContentLabel"
        :style="contentStyles"
      >
        <!-- 工具栏 -->
        <div 
          v-if="showToolbar"
          class="layout-toolbar"
          role="toolbar"
          :aria-label="toolbarLabel"
        >
          <slot name="toolbar">
            <ToolbarComponent 
              :has-image="hasImage"
              :is-inverted="isInverted"
              @tool-changed="handleToolChanged"
              @open-file="handleOpenFile"
              @save-image="handleSaveImage"
              @reset-view="handleResetView"
              @fit-to-window="handleFitToWindow"
              @toggle-invert="handleToggleInvert"
              @show-image-info="handleShowImageInfo"
            />
          </slot>
        </div>

        <!-- 主要内容区域 -->
        <div class="layout-content-main">
          <slot name="main" />
        </div>
      </main>

      <!-- 右侧面板 -->
      <aside 
        v-if="showRightPanel"
        id="sidebar"
        class="layout-right-panel"
        role="complementary"
        :aria-label="rightPanelLabel"
        :style="rightPanelStyles"
      >
        <slot name="right-panel" />
      </aside>
    </div>

    <!-- 底部区域 -->
    <footer 
      v-if="showFooter"
      class="layout-footer"
      role="contentinfo"
      :style="{ height: footerHeight }"
    >
      <slot name="footer">
        <FooterComponent />
      </slot>
    </footer>

    <!-- 性能监控 -->
    <PerformanceMonitor 
      v-if="showPerformanceMonitor"
      :enabled="isDevelopment"
      position="top-right"
    />

    <!-- 无障碍访问工具 -->
    <div v-if="showAccessibilityTools" class="accessibility-tools">
      <button 
        @click="toggleHighContrast"
        :aria-pressed="isHighContrast"
        class="accessibility-button"
        title="切换高对比度模式"
      >
        <el-icon><View /></el-icon>
      </button>
      <button 
        @click="increaseFontSize"
        class="accessibility-button"
        title="增大字体"
      >
        <el-icon><Plus /></el-icon>
      </button>
      <button 
        @click="decreaseFontSize"
        class="accessibility-button"
        title="减小字体"
      >
        <el-icon><Minus /></el-icon>
      </button>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="layout-loading-overlay">
      <LoadingComponent 
        :text="loadingText"
        :show-progress="showLoadingProgress"
        :progress="loadingProgress"
        full-screen
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useResponsive, useResponsiveStyles } from '@/composables/useResponsive'
import { useAccessibility, useFocusManagement, useKeyboardNavigation } from '@/composables/useAccessibility'
import { usePerformance } from '@/composables/usePerformance'
import HeaderComponent from './HeaderComponent.vue'
import SidebarComponent from './SidebarComponent.vue'
import FooterComponent from './FooterComponent.vue'
import ToolbarComponent from '@/components/tools/ToolbarComponent.vue'
import PerformanceMonitor from '@/components/common/PerformanceMonitor.vue'
import LoadingComponent from '@/components/common/LoadingComponent.vue'
import { View, Plus, Minus } from '@element-plus/icons-vue'

interface Props {
  showSidebar?: boolean
  showRightPanel?: boolean
  showFooter?: boolean
  showToolbar?: boolean
  showPerformanceMonitor?: boolean
  showAccessibilityTools?: boolean
  hasImage?: boolean
  isInverted?: boolean
  isLoading?: boolean
  loadingText?: string
  showLoadingProgress?: boolean
  loadingProgress?: number
  sidebarLabel?: string
  mainContentLabel?: string
  toolbarLabel?: string
  rightPanelLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  showSidebar: true,
  showRightPanel: false,
  showFooter: true,
  showToolbar: true,
  showPerformanceMonitor: false,
  showAccessibilityTools: true,
  hasImage: false,
  isInverted: false,
  isLoading: false,
  loadingText: '加载中...',
  showLoadingProgress: false,
  loadingProgress: 0,
  sidebarLabel: '导航菜单',
  mainContentLabel: '主要内容',
  toolbarLabel: '工具栏',
  rightPanelLabel: '信息面板'
})

const emit = defineEmits<{
  toolChanged: [tool: string]
  openFile: []
  saveImage: []
  resetView: []
  fitToWindow: []
  toggleInvert: []
  showImageInfo: []
}>()

// 组合函数
const route = useRoute()
const { isMobile, isTablet, currentBreakpoint } = useResponsive()
const { responsiveClasses } = useResponsiveStyles()
const { isScreenReaderActive, isHighContrast: accessibilityHighContrast, isReducedMotion } = useAccessibility()
const { setFocus } = useFocusManagement()
const { registerShortcut } = useKeyboardNavigation()
const { startMonitoring } = usePerformance()

// 响应式数据
const isHighContrast = ref(false)
const fontSize = ref(16)
const isDevelopment = ref(process.env.NODE_ENV === 'development')

// 计算属性
const layoutClasses = computed(() => ({
  ...responsiveClasses.value,
  'high-contrast': isHighContrast.value || accessibilityHighContrast.value,
  'reduced-motion': isReducedMotion.value,
  'screen-reader-active': isScreenReaderActive.value,
  'has-sidebar': props.showSidebar,
  'has-right-panel': props.showRightPanel,
  'has-footer': props.showFooter,
  'has-toolbar': props.showToolbar
}))

const layoutStyles = computed(() => ({
  fontSize: `${fontSize.value}px`,
  '--header-height': headerHeight.value,
  '--footer-height': footerHeight.value,
  '--sidebar-width': sidebarWidth.value,
  '--right-panel-width': rightPanelWidth.value
}))

const headerHeight = computed(() => isMobile.value ? '50px' : '60px')
const footerHeight = computed(() => '40px')
const sidebarWidth = computed(() => {
  if (!props.showSidebar) return '0px'
  return isMobile.value ? '100%' : '240px'
})
const rightPanelWidth = computed(() => {
  if (!props.showRightPanel) return '0px'
  return isMobile.value ? '100%' : '320px'
})

const sidebarStyles = computed(() => ({
  width: sidebarWidth.value,
  transform: isMobile.value && !props.showSidebar ? 'translateX(-100%)' : 'translateX(0)'
}))

const contentStyles = computed(() => ({
  marginLeft: props.showSidebar && !isMobile.value ? sidebarWidth.value : '0',
  marginRight: props.showRightPanel && !isMobile.value ? rightPanelWidth.value : '0'
}))

const rightPanelStyles = computed(() => ({
  width: rightPanelWidth.value,
  transform: isMobile.value && !props.showRightPanel ? 'translateX(100%)' : 'translateX(0)'
}))

// 方法
const toggleHighContrast = () => {
  isHighContrast.value = !isHighContrast.value
  document.documentElement.classList.toggle('high-contrast', isHighContrast.value)
}

const increaseFontSize = () => {
  if (fontSize.value < 24) {
    fontSize.value += 2
  }
}

const decreaseFontSize = () => {
  if (fontSize.value > 12) {
    fontSize.value -= 2
  }
}

// 事件处理
const handleToolChanged = (tool: string) => emit('toolChanged', tool)
const handleOpenFile = () => emit('openFile')
const handleSaveImage = () => emit('saveImage')
const handleResetView = () => emit('resetView')
const handleFitToWindow = () => emit('fitToWindow')
const handleToggleInvert = () => emit('toggleInvert')
const handleShowImageInfo = () => emit('showImageInfo')

// 提供布局上下文
provide('layout', {
  isMobile,
  isTablet,
  currentBreakpoint,
  isHighContrast,
  fontSize
})

// 生命周期
onMounted(() => {
  // 注册快捷键
  registerShortcut('alt+1', () => setFocus('#main-content'))
  registerShortcut('alt+2', () => setFocus('#navigation'))
  registerShortcut('alt+3', () => setFocus('#sidebar'))
  
  // 开始性能监控
  if (isDevelopment.value) {
    startMonitoring()
  }
})
</script>

<style scoped>
.enhanced-layout {
  @apply h-screen flex flex-col bg-white text-gray-900;
  transition: all 0.3s ease;
}

.enhanced-layout.high-contrast {
  @apply bg-black text-white;
}

.enhanced-layout.reduced-motion * {
  transition: none !important;
  animation: none !important;
}

/* 跳转链接 */
.skip-links {
  @apply absolute top-0 left-0 z-50;
}

.skip-link {
  @apply absolute -top-10 left-4 bg-primary-600 text-white px-4 py-2 rounded;
  @apply focus:top-4 transition-all duration-200;
}

/* 布局区域 */
.layout-header {
  @apply flex-shrink-0 bg-white border-b border-gray-200 shadow-sm;
}

.layout-main-wrapper {
  @apply flex-1 flex overflow-hidden;
}

.layout-sidebar {
  @apply flex-shrink-0 bg-gray-50 border-r border-gray-200;
  @apply transition-transform duration-300 ease-in-out;
}

.layout-content {
  @apply flex-1 flex flex-col overflow-hidden;
}

.layout-toolbar {
  @apply flex-shrink-0;
}

.layout-content-main {
  @apply flex-1 overflow-hidden;
}

.layout-right-panel {
  @apply flex-shrink-0 bg-gray-50 border-l border-gray-200;
  @apply transition-transform duration-300 ease-in-out;
}

.layout-footer {
  @apply flex-shrink-0 bg-gray-50 border-t border-gray-200;
}

/* 无障碍访问工具 */
.accessibility-tools {
  @apply fixed bottom-4 right-4 flex flex-col space-y-2 z-40;
}

.accessibility-button {
  @apply w-10 h-10 bg-primary-600 text-white rounded-full shadow-lg;
  @apply hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300;
  @apply transition-all duration-200;
}

/* 加载遮罩 */
.layout-loading-overlay {
  @apply fixed inset-0 z-50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-sidebar,
  .layout-right-panel {
    @apply fixed top-0 h-full z-30;
  }
  
  .layout-sidebar {
    @apply left-0;
  }
  
  .layout-right-panel {
    @apply right-0;
  }
}

/* 高对比度模式 */
.high-contrast .layout-header,
.high-contrast .layout-sidebar,
.high-contrast .layout-right-panel,
.high-contrast .layout-footer {
  @apply bg-black border-white;
}

/* 性能优化 */
.layout-sidebar,
.layout-right-panel,
.layout-content {
  contain: layout style paint;
}
</style>
