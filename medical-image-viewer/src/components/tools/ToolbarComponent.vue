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

// 当前激活的工具
const activeTool = ref<string>('pan')

// 设置激活工具
const setActiveTool = (tool: string) => {
  activeTool.value = tool
  ElMessage.info(`切换到${getToolName(tool)}工具`)
  // TODO: 通知工具管理器切换工具
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
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dcm,.dicom'
  input.multiple = false

  input.onchange = event => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      ElMessage.success(`选择文件: ${files[0].name}`)
      // TODO: 加载DICOM文件
    }
  }

  input.click()
}

const saveImage = () => {
  ElMessage.info('保存功能开发中...')
  // TODO: 实现图像保存功能
}

// 视图操作
const resetView = () => {
  ElMessage.info('重置视图')
  // TODO: 重置视口到初始状态
}

const fitToWindow = () => {
  ElMessage.info('适应窗口')
  // TODO: 调整图像适应窗口大小
}

const toggleInvert = () => {
  ElMessage.info('切换反色')
  // TODO: 切换图像反色显示
}

const showImageInfo = () => {
  ElMessage.info('显示影像信息')
  // TODO: 显示详细的影像信息对话框
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
