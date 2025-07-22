<template>
  <div class="file-info-panel">
    <!-- 无文件状态 -->
    <div v-if="!currentFile" class="empty-state p-6 text-center">
      <el-icon class="text-4xl text-medical-text-muted mb-3"><Document /></el-icon>
      <p class="text-medical-text-muted">请选择一个DICOM文件查看详细信息</p>
    </div>

    <!-- 文件信息 -->
    <div v-else class="file-info-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <div class="section-header">
          <h4 class="text-lg font-semibold text-medical-text-primary flex items-center">
            <el-icon class="mr-2 text-primary-400"><Document /></el-icon>
            文件信息
          </h4>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <label>文件名</label>
              <span class="truncate" :title="currentFile.name">{{ currentFile.name }}</span>
            </div>
            <div class="info-item">
              <label>文件大小</label>
              <span>{{ formatFileSize(currentFile.size) }}</span>
            </div>
            <div class="info-item">
              <label>修改时间</label>
              <span>{{ formatDate(currentFile.lastModified) }}</span>
            </div>
            <div class="info-item">
              <label>状态</label>
              <span class="flex items-center">
                <el-icon v-if="currentFile.isLoading" class="text-primary-400 animate-spin mr-1"><Loading /></el-icon>
                <el-icon v-else-if="currentFile.error" class="text-danger-400 mr-1"><WarningFilled /></el-icon>
                <el-icon v-else class="text-success-400 mr-1"><CircleCheckFilled /></el-icon>
                {{ getFileStatus(currentFile) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- DICOM元数据 -->
      <div v-if="currentFile.dicomImage?.metadata" class="info-section">
        <div class="section-header">
          <h4 class="text-lg font-semibold text-medical-text-primary flex items-center">
            <el-icon class="mr-2 text-primary-400"><User /></el-icon>
            患者信息
          </h4>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <label>患者姓名</label>
              <span>{{ metadata.patientName || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>患者ID</label>
              <span>{{ metadata.patientId || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 检查信息 -->
      <div v-if="currentFile.dicomImage?.metadata" class="info-section">
        <div class="section-header">
          <h4 class="text-lg font-semibold text-medical-text-primary flex items-center">
            <el-icon class="mr-2 text-primary-400"><Calendar /></el-icon>
            检查信息
          </h4>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <label>检查日期</label>
              <span>{{ formatStudyDate(metadata.studyDate) || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>检查时间</label>
              <span>{{ formatStudyTime(metadata.studyTime) || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>模态</label>
              <span class="modality-tag">{{ metadata.modality || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>检查描述</label>
              <span>{{ metadata.studyDescription || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>序列描述</label>
              <span>{{ metadata.seriesDescription || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>实例编号</label>
              <span>{{ metadata.instanceNumber || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 图像参数 -->
      <div v-if="currentFile.dicomImage?.metadata" class="info-section">
        <div class="section-header">
          <h4 class="text-lg font-semibold text-medical-text-primary flex items-center">
            <el-icon class="mr-2 text-primary-400"><Picture /></el-icon>
            图像参数
          </h4>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <label>图像尺寸</label>
              <span>{{ metadata.columns }}×{{ metadata.rows }}</span>
            </div>
            <div class="info-item">
              <label>像素间距</label>
              <span>{{ metadata.pixelSpacing?.join('×') || 'N/A' }}mm</span>
            </div>
            <div class="info-item">
              <label>层厚</label>
              <span>{{ metadata.sliceThickness || 'N/A' }}mm</span>
            </div>
            <div class="info-item">
              <label>位深度</label>
              <span>{{ metadata.bitsAllocated || 'N/A' }}bit</span>
            </div>
            <div class="info-item">
              <label>存储位数</label>
              <span>{{ metadata.bitsStored || 'N/A' }}bit</span>
            </div>
            <div class="info-item">
              <label>采样数</label>
              <span>{{ metadata.samplesPerPixel || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>光度解释</label>
              <span>{{ metadata.photometricInterpretation || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 窗宽窗位 -->
      <div v-if="currentFile.dicomImage?.metadata" class="info-section">
        <div class="section-header">
          <h4 class="text-lg font-semibold text-medical-text-primary flex items-center">
            <el-icon class="mr-2 text-primary-400"><Operation /></el-icon>
            显示参数
          </h4>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <label>窗宽</label>
              <span>{{ getWindowWidth() }}</span>
            </div>
            <div class="info-item">
              <label>窗位</label>
              <span>{{ getWindowCenter() }}</span>
            </div>
            <div class="info-item">
              <label>重缩放斜率</label>
              <span>{{ metadata.rescaleSlope || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>重缩放截距</label>
              <span>{{ metadata.rescaleIntercept || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section p-4 border-t border-medical-border">
        <div class="flex flex-col space-y-2">
          <el-button type="primary" size="small" @click="exportInfo" :disabled="!currentFile.dicomImage">
            <el-icon><Download /></el-icon>
            导出信息
          </el-button>
          <el-button size="small" @click="copyInfo" :disabled="!currentFile.dicomImage">
            <el-icon><CopyDocument /></el-icon>
            复制信息
          </el-button>
          <el-button size="small" @click="refreshFile" :disabled="currentFile.isLoading">
            <el-icon><Refresh /></el-icon>
            刷新文件
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Loading,
  WarningFilled,
  CircleCheckFilled,
  User,
  Calendar,
  Picture,
  Operation,
  Download,
  CopyDocument,
  Refresh
} from '@element-plus/icons-vue'
import { DicomFile, FileManagerService } from '@/services/file/FileManagerService'

// Props
interface Props {
  currentFile?: DicomFile
  fileManager: FileManagerService
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  refresh: [fileId: string]
}>()

// 计算属性
const metadata = computed(() => props.currentFile?.dicomImage?.metadata || {})

// 获取文件状态
const getFileStatus = (file: DicomFile): string => {
  if (file.isLoading) return '加载中'
  if (file.error) return '加载失败'
  if (file.dicomImage) return '已加载'
  return '未知'
}

// 获取窗宽
const getWindowWidth = (): string => {
  const ww = metadata.value.windowWidth
  if (Array.isArray(ww)) {
    return ww.join(', ')
  }
  return ww?.toString() || 'N/A'
}

// 获取窗位
const getWindowCenter = (): string => {
  const wc = metadata.value.windowCenter
  if (Array.isArray(wc)) {
    return wc.join(', ')
  }
  return wc?.toString() || 'N/A'
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  return FileManagerService.formatFileSize(bytes)
}

// 格式化日期
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 格式化检查日期
const formatStudyDate = (dateStr?: string): string => {
  if (!dateStr) return ''
  
  // DICOM日期格式: YYYYMMDD
  if (dateStr.length === 8) {
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}-${month}-${day}`
  }
  
  return dateStr
}

// 格式化检查时间
const formatStudyTime = (timeStr?: string): string => {
  if (!timeStr) return ''
  
  // DICOM时间格式: HHMMSS.FFFFFF
  if (timeStr.length >= 6) {
    const hour = timeStr.substring(0, 2)
    const minute = timeStr.substring(2, 4)
    const second = timeStr.substring(4, 6)
    return `${hour}:${minute}:${second}`
  }
  
  return timeStr
}

// 导出信息
const exportInfo = () => {
  if (!props.currentFile?.dicomImage) {
    ElMessage.warning('没有可导出的信息')
    return
  }

  const info = props.fileManager.exportFileInfo(props.currentFile.id)
  if (info) {
    const dataStr = JSON.stringify(info, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `${props.currentFile.name}_info.json`
    link.click()
    
    URL.revokeObjectURL(link.href)
    ElMessage.success('信息已导出')
  }
}

// 复制信息
const copyInfo = async () => {
  if (!props.currentFile?.dicomImage) {
    ElMessage.warning('没有可复制的信息')
    return
  }

  const info = props.fileManager.exportFileInfo(props.currentFile.id)
  if (info) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(info, null, 2))
      ElMessage.success('信息已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }
}

// 刷新文件
const refreshFile = () => {
  if (props.currentFile) {
    emit('refresh', props.currentFile.id)
  }
}
</script>

<style scoped>
.file-info-panel {
  @apply h-full overflow-y-auto bg-medical-bg-secondary;
}

.empty-state {
  @apply flex flex-col items-center justify-center h-full;
}

.file-info-content {
  @apply divide-y divide-medical-border;
}

.info-section {
  @apply p-4;
}

.section-header {
  @apply mb-3;
}

.section-content {
  @apply space-y-3;
}

.info-grid {
  @apply grid grid-cols-1 gap-3;
}

.info-item {
  @apply flex flex-col space-y-1;
}

.info-item label {
  @apply text-xs font-medium text-medical-text-muted uppercase tracking-wider;
}

.info-item span {
  @apply text-sm text-medical-text-primary;
}

.modality-tag {
  @apply inline-block px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs font-medium;
}

.action-section {
  @apply sticky bottom-0 bg-medical-bg-secondary;
}
</style>
