<template>
  <div class="viewer-view bg-medical-bg-primary">
    <LayoutComponent>
      <template #main>
        <div class="viewer-content h-full flex flex-col">
          <!-- 工具栏 -->
          <div class="viewer-toolbar medical-toolbar">
            <ToolbarComponent />
          </div>

          <!-- 主要内容区域 -->
          <div class="viewer-main flex-1 flex overflow-hidden">
            <!-- 左侧信息面板 -->
            <div class="viewer-sidebar medical-sidebar w-80 p-4 space-y-4 overflow-y-auto">
              <!-- 影像信息卡片 -->
              <div class="medical-card animate-slide-in-left">
                <div class="p-4 border-b border-medical-border">
                  <h3 class="text-lg font-semibold text-medical-text-primary flex items-center">
                    <el-icon class="mr-2 text-primary-400"><Document /></el-icon>
                    影像信息
                  </h3>
                </div>
                <div class="p-4">
                  <div v-if="!hasImageData" class="text-center py-8">
                    <el-icon class="text-4xl text-medical-text-muted mb-3"><Picture /></el-icon>
                    <p class="text-medical-text-muted">暂无影像数据</p>
                    <el-button type="primary" size="small" class="mt-3" @click="uploadFile">
                      <el-icon><Upload /></el-icon>
                      上传DICOM
                    </el-button>
                  </div>
                  <div v-else class="space-y-3">
                    <div v-for="info in imageInfo" :key="info.label" class="flex justify-between">
                      <span class="text-medical-text-muted">{{ info.label }}:</span>
                      <span class="text-medical-text-primary">{{ info.value }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 工具面板 -->
              <div class="medical-card animate-slide-in-left" style="animation-delay: 0.1s;">
                <div class="p-4 border-b border-medical-border">
                  <h3 class="text-lg font-semibold text-medical-text-primary flex items-center">
                    <el-icon class="mr-2 text-primary-400"><Operation /></el-icon>
                    工具面板
                  </h3>
                </div>
                <div class="p-4 space-y-3">
                  <div v-for="tool in toolPanels" :key="tool.name"
                       class="p-3 rounded-lg bg-medical-bg-tertiary border border-medical-border hover:bg-medical-hover transition-colors cursor-pointer">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <el-icon class="text-primary-400"><component :is="tool.icon" /></el-icon>
                        <span class="text-medical-text-primary">{{ tool.name }}</span>
                      </div>
                      <el-switch v-model="tool.active" size="small" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 设置面板 -->
              <div class="medical-card animate-slide-in-left" style="animation-delay: 0.2s;">
                <div class="p-4 border-b border-medical-border">
                  <h3 class="text-lg font-semibold text-medical-text-primary flex items-center">
                    <el-icon class="mr-2 text-primary-400"><Setting /></el-icon>
                    显示设置
                  </h3>
                </div>
                <div class="p-4 space-y-4">
                  <div>
                    <label class="text-sm text-medical-text-muted mb-2 block">窗宽</label>
                    <el-slider v-model="windowWidth" :min="1" :max="4000" />
                  </div>
                  <div>
                    <label class="text-sm text-medical-text-muted mb-2 block">窗位</label>
                    <el-slider v-model="windowCenter" :min="-2000" :max="2000" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧影像显示区域 -->
            <div class="viewer-canvas flex-1 medical-viewer relative">
              <ImageViewerComponent />
            </div>
          </div>
        </div>
      </template>
    </LayoutComponent>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import LayoutComponent from '@/components/layout/LayoutComponent.vue'
import ToolbarComponent from '@/components/tools/ToolbarComponent.vue'
import ImageViewerComponent from '@/components/viewer/ImageViewerComponent.vue'
import {
  Document,
  Picture,
  Upload,
  Operation,
  Setting,
  Rank,
  ZoomIn,
  Minus,
  Grid
} from '@element-plus/icons-vue'

// 响应式数据
const hasImageData = ref(false)
const windowWidth = ref(400)
const windowCenter = ref(40)

// 影像信息
const imageInfo = ref([
  { label: '患者姓名', value: '张三' },
  { label: '检查日期', value: '2024-01-15' },
  { label: '影像尺寸', value: '512 x 512' },
  { label: '像素间距', value: '0.5mm' },
  { label: '层厚', value: '1.0mm' }
])

// 工具面板
const toolPanels = ref([
  { name: '窗宽窗位', icon: 'Rank', active: false },
  { name: '缩放工具', icon: 'ZoomIn', active: false },
  { name: '测量工具', icon: 'Minus', active: false },
  { name: '标注工具', icon: 'Grid', active: false }
])

const uploadFile = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dcm,.dicom'
  input.multiple = true

  input.onchange = event => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      ElMessage.success(`成功选择 ${files.length} 个DICOM文件`)
      hasImageData.value = true
      // TODO: 处理文件上传逻辑
      console.log('选择的文件:', files)
    }
  }

  input.click()
}
</script>

<style scoped>
.viewer-view {
  height: 100vh;
}

.viewer-toolbar {
  height: 64px;
  border-bottom: 1px solid var(--medical-border);
}

.viewer-main {
  height: calc(100vh - 128px); /* 减去头部和工具栏高度 */
}

.viewer-sidebar {
  min-height: 0; /* 允许flex子项收缩 */
}

.viewer-canvas {
  background: radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%);
  position: relative;
  overflow: hidden;
}

/* 自定义滚动条 */
.viewer-sidebar::-webkit-scrollbar {
  width: 6px;
}

.viewer-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.viewer-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.viewer-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
