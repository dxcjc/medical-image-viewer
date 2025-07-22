<template>
  <div class="file-list-component">
    <!-- 头部操作栏 -->
    <div class="file-list-header p-4 border-b border-medical-border">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-medical-text-primary">文件列表</h3>
        <div class="flex items-center space-x-2">
          <el-tooltip content="上传DICOM文件" placement="top">
            <el-button type="primary" size="small" @click="uploadFiles">
              <el-icon><Upload /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="批量上传" placement="top">
          <el-button size="small" @click="batchUpload">
            <el-icon><FolderOpened /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="清空列表" placement="top">
            <el-button size="small" @click="clearFiles" :disabled="files.length === 0">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      
      <!-- 搜索框 -->
      <el-input
        v-model="searchQuery"
        placeholder="搜索文件名或患者信息..."
        size="small"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <!-- 统计信息 -->
      <div class="mt-3 text-xs text-medical-text-muted">
        总计: {{ stats.total }} 个文件 | 
        已加载: {{ stats.loaded }} | 
        加载中: {{ stats.loading }} | 
        错误: {{ stats.error }} |
        大小: {{ formatFileSize(stats.totalSize) }}
      </div>
    </div>

    <!-- 拖拽上传区域 -->
    <div
      v-if="files.length === 0"
      class="drag-upload-area"
      :class="{ 'drag-over': isDragOver }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <div class="drag-upload-content">
        <el-icon class="text-6xl text-primary-400 mb-4"><Upload /></el-icon>
        <h4 class="text-xl font-semibold text-medical-text-primary mb-2">拖拽上传DICOM文件</h4>
        <p class="text-medical-text-muted mb-4">将DICOM文件拖拽到此处，或点击选择文件</p>
        <el-button type="primary" @click="uploadFiles">
          <el-icon><FolderOpened /></el-icon>
          选择文件
        </el-button>
        <div class="mt-4 text-xs text-medical-text-muted">
          支持 .dcm, .dicom 格式 | 支持批量上传
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-else class="file-list-content flex-1 overflow-y-auto">
      <!-- 批量操作栏 -->
      <div v-if="selectedFiles.length > 0" class="batch-actions p-3 bg-primary-500/10 border-b border-medical-border">
        <div class="flex items-center justify-between">
          <span class="text-sm text-medical-text-primary">
            已选择 {{ selectedFiles.length }} 个文件
          </span>
          <div class="flex items-center space-x-2">
            <el-button size="small" @click="batchDelete">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button size="small" @click="batchExport">
              <el-icon><Download /></el-icon>
              批量导出
            </el-button>
            <el-button size="small" @click="clearSelection">
              取消选择
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="filteredFiles.length === 0" class="empty-state p-8 text-center">
        <el-icon class="text-4xl text-medical-text-muted mb-3"><Search /></el-icon>
        <p class="text-medical-text-muted">未找到匹配的文件</p>
        <el-button type="primary" @click="clearSearch" class="mt-3">
          清除搜索
        </el-button>
      </div>

      <div v-else class="file-items">
        <div
          v-for="file in filteredFiles"
          :key="file.id"
          class="file-item p-3 border-b border-medical-border hover:bg-medical-hover transition-colors cursor-pointer"
          :class="{
            'file-item-active': file.id === currentFileId,
            'file-item-selected': selectedFiles.includes(file.id)
          }"
          @click="selectFile(file.id, $event)"
        >
          <div class="flex items-start space-x-3">
            <!-- 文件图标 -->
            <div class="file-icon flex-shrink-0">
              <div v-if="file.isLoading" class="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <el-icon class="text-primary-400 animate-spin"><Loading /></el-icon>
              </div>
              <div v-else-if="file.error" class="w-10 h-10 bg-danger-500/20 rounded-lg flex items-center justify-center">
                <el-icon class="text-danger-400"><WarningFilled /></el-icon>
              </div>
              <div v-else class="w-10 h-10 bg-success-500/20 rounded-lg flex items-center justify-center">
                <el-icon class="text-success-400"><Document /></el-icon>
              </div>
            </div>

            <!-- 文件信息 -->
            <div class="file-info flex-1 min-w-0">
              <div class="file-name text-sm font-medium text-medical-text-primary truncate">
                {{ file.name }}
              </div>
              
              <div class="file-meta text-xs text-medical-text-muted mt-1 space-y-1">
                <div v-if="file.dicomImage?.metadata">
                  <span>患者: {{ file.dicomImage.metadata.patientName || 'Unknown' }}</span>
                  <span class="mx-2">|</span>
                  <span>{{ file.dicomImage.metadata.modality || 'N/A' }}</span>
                </div>
                <div>
                  <span>{{ formatFileSize(file.size) }}</span>
                  <span class="mx-2">|</span>
                  <span>{{ formatDate(file.lastModified) }}</span>
                </div>
              </div>

              <!-- 错误信息 -->
              <div v-if="file.error" class="error-message text-xs text-danger-400 mt-1">
                {{ file.error }}
              </div>

              <!-- 加载进度 -->
              <div v-if="file.isLoading" class="loading-progress mt-2">
                <el-progress :percentage="100" :show-text="false" size="small" status="success" :indeterminate="true" />
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="file-actions flex-shrink-0">
              <el-dropdown trigger="click" @command="handleFileAction">
                <el-button size="small" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'info', fileId: file.id }" :disabled="!file.dicomImage">
                      <el-icon><InfoFilled /></el-icon>
                      详细信息
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'reload', fileId: file.id }" v-if="file.error">
                      <el-icon><Refresh /></el-icon>
                      重新加载
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'remove', fileId: file.id }" divided>
                      <el-icon><Delete /></el-icon>
                      移除文件
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件信息对话框 -->
    <el-dialog
      v-model="showInfoDialog"
      title="文件详细信息"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedFileInfo" class="file-info-dialog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="文件名">{{ selectedFileInfo.fileName }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(selectedFileInfo.fileSize) }}</el-descriptions-item>
          <el-descriptions-item label="修改时间">{{ formatDate(new Date(selectedFileInfo.lastModified).getTime()) }}</el-descriptions-item>
          <el-descriptions-item label="图像尺寸">{{ selectedFileInfo.imageInfo.width }}×{{ selectedFileInfo.imageInfo.height }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="text-lg font-semibold text-medical-text-primary mt-6 mb-3">DICOM元数据</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="患者姓名">{{ selectedFileInfo.metadata.patientName || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="患者ID">{{ selectedFileInfo.metadata.patientId || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="检查日期">{{ selectedFileInfo.metadata.studyDate || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="检查时间">{{ selectedFileInfo.metadata.studyTime || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="模态">{{ selectedFileInfo.metadata.modality || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="检查描述">{{ selectedFileInfo.metadata.studyDescription || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="序列描述">{{ selectedFileInfo.metadata.seriesDescription || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="实例编号">{{ selectedFileInfo.metadata.instanceNumber || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="层厚">{{ selectedFileInfo.metadata.sliceThickness || 'N/A' }}mm</el-descriptions-item>
          <el-descriptions-item label="像素间距">{{ selectedFileInfo.metadata.pixelSpacing?.join('×') || 'N/A' }}mm</el-descriptions-item>
          <el-descriptions-item label="位深度">{{ selectedFileInfo.metadata.bitsAllocated || 'N/A' }}bit</el-descriptions-item>
          <el-descriptions-item label="窗宽/窗位">{{ selectedFileInfo.metadata.windowWidth || 'N/A' }}/{{ selectedFileInfo.metadata.windowCenter || 'N/A' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button @click="showInfoDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportFileInfo">导出信息</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  Delete,
  Search,
  FolderOpened,
  Loading,
  WarningFilled,
  Document,
  MoreFilled,
  InfoFilled,
  Refresh
} from '@element-plus/icons-vue'
import { FileManagerService, DicomFile } from '@/services/file/FileManagerService'

// Props
interface Props {
  fileManager: FileManagerService
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  fileSelected: [fileId: string]
}>()

// 响应式数据
const files = ref<DicomFile[]>([])
const currentFileId = ref<string>()
const searchQuery = ref('')
const filteredFiles = ref<DicomFile[]>([])
const showInfoDialog = ref(false)
const selectedFileInfo = ref<any>(null)
const selectedFiles = ref<string[]>([])
const isDragOver = ref(false)
const uploadProgress = ref<{ [key: string]: number }>({})
const isUploading = ref(false)

// 计算属性
const stats = computed(() => props.fileManager.getFileStats())

// 生命周期
onMounted(() => {
  // 监听文件管理器状态变化
  props.fileManager.addListener(handleStateChange)
  
  // 初始化状态
  const state = props.fileManager.getState()
  handleStateChange(state)
})

onUnmounted(() => {
  props.fileManager.removeListener(handleStateChange)
})

// 处理状态变化
const handleStateChange = (state: any) => {
  files.value = state.files
  currentFileId.value = state.currentFileId
  handleSearch()
}

// 搜索处理
const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    filteredFiles.value = files.value
  } else {
    filteredFiles.value = props.fileManager.searchFiles(searchQuery.value)
  }
}

// 拖拽处理
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  // 只有当离开整个拖拽区域时才设置为false
  if (!event.currentTarget?.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    await processFiles(files)
  }
}

// 上传文件
const uploadFiles = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dcm,.dicom'
  input.multiple = true

  input.onchange = async (event) => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      await processFiles(files)
    }
  }

  input.click()
}

// 批量上传
const batchUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dcm,.dicom'
  input.multiple = true
  input.webkitdirectory = true // 允许选择文件夹

  input.onchange = async (event) => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      await processFiles(files)
    }
  }

  input.click()
}

// 处理文件
const processFiles = async (fileList: FileList) => {
  const validFiles = Array.from(fileList).filter(file =>
    file.name.toLowerCase().endsWith('.dcm') ||
    file.name.toLowerCase().endsWith('.dicom') ||
    file.type === 'application/dicom'
  )

  if (validFiles.length === 0) {
    ElMessage.warning('未找到有效的DICOM文件')
    return
  }

  if (validFiles.length !== fileList.length) {
    ElMessage.warning(`过滤了 ${fileList.length - validFiles.length} 个非DICOM文件`)
  }

  isUploading.value = true

  try {
    // 显示上传进度
    const progressNotification = ElMessage({
      message: `正在上传 ${validFiles.length} 个文件...`,
      type: 'info',
      duration: 0,
      showClose: true
    })

    await props.fileManager.addFiles(validFiles)

    progressNotification.close()
    ElMessage.success(`成功添加 ${validFiles.length} 个文件`)

  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '添加文件失败')
  } finally {
    isUploading.value = false
  }
}

// 清空文件
const clearFiles = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有文件吗？', '确认操作', {
      type: 'warning'
    })
    
    props.fileManager.clearFiles()
    ElMessage.success('文件列表已清空')
  } catch {
    // 用户取消
  }
}

// 选择文件
const selectFile = (fileId: string, event?: MouseEvent) => {
  if (event?.ctrlKey || event?.metaKey) {
    // Ctrl/Cmd + 点击：多选
    toggleFileSelection(fileId)
  } else if (event?.shiftKey && selectedFiles.value.length > 0) {
    // Shift + 点击：范围选择
    selectFileRange(fileId)
  } else {
    // 普通点击：单选
    selectedFiles.value = []
    props.fileManager.setCurrentFile(fileId)
    emit('fileSelected', fileId)
  }
}

// 切换文件选择状态
const toggleFileSelection = (fileId: string) => {
  const index = selectedFiles.value.indexOf(fileId)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(fileId)
  }
}

// 范围选择文件
const selectFileRange = (endFileId: string) => {
  const startIndex = filteredFiles.value.findIndex(f => f.id === selectedFiles.value[selectedFiles.value.length - 1])
  const endIndex = filteredFiles.value.findIndex(f => f.id === endFileId)

  if (startIndex !== -1 && endIndex !== -1) {
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)

    for (let i = minIndex; i <= maxIndex; i++) {
      const fileId = filteredFiles.value[i].id
      if (!selectedFiles.value.includes(fileId)) {
        selectedFiles.value.push(fileId)
      }
    }
  }
}

// 清除选择
const clearSelection = () => {
  selectedFiles.value = []
}

// 批量删除
const batchDelete = async () => {
  if (selectedFiles.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？`,
      '批量删除',
      { type: 'warning' }
    )

    selectedFiles.value.forEach(fileId => {
      props.fileManager.removeFile(fileId)
    })

    selectedFiles.value = []
    ElMessage.success('批量删除完成')
  } catch {
    // 用户取消
  }
}

// 批量导出
const batchExport = () => {
  if (selectedFiles.value.length === 0) return

  const exportData = selectedFiles.value.map(fileId => {
    return props.fileManager.exportFileInfo(fileId)
  }).filter(info => info !== null)

  if (exportData.length === 0) {
    ElMessage.warning('没有可导出的文件信息')
    return
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `batch_export_${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(link.href)
  ElMessage.success(`已导出 ${exportData.length} 个文件的信息`)
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  handleSearch()
}

// 处理文件操作
const handleFileAction = async (command: { action: string; fileId: string }) => {
  const { action, fileId } = command
  
  switch (action) {
    case 'info':
      showFileInfo(fileId)
      break
    case 'reload':
      await reloadFile(fileId)
      break
    case 'remove':
      await removeFile(fileId)
      break
  }
}

// 显示文件信息
const showFileInfo = (fileId: string) => {
  selectedFileInfo.value = props.fileManager.exportFileInfo(fileId)
  if (selectedFileInfo.value) {
    showInfoDialog.value = true
  } else {
    ElMessage.warning('文件信息不可用')
  }
}

// 重新加载文件
const reloadFile = async (fileId: string) => {
  // 这里需要重新选择文件，实际项目中可能需要缓存原始文件
  ElMessage.info('请重新选择文件进行加载')
  uploadFiles()
}

// 移除文件
const removeFile = async (fileId: string) => {
  try {
    await ElMessageBox.confirm('确定要移除这个文件吗？', '确认操作', {
      type: 'warning'
    })
    
    props.fileManager.removeFile(fileId)
    ElMessage.success('文件已移除')
  } catch {
    // 用户取消
  }
}

// 导出文件信息
const exportFileInfo = () => {
  if (selectedFileInfo.value) {
    const dataStr = JSON.stringify(selectedFileInfo.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `${selectedFileInfo.value.fileName}_info.json`
    link.click()
    
    URL.revokeObjectURL(link.href)
    ElMessage.success('文件信息已导出')
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  return FileManagerService.formatFileSize(bytes)
}

// 格式化日期
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped>
.file-list-component {
  @apply h-full flex flex-col bg-medical-bg-secondary;
}

.drag-upload-area {
  @apply h-full flex items-center justify-center border-2 border-dashed border-medical-border transition-all duration-300;
  min-height: 400px;
}

.drag-upload-area.drag-over {
  @apply border-primary-400 bg-primary-500/5;
}

.drag-upload-content {
  @apply text-center p-8;
}

.batch-actions {
  @apply sticky top-0 z-10;
}

.file-item {
  position: relative;
  user-select: none;
}

.file-item-active {
  @apply bg-primary-500/10 border-l-2 border-l-primary-500;
}

.file-item-selected {
  @apply bg-success-500/10 border-l-2 border-l-success-500;
}

.file-item-active.file-item-selected {
  @apply bg-gradient-to-r from-primary-500/10 to-success-500/10;
  border-left: 2px solid;
  border-image: linear-gradient(180deg, #0ea5e9, #10b981) 1;
}

.file-item-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #0ea5e9, #06b6d4);
}

.file-item-selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #10b981, #059669);
}

.empty-state {
  @apply flex flex-col items-center justify-center h-full;
}

.file-info-dialog {
  max-height: 60vh;
  overflow-y: auto;
}

/* 上传进度动画 */
.upload-progress {
  @apply relative overflow-hidden;
}

.upload-progress::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* 拖拽提示动画 */
.drag-upload-area .drag-upload-content {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 文件选择动画 */
.file-item {
  transition: all 0.2s ease;
}

.file-item:hover {
  transform: translateX(2px);
}

.file-item-selected {
  animation: selectPulse 0.3s ease;
}

@keyframes selectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
</style>
