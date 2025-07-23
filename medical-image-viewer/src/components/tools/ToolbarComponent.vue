<template>
  <div class="toolbar-component">
    <div class="toolbar-section">
      <span class="section-title">文件</span>
      <el-button-group>
        <el-button size="small" @click="openFile">
          <el-icon><FolderOpened /></el-icon>
          打开
        </el-button>
        <el-button size="small" @click="saveImage">
          <el-icon><Download /></el-icon>
          保存
        </el-button>
      </el-button-group>
    </div>

    <el-divider direction="vertical" />

    <div class="toolbar-section">
      <span class="section-title">工具</span>
      <el-button-group>
        <el-button
          size="small"
          :type="activeTool === 'pan' ? 'primary' : 'default'"
          @click="setActiveTool('pan')"
        >
          <el-icon><Rank /></el-icon>
          平移
        </el-button>
        <el-button
          size="small"
          :type="activeTool === 'zoom' ? 'primary' : 'default'"
          @click="setActiveTool('zoom')"
        >
          <el-icon><ZoomIn /></el-icon>
          缩放
        </el-button>
        <el-button
          size="small"
          :type="activeTool === 'windowLevel' ? 'primary' : 'default'"
          @click="setActiveTool('windowLevel')"
        >
          <el-icon><Operation /></el-icon>
          窗宽窗位
        </el-button>
      </el-button-group>
    </div>

    <el-divider direction="vertical" />

    <div class="toolbar-section">
      <span class="section-title">测量</span>
      <el-button-group>
        <el-button
          size="small"
          :type="activeTool === 'length' ? 'primary' : 'default'"
          @click="setActiveTool('length')"
        >
          <el-icon><Minus /></el-icon>
          长度
        </el-button>
        <el-button
          size="small"
          :type="activeTool === 'angle' ? 'primary' : 'default'"
          @click="setActiveTool('angle')"
        >
          <el-icon><Sort /></el-icon>
          角度
        </el-button>
        <el-button
          size="small"
          :type="activeTool === 'area' ? 'primary' : 'default'"
          @click="setActiveTool('area')"
        >
          <el-icon><Grid /></el-icon>
          面积
        </el-button>
      </el-button-group>
    </div>

    <el-divider direction="vertical" />

    <div class="toolbar-section">
      <span class="section-title">视图</span>
      <el-button-group>
        <el-button size="small" @click="resetView">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button size="small" @click="fitToWindow">
          <el-icon><FullScreen /></el-icon>
          适应窗口
        </el-button>
        <el-button size="small" @click="toggleInvert">
          <el-icon><Switch /></el-icon>
          反色
        </el-button>
      </el-button-group>
    </div>

    <div class="toolbar-spacer" />

    <div class="toolbar-section">
      <span class="section-title">信息</span>
      <el-button size="small" @click="showImageInfo">
        <el-icon><InfoFilled /></el-icon>
        影像信息
      </el-button>
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
}

const props = defineProps<Props>()

// 当前激活的工具
const activeTool = ref<string>('pan')

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
const openFile = () => {
  emit('open-file')
}

const saveImage = () => {
  emit('save-image')
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
</script>

<style scoped>
.toolbar-component {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 15px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-section {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.section-title {
  font-size: 12px;
  color: #606266;
  margin-right: 8px;
  white-space: nowrap;
}

.toolbar-spacer {
  flex: 1;
}

.el-divider--vertical {
  height: 30px;
  margin: 0 15px;
}

.el-button-group .el-button {
  margin: 0;
}

.el-button--small {
  padding: 5px 8px;
  font-size: 12px;
}

.el-button--small .el-icon {
  margin-right: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .section-title {
    display: none;
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
