<template>
  <div
    ref="containerRef"
    class="virtual-list-container"
    :class="containerClasses"
    :style="containerStyles"
    @scroll="handleScroll"
    @wheel="handleWheel"
    role="listbox"
    :aria-label="ariaLabel"
    :aria-multiselectable="multiSelect"
  >
    <!-- 虚拟滚动内容 -->
    <div
      class="virtual-list-spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        class="virtual-list-content"
        :style="contentStyles"
      >
        <!-- 可见项目渲染 -->
        <div
          v-for="(item, index) in visibleItems"
          :key="getItemKey(item, startIndex + index)"
          class="virtual-list-item"
          :class="getItemClasses(item, startIndex + index)"
          :style="getItemStyles(item, startIndex + index)"
          :tabindex="focusable ? 0 : -1"
          :aria-selected="isSelected(item)"
          :aria-posinset="startIndex + index + 1"
          :aria-setsize="data.length"
          role="option"
          @click="handleItemClick(item, startIndex + index, $event)"
          @keydown="handleItemKeydown(item, startIndex + index, $event)"
          @focus="handleItemFocus(item, startIndex + index)"
          @blur="handleItemBlur(item, startIndex + index)"
        >
          <slot
            :item="item"
            :index="startIndex + index"
            :isVisible="true"
            :isSelected="isSelected(item)"
            :isFocused="focusedIndex === startIndex + index"
          />
        </div>
      </div>
    </div>

    <!-- 加载更多指示器 -->
    <div
      v-if="hasMore && isLoadingMore"
      class="virtual-list-loading"
    >
      <slot name="loading">
        <div class="flex items-center justify-center py-4">
          <svg class="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-opacity="0.25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span class="ml-2 text-sm text-gray-600">加载更多...</span>
        </div>
      </slot>
    </div>

    <!-- 空状态 -->
    <div
      v-if="data.length === 0 && !isLoading"
      class="virtual-list-empty"
    >
      <slot name="empty">
        <div class="flex flex-col items-center justify-center py-12 text-gray-500">
          <svg class="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-sm">暂无数据</p>
        </div>
      </slot>
    </div>

    <!-- 滚动条指示器 -->
    <div
      v-if="showScrollIndicator"
      class="virtual-list-scroll-indicator"
      :style="scrollIndicatorStyles"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useUIStore } from '@/stores/ui'
import { designTokens } from '@/design-system/tokens'

interface VirtualListItem {
  [key: string]: any
}

interface Props {
  data: VirtualListItem[]
  height: number
  itemHeight: number | ((item: VirtualListItem, index: number) => number)
  buffer?: number
  keyField?: string

  // 交互功能
  selectable?: boolean
  multiSelect?: boolean
  focusable?: boolean

  // 无限滚动
  hasMore?: boolean
  isLoading?: boolean
  isLoadingMore?: boolean
  loadMoreThreshold?: number

  // 样式配置
  showScrollIndicator?: boolean
  ariaLabel?: string

  // 性能配置
  enableVirtualization?: boolean
  overscan?: number
}

const props = withDefaults(defineProps<Props>(), {
  buffer: 5,
  keyField: 'id',
  selectable: false,
  multiSelect: false,
  focusable: true,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  loadMoreThreshold: 200,
  showScrollIndicator: false,
  ariaLabel: '虚拟列表',
  enableVirtualization: true,
  overscan: 3
})

const emit = defineEmits<{
  scroll: [scrollTop: number, scrollDirection: 'up' | 'down']
  itemClick: [item: VirtualListItem, index: number, event: MouseEvent]
  itemSelect: [item: VirtualListItem, index: number, selected: boolean]
  itemFocus: [item: VirtualListItem, index: number]
  loadMore: []
  reachTop: []
  reachBottom: []
}>()

// 组合函数
const uiStore = useUIStore()

// 响应式数据
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const lastScrollTop = ref(0)
const isScrolling = ref(false)
const scrollTimer = ref<number>()
const selectedItems = ref<Set<string>>(new Set())
const focusedIndex = ref(-1)
const itemHeights = ref<Map<number, number>>(new Map())
const isIntersecting = ref(false)

// 计算属性
const totalHeight = computed(() => props.data.length * props.itemHeight)
const visibleCount = computed(() => Math.ceil(props.height / props.itemHeight))
const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight)
  return Math.max(0, index - props.buffer)
})
const endIndex = computed(() => {
  const index = startIndex.value + visibleCount.value + props.buffer * 2
  return Math.min(props.data.length - 1, index)
})
const visibleItems = computed(() => {
  return props.data.slice(startIndex.value, endIndex.value + 1)
})
const offsetY = computed(() => startIndex.value * props.itemHeight)

// 获取项目键值
const getItemKey = (item: any, index: number) => {
  if (props.keyField && item[props.keyField] !== undefined) {
    return item[props.keyField]
  }
  return index
}

// 滚动处理
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  
  isScrolling.value = true
  
  // 清除之前的定时器
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
  
  // 设置新的定时器
  scrollTimer.value = window.setTimeout(() => {
    isScrolling.value = false
  }, 150)
  
  emit('scroll', scrollTop.value)
}

// 滚动到指定位置
const scrollTo = (index: number) => {
  if (!containerRef.value) return
  
  const targetScrollTop = index * props.itemHeight
  containerRef.value.scrollTop = targetScrollTop
}

// 滚动到指定项目
const scrollToItem = (item: any) => {
  const index = props.data.findIndex(dataItem => {
    if (props.keyField) {
      return dataItem[props.keyField] === item[props.keyField]
    }
    return dataItem === item
  })
  
  if (index !== -1) {
    scrollTo(index)
  }
}

// 监听数据变化
watch(() => props.data.length, () => {
  nextTick(() => {
    if (containerRef.value) {
      // 如果数据长度变化，重新计算滚动位置
      const maxScrollTop = Math.max(0, totalHeight.value - props.height)
      if (scrollTop.value > maxScrollTop) {
        containerRef.value.scrollTop = maxScrollTop
      }
    }
  })
})

// 暴露方法
defineExpose({
  scrollTo,
  scrollToItem,
  getScrollTop: () => scrollTop.value,
  getVisibleRange: () => ({ start: startIndex.value, end: endIndex.value })
})

// 生命周期
onMounted(() => {
  // 初始化滚动位置
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
  }
})

onUnmounted(() => {
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
})
</script>

<style scoped>
.virtual-list-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-list-spacer {
  position: relative;
  width: 100%;
}

.virtual-list-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-list-item {
  width: 100%;
  box-sizing: border-box;
}

/* 优化滚动性能 */
.virtual-list-container {
  contain: layout style paint;
  -webkit-overflow-scrolling: touch;
}

/* 自定义滚动条 */
.virtual-list-container::-webkit-scrollbar {
  width: 6px;
}

.virtual-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.virtual-list-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.virtual-list-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
