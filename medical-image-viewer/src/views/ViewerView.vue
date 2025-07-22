<template>
  <div class="viewer-view bg-medical-bg-primary">
    <LayoutComponent>
      <template #main>
        <div class="viewer-content h-full flex flex-col">
          <!-- 工具栏 -->
          <div class="viewer-toolbar medical-toolbar">
            <ToolbarComponent 
              :image-viewer="imageViewerRef"
              @tool-changed="handleToolChanged"
              @open-file="handleOpenFile"
              @save-image="handleSaveImage"
              @reset-view="handleResetView"
              @fit-to-window="handleFitToWindow"
              @toggle-invert="handleToggleInvert"
              @show-image-info="handleShowImageInfo"
            />
          </div>
          
          <!-- 主要内容区域 -->
          <div class="viewer-main flex-1 flex overflow-hidden">
            <!-- 左侧文件列表 -->
            <div class="viewer-sidebar medical-sidebar w-80 flex flex-col">
              <!-- 文件列表 -->
              <div class="flex-1 min-h-0">
                <FileListComponent 
                  :file-manager="fileManager"
                  @file-selected="handleFileSelected"
                />
              </div>
            </div>

            <!-- 中间影像显示区域 -->
            <div class="viewer-canvas flex-1 medical-viewer relative">
              <ImageViewerComponent 
                ref="imageViewerRef"
                @image-loaded="handleImageLoaded"
              />
            </div>

            <!-- 右侧信息面板 -->
            <div class="viewer-info-panel medical-sidebar w-80 border-l border-medical-border">
              <div class="h-full flex flex-col">
                <!-- 文件信息面板 -->
                <div class="flex-1 min-h-0">
                  <FileInfoPanel 
                    :current-file="currentFile"
                    :file-manager="fileManager"
                    @refresh="handleRefreshFile"
                  />
                </div>

                <!-- 窗宽窗位控制 -->
                <div class="window-level-panel p-4 border-t border-medical-border bg-medical-bg-tertiary">
                  <h4 class="text-sm font-semibold text-medical-text-primary mb-3 flex items-center">
                    <el-icon class="mr-2 text-primary-400"><Operation /></el-icon>
                    窗宽窗位调节
                  </h4>
                  <div class="space-y-4">
                    <div>
                      <label class="text-xs text-medical-text-muted mb-2 block">窗宽: {{ windowWidth }}</label>
                      <el-slider 
                        v-model="windowWidth" 
                        :min="1" 
                        :max="4000" 
                        @change="handleWindowLevelChange"
                        size="small"
                      />
                    </div>
                    <div>
                      <label class="text-xs text-medical-text-muted mb-2 block">窗位: {{ windowCenter }}</label>
                      <el-slider 
                        v-model="windowCenter" 
                        :min="-2000" 
                        :max="2000" 
                        @change="handleWindowLevelChange"
                        size="small"
                      />
                    </div>
                    <div class="flex space-x-2">
                      <el-button size="small" @click="resetWindowLevel">重置</el-button>
                      <el-button size="small" @click="autoWindowLevel">自动</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </LayoutComponent>

    <!-- 图像信息对话框 -->
    <el-dialog
      v-model="showImageInfoDialog"
      title="影像详细信息"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentFile?.dicomImage" class="image-info-dialog">
        <el-tabs>
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="文件名">{{ currentFile.name }}</el-descriptions-item>
              <el-descriptions-item label="文件大小">{{ formatFileSize(currentFile.size) }}</el-descriptions-item>
              <el-descriptions-item label="图像尺寸">{{ currentFile.dicomImage.width }}×{{ currentFile.dicomImage.height }}</el-descriptions-item>
              <el-descriptions-item label="像素数据长度">{{ currentFile.dicomImage.pixelData.length }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="DICOM元数据" name="metadata">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="患者姓名">{{ currentFile.dicomImage.metadata.patientName || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="患者ID">{{ currentFile.dicomImage.metadata.patientId || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="检查日期">{{ currentFile.dicomImage.metadata.studyDate || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="模态">{{ currentFile.dicomImage.metadata.modality || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="检查描述">{{ currentFile.dicomImage.metadata.studyDescription || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="序列描述">{{ currentFile.dicomImage.metadata.seriesDescription || 'N/A' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="技术参数" name="technical">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="位深度">{{ currentFile.dicomImage.metadata.bitsAllocated || 'N/A' }}bit</el-descriptions-item>
              <el-descriptions-item label="存储位数">{{ currentFile.dicomImage.metadata.bitsStored || 'N/A' }}bit</el-descriptions-item>
              <el-descriptions-item label="像素间距">{{ currentFile.dicomImage.metadata.pixelSpacing?.join('×') || 'N/A' }}mm</el-descriptions-item>
              <el-descriptions-item label="层厚">{{ currentFile.dicomImage.metadata.sliceThickness || 'N/A' }}mm</el-descriptions-item>
              <el-descriptions-item label="窗宽">{{ getWindowWidth() }}</el-descriptions-item>
              <el-descriptions-item label="窗位">{{ getWindowCenter() }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <el-button @click="showImageInfoDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportImageInfo">导出信息</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import LayoutComponent from '@/components/layout/LayoutComponent.vue'
import ToolbarComponent from '@/components/tools/ToolbarComponent.vue'
import ImageViewerComponent from '@/components/viewer/ImageViewerComponent.vue'
import FileListComponent from '@/components/file/FileListComponent.vue'
import FileInfoPanel from '@/components/file/FileInfoPanel.vue'
import { FileManagerService, DicomFile } from '@/services/file/FileManagerService'
import { Operation } from '@element-plus/icons-vue'

// 响应式数据
const imageViewerRef = ref<InstanceType<typeof ImageViewerComponent>>()
const fileManager = new FileManagerService()
const currentFile = ref<DicomFile>()
const windowWidth = ref(400)
const windowCenter = ref(40)
const showImageInfoDialog = ref(false)

// 生命周期
onMounted(() => {
  // 监听文件管理器状态变化
  fileManager.addListener(handleFileManagerStateChange)
})

onUnmounted(() => {
  fileManager.removeListener(handleFileManagerStateChange)
})

// 处理文件管理器状态变化
const handleFileManagerStateChange = (state: any) => {
  const current = fileManager.getCurrentFile()
  if (current !== currentFile.value) {
    currentFile.value = current
    
    // 如果有新的当前文件且已加载，显示在查看器中
    if (current?.dicomImage && imageViewerRef.value) {
      imageViewerRef.value.loadDicomImage(current.dicomImage)
      
      // 更新窗宽窗位
      const metadata = current.dicomImage.metadata
      const wc = Array.isArray(metadata.windowCenter) 
        ? metadata.windowCenter[0] 
        : metadata.windowCenter || 128
      const ww = Array.isArray(metadata.windowWidth) 
        ? metadata.windowWidth[0] 
        : metadata.windowWidth || 256
      
      windowCenter.value = wc
      windowWidth.value = ww
    }
  }
}

// 工具栏事件处理
const handleToolChanged = (tool: string) => {
  console.log('工具切换:', tool)
  // TODO: 实现工具切换逻辑
}

const handleOpenFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dcm,.dicom'
  input.multiple = true

  input.onchange = async (event) => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      try {
        await fileManager.addFiles(files)
        ElMessage.success(`成功添加 ${files.length} 个文件`)
      } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '添加文件失败')
      }
    }
  }

  input.click()
}

const handleSaveImage = () => {
  if (!currentFile.value?.dicomImage) {
    ElMessage.warning('没有可保存的图像')
    return
  }

  // 创建下载链接
  const canvas = currentFile.value.dicomImage.canvas
  if (canvas) {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${currentFile.value!.name}.png`
        link.click()
        URL.revokeObjectURL(url)
        ElMessage.success('图像已保存')
      }
    })
  }
}

const handleResetView = () => {
  imageViewerRef.value?.resetView()
}

const handleFitToWindow = () => {
  imageViewerRef.value?.fitToWindow()
}

const handleToggleInvert = () => {
  imageViewerRef.value?.invert()
}

const handleShowImageInfo = () => {
  if (currentFile.value?.dicomImage) {
    showImageInfoDialog.value = true
  } else {
    ElMessage.warning('没有可显示的图像信息')
  }
}

// 文件选择处理
const handleFileSelected = (fileId: string) => {
  console.log('选择文件:', fileId)
}

// 图像加载处理
const handleImageLoaded = (dicomImage: any) => {
  console.log('图像已加载:', dicomImage)
}

// 刷新文件
const handleRefreshFile = (fileId: string) => {
  ElMessage.info('刷新文件功能开发中...')
}

// 窗宽窗位变化处理
const handleWindowLevelChange = () => {
  if (imageViewerRef.value) {
    imageViewerRef.value.applyWindowLevel(windowCenter.value, windowWidth.value)
  }
}

// 重置窗宽窗位
const resetWindowLevel = () => {
  if (currentFile.value?.dicomImage) {
    const metadata = currentFile.value.dicomImage.metadata
    const wc = Array.isArray(metadata.windowCenter) 
      ? metadata.windowCenter[0] 
      : metadata.windowCenter || 128
    const ww = Array.isArray(metadata.windowWidth) 
      ? metadata.windowWidth[0] 
      : metadata.windowWidth || 256
    
    windowCenter.value = wc
    windowWidth.value = ww
    handleWindowLevelChange()
  }
}

// 自动窗宽窗位
const autoWindowLevel = () => {
  ElMessage.info('自动窗宽窗位功能开发中...')
}

// 获取窗宽
const getWindowWidth = (): string => {
  if (!currentFile.value?.dicomImage) return 'N/A'
  const ww = currentFile.value.dicomImage.metadata.windowWidth
  if (Array.isArray(ww)) {
    return ww.join(', ')
  }
  return ww?.toString() || 'N/A'
}

// 获取窗位
const getWindowCenter = (): string => {
  if (!currentFile.value?.dicomImage) return 'N/A'
  const wc = currentFile.value.dicomImage.metadata.windowCenter
  if (Array.isArray(wc)) {
    return wc.join(', ')
  }
  return wc?.toString() || 'N/A'
}

// 导出图像信息
const exportImageInfo = () => {
  if (currentFile.value) {
    const info = fileManager.exportFileInfo(currentFile.value.id)
    if (info) {
      const dataStr = JSON.stringify(info, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `${currentFile.value.name}_info.json`
      link.click()
      
      URL.revokeObjectURL(link.href)
      ElMessage.success('图像信息已导出')
    }
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  return FileManagerService.formatFileSize(bytes)
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

.window-level-panel {
  flex-shrink: 0;
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

.image-info-dialog {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
