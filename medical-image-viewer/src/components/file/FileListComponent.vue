<template>
  <div class="file-list-component h-full flex flex-col">
    <!-- 增强的头部操作栏 -->
    <header class="file-list-header" :class="headerClasses">
      <!-- 主标题区域 -->
      <div class="header-main">
        <div class="flex items-center justify-between">
          <div class="header-title-section">
            <h2 class="header-title">
              <el-icon class="header-icon"><FolderOpened /></el-icon>
              文件管理器
            </h2>
            <p class="header-subtitle">
              管理和查看DICOM医学影像文件
            </p>
          </div>

          <!-- 主要操作按钮 -->
          <div class="header-actions">
            <BaseButton
              variant="primary"
              :size="buttonSize"
              @click="uploadFiles"
              :loading="isUploading"
              shortcut="Ctrl+O"
              :show-shortcut="!isMobile"
              aria-label="上传DICOM文件"
            >
              <template #icon>
                <el-icon><Upload /></el-icon>
              </template>
              <span class="mobile-hidden">上传文件</span>
            </BaseButton>

            <!-- 更多操作菜单 -->
            <el-dropdown
              @command="handleMoreActions"
              trigger="click"
              placement="bottom-end"
            >
              <BaseButton
                variant="secondary"
                :size="buttonSize"
                aria-label="更多操作"
              >
                <template #icon>
                  <el-icon><MoreFilled /></el-icon>
                </template>
                <span class="mobile-hidden">更多</span>
              </BaseButton>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="batchUpload">
                    <el-icon><FolderOpened /></el-icon>
                    <span>批量上传</span>
                    <kbd class="dropdown-shortcut">Ctrl+Shift+O</kbd>
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="clearFiles"
                    :disabled="files.length === 0"
                  >
                    <el-icon><Delete /></el-icon>
                    <span>清空列表</span>
                    <kbd class="dropdown-shortcut">Ctrl+Shift+D</kbd>
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="exportList"
                    :disabled="files.length === 0"
                  >
                    <el-icon><Download /></el-icon>
                    <span>导出列表</span>
                    <kbd class="dropdown-shortcut">Ctrl+E</kbd>
                  </el-dropdown-item>
                  <el-dropdown-item command="refresh">
                    <el-icon><Refresh /></el-icon>
                    <span>刷新列表</span>
                    <kbd class="dropdown-shortcut">F5</kbd>
                  </el-dropdown-item>
                  <el-dropdown-item divided command="settings">
                    <el-icon><Setting /></el-icon>
                    <span>列表设置</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选栏 -->
      <div class="flex flex-col sm:flex-row gap-2 mb-3">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文件名或患者信息..."
          size="small"
          clearable
          @input="handleSearch"
          class="flex-1"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 筛选选项 -->
        <div class="flex items-center space-x-2">
          <el-select
            v-model="filterStatus"
            placeholder="状态"
            size="small"
            style="width: 100px"
            @change="handleFilterChange"
          >
            <el-option label="全部" value="all" />
            <el-option label="已加载" value="loaded" />
            <el-option label="加载中" value="loading" />
            <el-option label="错误" value="error" />
          </el-select>

          <el-select
            v-model="sortBy"
            placeholder="排序"
            size="small"
            style="width: 100px"
            @change="handleSortChange"
          >
            <el-option label="名称" value="name" />
            <el-option label="大小" value="size" />
            <el-option label="时间" value="time" />
          </el-select>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="text-xs text-medical-text-muted">
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <span>总计: {{ stats.total }}</span>
          <span>已加载: {{ stats.loaded }}</span>
          <span v-if="stats.loading > 0">加载中: {{ stats.loading }}</span>
          <span v-if="stats.error > 0" class="text-danger">错误: {{ stats.error }}</span>
          <span>大小: {{ formatFileSize(stats.totalSize) }}</span>
        </div>
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
    <div v-else class="file-list-content flex-1 overflow-hidden">
      <!-- 批量操作栏 -->
      <div v-if="selectedFiles.length > 0" class="batch-actions p-3 bg-primary-500/10 border-b border-medical-border">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span class="text-sm text-medical-text-primary">
            已选择 {{ selectedFiles.length }} 个文件
          </span>
          <div class="flex items-center space-x-2 w-full sm:w-auto">
            <el-button size="small" @click="batchDelete" class="flex-1 sm:flex-none">
              <el-icon><Delete /></el-icon>
              <span class="mobile-hidden ml-1">删除</span>
            </el-button>
            <el-button size="small" @click="batchExport" class="flex-1 sm:flex-none">
              <el-icon><Download /></el-icon>
              <span class="mobile-hidden ml-1">导出</span>
            </el-button>
            <el-button size="small" @click="clearSelection" class="flex-1 sm:flex-none">
              <span class="mobile-hidden">取消选择</span>
              <span class="mobile-sm-hidden">取消</span>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredFiles.length === 0" class="empty-state p-8 text-center">
        <el-icon class="text-4xl text-medical-text-muted mb-3"><Search /></el-icon>
        <p class="text-medical-text-muted">{{ searchQuery ? '未找到匹配的文件' : '暂无文件' }}</p>
        <el-button
          v-if="searchQuery"
          type="primary"
          @click="clearSearch"
          class="mt-3"
        >
          清除搜索
        </el-button>
      </div>

      <!-- 虚拟滚动文件列表 -->
      <div v-else class="file-items flex-1 overflow-hidden">
        <VirtualList
          :data="filteredFiles"
          :height="listHeight"
          :item-height="itemHeight"
          :buffer="3"
          key-field="id"
          class="file-virtual-list"
          @scroll="handleListScroll"
        >
          <template #default="{ item: file, index }">
            <div
              :key="file.id"
              class="file-item p-3 border-b border-medical-border hover:bg-medical-hover transition-all duration-200 cursor-pointer select-none"
              :class="{
                'file-item-active': file.id === currentFileId,
                'file-item-selected': selectedFiles.includes(file.id),
                'file-item-focus': focusedIndex === index
              }"
              @click="selectFile(file.id, $event)"
              @keydown="handleKeyDown($event, file.id, index)"
              @focus="focusedIndex = index"
              @blur="focusedIndex = -1"
              tabindex="0"
              :aria-selected="selectedFiles.includes(file.id)"
              :aria-label="`文件 ${file.name}, ${file.isLoading ? '加载中' : file.error ? '加载失败' : '已加载'}`"
              role="option"
            >
              <div class="flex items-start space-x-3">
                <!-- 文件图标 -->
                <div class="file-icon flex-shrink-0">
                  <div v-if="file.isLoading" class="w-8 h-8 md:w-10 md:h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <el-icon class="text-primary-400 animate-spin text-sm md:text-base"><Loading /></el-icon>
                  </div>
                  <div v-else-if="file.error" class="w-8 h-8 md:w-10 md:h-10 bg-danger-500/20 rounded-lg flex items-center justify-center">
                    <el-icon class="text-danger-400 text-sm md:text-base"><WarningFilled /></el-icon>
                  </div>
                  <div v-else class="w-8 h-8 md:w-10 md:h-10 bg-success-500/20 rounded-lg flex items-center justify-center">
                    <el-icon class="text-success-400 text-sm md:text-base"><Document /></el-icon>
                  </div>
                </div>

                <!-- 文件信息 -->
                <div class="file-info flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <div class="file-name text-sm font-medium text-medical-text-primary truncate pr-2">
                      {{ file.name }}
                    </div>
                    <div class="flex items-center space-x-1 flex-shrink-0">
                      <!-- 选择框 -->
                      <el-checkbox
                        :model-value="selectedFiles.includes(file.id)"
                        @change="toggleFileSelection(file.id)"
                        @click.stop
                        size="small"
                      />
                      <!-- 操作菜单 -->
                      <el-dropdown trigger="click" @command="handleFileAction" @click.stop>
                        <el-button size="small" text class="p-1">
                          <el-icon class="text-xs"><MoreFilled /></el-icon>
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

                  <div class="file-meta text-xs text-medical-text-muted space-y-1">
                    <div v-if="file.dicomImage?.metadata" class="flex flex-wrap gap-x-2">
                      <span class="truncate">患者: {{ file.dicomImage.metadata.patientName || 'Unknown' }}</span>
                      <span>{{ file.dicomImage.metadata.modality || 'N/A' }}</span>
                    </div>
                    <div class="flex flex-wrap gap-x-2">
                      <span>{{ formatFileSize(file.size) }}</span>
                      <span>{{ formatDate(file.lastModified) }}</span>
                    </div>
                  </div>

                  <!-- 错误信息 -->
                  <div v-if="file.error" class="error-message text-xs text-danger-400 mt-1 truncate">
                    {{ file.error }}
                  </div>

                  <!-- 加载进度 -->
                  <div v-if="file.isLoading" class="loading-progress mt-2">
                    <el-progress
                      :percentage="file.progress || 100"
                      :show-text="false"
                      size="small"
                      :status="file.progress ? 'success' : undefined"
                      :indeterminate="!file.progress"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </VirtualList>
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
// Vue APIs are auto-imported
// ElMessage and ElMessageBox are auto-imported
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
  Refresh,
  Download
} from '@element-plus/icons-vue'
import { FileManagerService, DicomFile } from '@/services/file/FileManagerService'
import { useWindowSize } from '@vueuse/core'
import VirtualList from '@/components/common/VirtualList.vue'

// Props
interface Props {
  fileManager: FileManagerService
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'file-selected', fileId: string): void
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
const filterStatus = ref('all')
const sortBy = ref('name')
const focusedIndex = ref(-1)

// 响应式设计
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const itemHeight = computed(() => isMobile.value ? 80 : 100)
const listHeight = ref(400)

// 计算属性
const stats = computed(() => props.fileManager.getFileStats())

// 生命周期
onMounted(() => {
  // 监听文件管理器状态变化
  props.fileManager.addListener(handleStateChange)

  // 初始化状态
  const state = props.fileManager.getState()
  handleStateChange(state)

  // 计算列表高度
  nextTick(() => {
    calculateListHeight()
  })

  // 监听窗口大小变化
  window.addEventListener('resize', calculateListHeight)
})

onUnmounted(() => {
  props.fileManager.removeListener(handleStateChange)
  window.removeEventListener('resize', calculateListHeight)
})

// 计算列表高度
const calculateListHeight = () => {
  const container = document.querySelector('.file-list-component')
  const header = document.querySelector('.file-list-header')
  const batchActions = document.querySelector('.batch-actions')

  if (container && header) {
    const containerHeight = container.clientHeight
    const headerHeight = header.clientHeight
    const batchActionsHeight = batchActions ? batchActions.clientHeight : 0
    listHeight.value = containerHeight - headerHeight - batchActionsHeight - 20 // 减去一些边距
  }
}

// 列表滚动处理
const handleListScroll = (scrollTop: number) => {
  // 可以在这里添加滚动相关的逻辑，比如懒加载等
}

// 处理状态变化
const handleStateChange = (state: any) => {
  files.value = state.files
  currentFileId.value = state.currentFileId
  handleSearch()
}

// 搜索和筛选处理
const handleSearch = () => {
  updateFilteredFiles()
}

const handleFilterChange = () => {
  updateFilteredFiles()
}

const handleSortChange = () => {
  updateFilteredFiles()
}

const updateFilteredFiles = () => {
  let result = files.value

  // 状态筛选
  if (filterStatus.value !== 'all') {
    result = result.filter(file => {
      switch (filterStatus.value) {
        case 'loaded': return !file.isLoading && !file.error
        case 'loading': return file.isLoading
        case 'error': return file.error
        default: return true
      }
    })
  }

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(file => {
      return file.name.toLowerCase().includes(query) ||
             file.dicomImage?.metadata?.patientName?.toLowerCase().includes(query) ||
             file.dicomImage?.metadata?.modality?.toLowerCase().includes(query)
    })
  }

  // 排序
  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return b.size - a.size
      case 'time':
        return b.lastModified - a.lastModified
      default:
        return 0
    }
  })

  filteredFiles.value = result
}

const clearSearch = () => {
  searchQuery.value = ''
  handleSearch()
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

// 更多操作处理
const handleMoreActions = (command: string) => {
  switch (command) {
    case 'batchUpload':
      batchUpload()
      break
    case 'clearFiles':
      clearFiles()
      break
    case 'exportList':
      exportFileList()
      break
    case 'refresh':
      refreshFileList()
      break
  }
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

// 键盘导航
const handleKeyDown = (event: KeyboardEvent, fileId: string, index: number) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectFile(fileId, event as any)
      break
    case 'ArrowDown':
      event.preventDefault()
      if (index < filteredFiles.value.length - 1) {
        const nextElement = event.currentTarget?.parentElement?.children[index + 1] as HTMLElement
        nextElement?.focus()
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (index > 0) {
        const prevElement = event.currentTarget?.parentElement?.children[index - 1] as HTMLElement
        prevElement?.focus()
      }
      break
    case 'Delete':
      event.preventDefault()
      removeFile(fileId)
      break
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
    emit('file-selected', fileId)
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

// 导出文件列表
const exportFileList = () => {
  try {
    const fileList = files.value.map(file => ({
      name: file.name,
      size: file.size,
      patientName: file.dicomImage?.metadata?.patientName || 'Unknown',
      modality: file.dicomImage?.metadata?.modality || 'N/A',
      lastModified: new Date(file.lastModified).toISOString()
    }))

    const blob = new Blob([JSON.stringify(fileList, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `file-list-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('文件列表已导出')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 刷新文件列表
const refreshFileList = () => {
  props.fileManager.refreshFiles()
  ElMessage.success('文件列表已刷新')
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
  @apply h-full flex flex-col bg-white;
}

.file-list-header {
  @apply bg-white border-b border-gray-200;
}

.drag-upload-area {
  @apply h-full flex items-center justify-center border-2 border-dashed border-gray-300 transition-all duration-300;
  min-height: 400px;
}

.drag-upload-area.drag-over {
  @apply border-primary-400 bg-primary-500/5;
}

.drag-upload-content {
  @apply text-center p-8;
}

.batch-actions {
  @apply sticky top-0 z-10 bg-primary-50;
}

.file-virtual-list {
  @apply h-full;
}

.file-item {
  @apply transition-all duration-200 ease-in-out;
  will-change: transform;
}

.file-item:hover {
  @apply bg-gray-50 shadow-sm;
}

.file-item-active {
  @apply bg-primary-50 border-l-4 border-primary-500;
}

.file-item-selected {
  @apply bg-blue-50 ring-2 ring-blue-200;
}

.file-item-focus {
  @apply ring-2 ring-primary-300 outline-none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-list-header {
    @apply p-3;
  }

  .file-item {
    @apply p-2;
  }

  .mobile-hidden {
    @apply hidden;
  }

  .mobile-full-width {
    @apply w-full;
  }
}

@media (max-width: 640px) {
  .mobile-sm-hidden {
    @apply hidden;
  }
}

/* 性能优化 */
.file-item {
  contain: layout style paint;
}

/* 无障碍访问 */
.file-item:focus {
  @apply outline-none ring-2 ring-primary-300;
}

/* 加载动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-progress {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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
