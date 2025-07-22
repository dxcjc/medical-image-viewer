<template>
  <div
    id="app"
    class="medical-app"
    :class="appClasses"
    :style="appStyles"
  >
    <!-- 全局加载指示器 -->
    <div v-if="isGlobalLoading" class="global-loading">
      <LoadingComponent
        text="应用初始化中..."
        :show-progress="true"
        :progress="loadingProgress"
        full-screen
      />
    </div>

    <!-- 主要应用内容 -->
    <div v-else class="app-content">
      <router-view v-slot="{ Component, route }">
        <transition
          :name="getTransitionName(route)"
          mode="out-in"
          @enter="onRouteEnter"
          @leave="onRouteLeave"
        >
          <component
            :is="Component"
            :key="route.path"
            class="route-component"
          />
        </transition>
      </router-view>
    </div>

    <!-- 全局错误边界 -->
    <div v-if="hasGlobalError" class="global-error">
      <div class="error-content">
        <h2>应用遇到了错误</h2>
        <p>{{ globalError?.message }}</p>
        <el-button @click="reloadApp" type="primary">重新加载</el-button>
      </div>
    </div>

    <!-- 性能监控 -->
    <PerformanceMonitor
      v-if="showPerformanceMonitor"
      :enabled="isDevelopment"
      position="top-right"
    />

    <!-- 全局通知容器 -->
    <div id="global-notifications" class="global-notifications"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useResponsive } from '@/composables/useResponsive'
import { useAccessibility } from '@/composables/useAccessibility'
import { usePerformance } from '@/composables/usePerformance'
import { memoryManager, performanceMeasurer } from '@/utils/ui-optimization'
import LoadingComponent from '@/components/common/LoadingComponent.vue'
import PerformanceMonitor from '@/components/common/PerformanceMonitor.vue'

// 组合函数
const route = useRoute()
const { isMobile, currentBreakpoint } = useResponsive()
const { isHighContrast, isReducedMotion } = useAccessibility()
const { startMonitoring } = usePerformance()

// 响应式数据
const isGlobalLoading = ref(true)
const loadingProgress = ref(0)
const hasGlobalError = ref(false)
const globalError = ref<Error | null>(null)
const isDevelopment = ref(process.env.NODE_ENV === 'development')
const showPerformanceMonitor = ref(isDevelopment.value)

// 计算属性
const appClasses = computed(() => ({
  'is-mobile': isMobile.value,
  'is-high-contrast': isHighContrast.value,
  'is-reduced-motion': isReducedMotion.value,
  [`breakpoint-${currentBreakpoint.value}`]: true,
  'has-error': hasGlobalError.value
}))

const appStyles = computed(() => ({
  '--current-breakpoint': currentBreakpoint.value
}))

// 方法
const getTransitionName = (route: any) => {
  if (isReducedMotion.value) return 'none'
  return isMobile.value ? 'slide' : 'fade'
}

const onRouteEnter = (el: Element) => {
  performanceMeasurer.start('route-enter')
}

const onRouteLeave = (el: Element) => {
  performanceMeasurer.end('route-enter')
}

const reloadApp = () => {
  window.location.reload()
}

// 初始化应用
const initializeApp = async () => {
  try {
    performanceMeasurer.start('app-init')

    // 模拟初始化过程
    const steps = [
      { name: '加载配置', progress: 20 },
      { name: '初始化服务', progress: 40 },
      { name: '加载资源', progress: 60 },
      { name: '准备界面', progress: 80 },
      { name: '完成初始化', progress: 100 }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 200))
      loadingProgress.value = step.progress
    }

    // 启动性能监控
    if (isDevelopment.value) {
      startMonitoring()
    }

    performanceMeasurer.end('app-init')
    isGlobalLoading.value = false

    console.log('医学影像查看器启动成功')
    console.log('初始化耗时:', performanceMeasurer.getMeasure('app-init'), 'ms')

  } catch (error) {
    console.error('应用初始化失败:', error)
    hasGlobalError.value = true
    globalError.value = error as Error
    isGlobalLoading.value = false
  }
}

// 错误处理
onErrorCaptured((error, instance, info) => {
  console.error('Vue错误捕获:', error, info)
  hasGlobalError.value = true
  globalError.value = error
  return false
})

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error)
  hasGlobalError.value = true
  globalError.value = event.error
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason)
  hasGlobalError.value = true
  globalError.value = new Error(event.reason)
})

// 生命周期
onMounted(() => {
  initializeApp()
})
</script>

<style scoped>
.medical-app {
  @apply w-full h-screen overflow-hidden bg-white text-gray-900;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.medical-app.is-high-contrast {
  @apply bg-black text-white;
}

.medical-app.is-reduced-motion * {
  transition: none !important;
  animation: none !important;
}

.global-loading {
  @apply fixed inset-0 z-50;
}

.app-content {
  @apply w-full h-full;
}

.route-component {
  @apply w-full h-full;
}

.global-error {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50;
}

.error-content {
  @apply bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 text-center;
}

.error-content h2 {
  @apply text-xl font-semibold text-red-600 mb-4;
}

.error-content p {
  @apply text-gray-600 mb-6;
}

.global-notifications {
  @apply fixed top-4 right-4 z-40;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

.none-enter-active,
.none-leave-active {
  transition: none;
}

/* 响应式断点样式 */
.breakpoint-xs {
  --app-padding: 0.5rem;
}

.breakpoint-sm {
  --app-padding: 1rem;
}

.breakpoint-md {
  --app-padding: 1.5rem;
}

.breakpoint-lg {
  --app-padding: 2rem;
}

.breakpoint-xl {
  --app-padding: 2.5rem;
}
</style>
