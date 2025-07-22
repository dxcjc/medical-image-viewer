<template>
  <div 
    ref="containerRef" 
    class="virtual-list-container"
    :style="{ height: `${height}px` }"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-list-spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div 
        class="virtual-list-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="(item, index) in visibleItems"
          :key="getItemKey(item, startIndex + index)"
          class="virtual-list-item"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot 
            :item="item" 
            :index="startIndex + index"
            :isVisible="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface Props {
  data: any[]
  height: number
  itemHeight: number
  buffer?: number
  keyField?: string
}

const props = withDefaults(defineProps<Props>(), {
  buffer: 5,
  keyField: 'id'
})

const emit = defineEmits<{
  scroll: [scrollTop: number]
}>()

// 响应式数据
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const isScrolling = ref(false)
const scrollTimer = ref<number>()

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
