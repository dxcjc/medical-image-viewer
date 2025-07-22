<template>
  <div class="toolbar-component h-full flex items-center justify-between px-6 py-3">
    <!-- 左侧工具组 -->
    <div class="flex items-center space-x-6">
      <!-- 文件操作 -->
      <div class="toolbar-section">
        <span class="section-title">文件</span>
        <div class="flex items-center space-x-2">
          <el-tooltip content="打开DICOM文件" placement="bottom">
            <button class="toolbar-button" @click="openFile">
              <el-icon><FolderOpened /></el-icon>
              <span class="hidden sm:inline ml-1">打开</span>
            </button>
          </el-tooltip>
          <el-tooltip content="保存影像" placement="bottom">
            <button class="toolbar-button" @click="saveImage">
              <el-icon><Download /></el-icon>
              <span class="hidden sm:inline ml-1">保存</span>
            </button>
          </el-tooltip>
        </div>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 基础工具 -->
      <div class="toolbar-section">
        <span class="section-title">基础工具</span>
        <div class="flex items-center space-x-1">
          <el-tooltip content="平移工具" placement="bottom">
            <button
              class="toolbar-button"
              :class="{ 'toolbar-button-active': activeTool === 'pan' }"
              @click="setActiveTool('pan')"
            >
              <el-icon><Rank /></el-icon>
              <span class="hidden md:inline ml-1">平移</span>
            </button>
          </el-tooltip>
          <el-tooltip content="缩放工具" placement="bottom">
            <button
              class="toolbar-button"
              :class="{ 'toolbar-button-active': activeTool === 'zoom' }"
              @click="setActiveTool('zoom')"
            >
              <el-icon><ZoomIn /></el-icon>
              <span class="hidden md:inline ml-1">缩放</span>
            </button>
          </el-tooltip>
          <el-tooltip content="窗宽窗位" placement="bottom">
            <button
              class="toolbar-button"
              :class="{ 'toolbar-button-active': activeTool === 'windowLevel' }"
              @click="setActiveTool('windowLevel')"
            >
              <el-icon><Operation /></el-icon>
              <span class="hidden md:inline ml-1">窗宽窗位</span>
            </button>
          </el-tooltip>
        </div>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 测量工具 -->
      <div class="toolbar-section">
        <span class="section-title">测量工具</span>
        <div class="flex items-center space-x-1">
          <el-tooltip content="长度测量" placement="bottom">
            <button
              class="toolbar-button"
              :class="{ 'toolbar-button-active': activeTool === 'length' }"
              @click="setActiveTool('length')"
            >
              <el-icon><Minus /></el-icon>
              <span class="hidden lg:inline ml-1">长度</span>
            </button>
          </el-tooltip>
          <el-tooltip content="角度测量" placement="bottom">
            <button
              class="toolbar-button"
              :class="{ 'toolbar-button-active': activeTool === 'angle' }"
              @click="setActiveTool('angle')"
            >
              <el-icon><Sort /></el-icon>
              <span class="hidden lg:inline ml-1">角度</span>
            </button>
          </el-tooltip>
          <el-tooltip content="面积测量" placement="bottom">
            <button
              class="toolbar-button"
              :class="{ 'toolbar-button-active': activeTool === 'area' }"
              @click="setActiveTool('area')"
            >
              <el-icon><Grid /></el-icon>
              <span class="hidden lg:inline ml-1">面积</span>
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 右侧工具组 -->
    <div class="flex items-center space-x-4">
      <!-- 视图控制 -->
      <div class="toolbar-section">
        <span class="section-title">视图</span>
        <div class="flex items-center space-x-1">
          <el-tooltip content="重置视图" placement="bottom">
            <button class="toolbar-button" @click="resetView">
              <el-icon><Refresh /></el-icon>
              <span class="hidden lg:inline ml-1">重置</span>
            </button>
          </el-tooltip>
          <el-tooltip content="适应窗口" placement="bottom">
            <button class="toolbar-button" @click="fitToWindow">
              <el-icon><FullScreen /></el-icon>
              <span class="hidden lg:inline ml-1">适应</span>
            </button>
          </el-tooltip>
          <el-tooltip content="反色显示" placement="bottom">
            <button class="toolbar-button" @click="toggleInvert">
              <el-icon><Switch /></el-icon>
              <span class="hidden lg:inline ml-1">反色</span>
            </button>
          </el-tooltip>
        </div>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 信息显示 -->
      <div class="toolbar-section">
        <el-tooltip content="显示影像信息" placement="bottom">
          <button class="toolbar-button" @click="showImageInfo">
            <el-icon><InfoFilled /></el-icon>
            <span class="hidden lg:inline ml-1">信息</span>
          </button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
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
  toolChanged: [tool: string]
  openFile: []
  saveImage: []
  resetView: []
  fitToWindow: []
  toggleInvert: []
  showImageInfo: []
}>()

// Props
interface Props {
  imageViewer?: any
}

const props = defineProps<Props>()

// 当前激活的工具
const activeTool = ref<string>('pan')

// 设置激活工具
const setActiveTool = (tool: string) => {
  activeTool.value = tool
  ElMessage.info(`切换到${getToolName(tool)}工具`)

  // 通知父组件工具切换
  emit('toolChanged', tool)
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
const openFile = () => {
  emit('openFile')
}

const saveImage = () => {
  emit('saveImage')
}

// 视图操作
const resetView = () => {
  emit('resetView')
}

const fitToWindow = () => {
  emit('fitToWindow')
}

const toggleInvert = () => {
  emit('toggleInvert')
}

const showImageInfo = () => {
  emit('showImageInfo')
}
</script>

<style scoped>
.toolbar-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.section-title {
  font-size: 10px;
  color: var(--medical-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.toolbar-button {
  @apply px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--medical-text-secondary);
}

.toolbar-button:hover {
  @apply transform scale-105;
  background: rgba(255, 255, 255, 0.1);
  color: var(--medical-text-primary);
  border-color: rgba(14, 165, 233, 0.3);
}

.toolbar-button-active {
  @apply text-primary-400;
  background: rgba(14, 165, 233, 0.15);
  border-color: rgba(14, 165, 233, 0.4);
  box-shadow: 0 0 12px rgba(14, 165, 233, 0.3);
}

.toolbar-button-active:hover {
  background: rgba(14, 165, 233, 0.2);
  box-shadow: 0 0 16px rgba(14, 165, 233, 0.4);
}

.toolbar-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .section-title {
    font-size: 9px;
  }
}

@media (max-width: 768px) {
  .toolbar-component {
    @apply flex-wrap gap-4 p-4;
    height: auto;
  }

  .toolbar-divider {
    @apply hidden;
  }

  .toolbar-section {
    @apply flex-row items-center gap-2;
  }

  .section-title {
    @apply hidden;
  }
}
</style>
