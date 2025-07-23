<template>
  <div class="toolbar-component" :class="{ 'mobile-layout': isMobile }">
    <!-- 文件操作区域 -->
    <div class="toolbar-section" v-if="!isMobile || showSection === 'file'">
      <span class="section-title mobile-hidden">文件</span>
      <el-button-group class="button-group">
        <el-tooltip content="打开文件" placement="bottom">
          <el-button
            :size="buttonSize"
            @click="openFile"
            :loading="isLoading.openFile"
          >
            <el-icon><FolderOpened /></el-icon>
            <span class="mobile-hidden ml-1">打开</span>
          </el-button>
        </el-tooltip>
        <el-tooltip content="保存图像" placement="bottom">
          <el-button
            :size="buttonSize"
            @click="saveImage"
            :loading="isLoading.saveImage"
            :disabled="!hasImage"
          >
            <el-icon><Download /></el-icon>
            <span class="mobile-hidden ml-1">保存</span>
          </el-button>
        </el-tooltip>
      </el-button-group>
    </div>

    <el-divider direction="vertical" v-if="!isMobile" />

    <!-- 基础工具区域 -->
    <div class="toolbar-section" v-if="!isMobile || showSection === 'basic'">
      <span class="section-title mobile-hidden">基础工具</span>
      <el-button-group class="button-group">
        <el-tooltip content="平移工具 (快捷键: P)" placement="bottom">
          <el-button
            :size="buttonSize"
            :type="activeTool === 'pan' ? 'primary' : 'default'"
            @click="setActiveTool('pan')"
          >
            <el-icon><Rank /></el-icon>
            <span class="mobile-hidden ml-1">平移</span>
          </el-button>
        </el-tooltip>
        <el-tooltip content="缩放工具 (快捷键: Z)" placement="bottom">
          <el-button
            :size="buttonSize"
            :type="activeTool === 'zoom' ? 'primary' : 'default'"
            @click="setActiveTool('zoom')"
          >
            <el-icon><ZoomIn /></el-icon>
            <span class="mobile-hidden ml-1">缩放</span>
          </el-button>
        </el-tooltip>
        <el-tooltip content="窗宽窗位调节 (快捷键: W)" placement="bottom">
          <el-button
            :size="buttonSize"
            :type="activeTool === 'windowLevel' ? 'primary' : 'default'"
            @click="setActiveTool('windowLevel')"
          >
            <el-icon><Operation /></el-icon>
            <span class="mobile-hidden ml-1">窗宽窗位</span>
          </el-button>
        </el-tooltip>
      </el-button-group>
    </div>

    <el-divider direction="vertical" v-if="!isMobile" />

    <!-- 测量工具区域 -->
    <div class="toolbar-section" v-if="!isMobile || showSection === 'measure'">
      <span class="section-title mobile-hidden">测量工具</span>
      <el-button-group class="button-group">
        <el-tooltip content="长度测量 (快捷键: L)" placement="bottom">
          <el-button
            :size="buttonSize"
            :type="activeTool === 'length' ? 'primary' : 'default'"
            @click="setActiveTool('length')"
          >
            <el-icon><Minus /></el-icon>
            <span class="mobile-hidden ml-1">长度</span>
          </el-button>
        </el-tooltip>
        <el-tooltip content="角度测量 (快捷键: A)" placement="bottom">
          <el-button
            :size="buttonSize"
            :type="activeTool === 'angle' ? 'primary' : 'default'"
            @click="setActiveTool('angle')"
          >
            <el-icon><Sort /></el-icon>
            <span class="mobile-hidden ml-1">角度</span>
          </el-button>
        </el-tooltip>
        <el-tooltip content="面积测量 (快捷键: R)" placement="bottom">
          <el-button
            :size="buttonSize"
            :type="activeTool === 'area' ? 'primary' : 'default'"
            @click="setActiveTool('area')"
          >
            <el-icon><Grid /></el-icon>
            <span class="mobile-hidden ml-1">面积</span>
          </el-button>
        </el-tooltip>
      </el-button-group>
    </div>

    <el-divider direction="vertical" v-if="!isMobile" />

    <!-- 视图控制区域 -->
    <div class="toolbar-section" v-if="!isMobile || showSection === 'view'">
      <span class="section-title mobile-hidden">视图控制</span>
      <el-button-group class="button-group">
        <el-tooltip content="重置视图 (快捷键: R)" placement="bottom">
          <el-button :size="buttonSize" @click="resetView">
            <el-icon><Refresh /></el-icon>
            <span class="mobile-hidden ml-1">重置</span>
          </el-button>
        </el-tooltip>
        <el-tooltip content="适应窗口 (快捷键: F)" placement="bottom">
          <el-button :size="buttonSize" @click="fitToWindow">
            <el-icon><FullScreen /></el-icon>
            <span class="mobile-hidden ml-1">适应</span>
          </el-button>
        </el-tooltip>
        <el-tooltip content="反色显示 (快捷键: I)" placement="bottom">
          <el-button
            :size="buttonSize"
            @click="toggleInvert"
            :type="isInverted ? 'primary' : 'default'"
          >
            <el-icon><Switch /></el-icon>
            <span class="mobile-hidden ml-1">反色</span>
          </el-button>
        </el-tooltip>
        <el-tooltip content="图像信息 (快捷键: Ctrl+I)" placement="bottom">
          <el-button :size="buttonSize" @click="showImageInfo">
            <el-icon><InfoFilled /></el-icon>
            <span class="mobile-hidden ml-1">信息</span>
          </el-button>
        </el-tooltip>
      </el-button-group>
    </div>

    <!-- 移动端工具栏切换 -->
    <div v-if="isMobile" class="mobile-toolbar-switcher">
      <el-radio-group v-model="showSection" size="small">
        <el-radio-button label="file">文件</el-radio-button>
        <el-radio-button label="basic">基础</el-radio-button>
        <el-radio-button label="measure">测量</el-radio-button>
        <el-radio-button label="view">视图</el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
// ElMessage is auto-imported
import {
  FolderOpened,
  Download,
  Rank,
  ZoomIn,
  Operation,
  Minus,
  Sort,
  Grid,
  Refresh,
  FullScreen,
  Switch,
  InfoFilled
} from '@element-plus/icons-vue'

// Emits
const emit = defineEmits<{
  (e: 'tool-changed', tool: string): void
  (e: 'open-file'): void
  (e: 'save-image'): void
  (e: 'reset-view'): void
  (e: 'fit-to-window'): void
  (e: 'toggle-invert'): void
  (e: 'show-image-info'): void
}>()

// Props
interface Props {
  imageViewer?: any
  hasImage?: boolean
  isInverted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasImage: false,
  isInverted: false
})

// 响应式数据
const activeTool = ref<string>('pan')
const showSection = ref<string>('basic')
const isLoading = ref({
  openFile: false,
  saveImage: false
})

// 响应式设计
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const buttonSize = computed(() => isMobile.value ? 'small' : 'default')

// 键盘快捷键处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'i':
        event.preventDefault()
        showImageInfo()
        break
      case 'o':
        event.preventDefault()
        openFile()
        break
      case 's':
        event.preventDefault()
        saveImage()
        break
    }
  } else {
    switch (event.key.toLowerCase()) {
      case 'p':
        event.preventDefault()
        setActiveTool('pan')
        break
      case 'z':
        event.preventDefault()
        setActiveTool('zoom')
        break
      case 'w':
        event.preventDefault()
        setActiveTool('windowLevel')
        break
      case 'l':
        event.preventDefault()
        setActiveTool('length')
        break
      case 'a':
        event.preventDefault()
        setActiveTool('angle')
        break
      case 'r':
        if (event.shiftKey) {
          event.preventDefault()
          resetView()
        } else {
          event.preventDefault()
          setActiveTool('area')
        }
        break
      case 'f':
        event.preventDefault()
        fitToWindow()
        break
      case 'i':
        event.preventDefault()
        toggleInvert()
        break
    }
  }
}

// 设置激活工具
const setActiveTool = (tool: string) => {
  activeTool.value = tool
  ElMessage.info(`切换到${getToolName(tool)}工具`)

  // 通知父组件工具切换
  emit('tool-changed', tool)
}

// 获取工具名称
const getToolName = (tool: string): string => {
  const toolNames: Record<string, string> = {
    pan: '平移',
    zoom: '缩放',
    windowLevel: '窗宽窗位',
    length: '长度测量',
    angle: '角度测量',
    area: '面积测量'
  }
  return toolNames[tool] || tool
}

// 文件操作
const openFile = async () => {
  isLoading.value.openFile = true
  try {
    emit('openFile')
  } finally {
    setTimeout(() => {
      isLoading.value.openFile = false
    }, 1000)
  }
}

const saveImage = async () => {
  if (!props.hasImage) {
    ElMessage.warning('没有可保存的图像')
    return
  }

  isLoading.value.saveImage = true
  try {
    emit('saveImage')
  } finally {
    setTimeout(() => {
      isLoading.value.saveImage = false
    }, 1000)
  }
}

// 视图操作
const resetView = () => {
  emit('reset-view')
}

const fitToWindow = () => {
  emit('fit-to-window')
}

const toggleInvert = () => {
  emit('toggle-invert')
}

const showImageInfo = () => {
  emit('show-image-info')
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.toolbar-component {
  @apply flex items-center p-3 bg-white border-b border-gray-200 shadow-sm;
  transition: all 0.3s ease;
  min-height: 60px;
}

.toolbar-component.mobile-layout {
  @apply flex-col space-y-3 p-2;
}

.toolbar-section {
  @apply flex items-center space-x-2 flex-shrink-0;
}

.section-title {
  @apply text-xs text-gray-500 font-medium mr-2 whitespace-nowrap;
}

.button-group {
  @apply flex items-center;
}

.button-group .el-button {
  @apply text-xs transition-all duration-200;
}

.button-group .el-button:hover {
  @apply transform scale-105;
}

.button-group .el-button .el-icon {
  @apply transition-transform duration-200;
}

.mobile-toolbar-switcher {
  @apply w-full flex justify-center;
}

.el-divider--vertical {
  height: 30px;
  margin: 0 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-component:not(.mobile-layout) {
    @apply overflow-x-auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .toolbar-component:not(.mobile-layout)::-webkit-scrollbar {
    @apply hidden;
  }

  .mobile-hidden {
    @apply hidden;
  }

  .toolbar-section {
    @apply flex-shrink-0 mr-4;
  }
}

@media (max-width: 768px) {
  .toolbar-component {
    flex-wrap: wrap;
    height: auto;
    padding: 10px;
  }

  .toolbar-section {
    margin-bottom: 5px;
  }

  .el-divider--vertical {
    display: none;
  }
}
</style>
