import type { DicomImage } from '../dicom/DicomParser'
import { DicomParser } from '../dicom/DicomParser'

export interface DicomFile {
  id: string
  name: string
  size: number
  lastModified: number
  dicomImage?: DicomImage
  isLoading: boolean
  error?: string
  uploadProgress?: number
}

export interface FileManagerState {
  files: DicomFile[]
  currentFileId?: string
  isUploading: boolean
  uploadProgress: number
}

export class FileManagerService {
  private state: FileManagerState = {
    files: [],
    isUploading: false,
    uploadProgress: 0
  }
  
  private listeners: Array<(state: FileManagerState) => void> = []
  
  /**
   * 添加状态监听器
   */
  addListener(listener: (state: FileManagerState) => void): void {
    this.listeners.push(listener)
  }
  
  /**
   * 移除状态监听器
   */
  removeListener(listener: (state: FileManagerState) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }
  
  /**
   * 通知状态更新
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }
  
  /**
   * 获取当前状态
   */
  getState(): FileManagerState {
    return { ...this.state }
  }
  
  /**
   * 添加文件
   */
  async addFiles(files: FileList | File[]): Promise<void> {
    const fileArray = Array.from(files)
    
    // 过滤DICOM文件
    const dicomFiles = fileArray.filter(file => 
      file.name.toLowerCase().endsWith('.dcm') || 
      file.name.toLowerCase().endsWith('.dicom') ||
      file.type === 'application/dicom'
    )
    
    if (dicomFiles.length === 0) {
      throw new Error('未找到有效的DICOM文件')
    }
    
    // 创建文件记录
    const newFiles: DicomFile[] = dicomFiles.map(file => ({
      id: this.generateFileId(),
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      isLoading: true
    }))
    
    // 添加到状态
    this.state.files.push(...newFiles)
    this.notifyListeners()
    
    // 并行解析文件
    const parsePromises = newFiles.map(async (dicomFile, index) => {
      try {
        const file = dicomFiles[index]
        const dicomImage = await DicomParser.parseDicomFile(file)
        
        // 更新文件状态
        dicomFile.dicomImage = dicomImage
        dicomFile.isLoading = false
        
        // 如果是第一个文件，设置为当前文件
        if (!this.state.currentFileId) {
          this.state.currentFileId = dicomFile.id
        }
        
        this.notifyListeners()
        
      } catch (error) {
        dicomFile.error = error instanceof Error ? error.message : '解析失败'
        dicomFile.isLoading = false
        this.notifyListeners()
      }
    })
    
    await Promise.all(parsePromises)
  }
  
  /**
   * 移除文件
   */
  removeFile(fileId: string): void {
    const index = this.state.files.findIndex(file => file.id === fileId)
    if (index > -1) {
      this.state.files.splice(index, 1)
      
      // 如果移除的是当前文件，选择下一个文件
      if (this.state.currentFileId === fileId) {
        if (this.state.files.length > 0) {
          this.state.currentFileId = this.state.files[0].id
        } else {
          this.state.currentFileId = undefined
        }
      }
      
      this.notifyListeners()
    }
  }
  
  /**
   * 清空所有文件
   */
  clearFiles(): void {
    this.state.files = []
    this.state.currentFileId = undefined
    this.notifyListeners()
  }
  
  /**
   * 设置当前文件
   */
  setCurrentFile(fileId: string): void {
    const file = this.state.files.find(f => f.id === fileId)
    if (file) {
      this.state.currentFileId = fileId
      this.notifyListeners()
    }
  }
  
  /**
   * 获取当前文件
   */
  getCurrentFile(): DicomFile | undefined {
    if (!this.state.currentFileId) return undefined
    return this.state.files.find(file => file.id === this.state.currentFileId)
  }
  
  /**
   * 获取文件列表
   */
  getFiles(): DicomFile[] {
    return [...this.state.files]
  }
  
  /**
   * 根据ID获取文件
   */
  getFileById(fileId: string): DicomFile | undefined {
    return this.state.files.find(file => file.id === fileId)
  }
  
  /**
   * 重新解析文件
   */
  async reloadFile(fileId: string, file: File): Promise<void> {
    const dicomFile = this.getFileById(fileId)
    if (!dicomFile) return
    
    dicomFile.isLoading = true
    dicomFile.error = undefined
    this.notifyListeners()
    
    try {
      const dicomImage = await DicomParser.parseDicomFile(file)
      dicomFile.dicomImage = dicomImage
      dicomFile.isLoading = false
      this.notifyListeners()
    } catch (error) {
      dicomFile.error = error instanceof Error ? error.message : '解析失败'
      dicomFile.isLoading = false
      this.notifyListeners()
    }
  }
  
  /**
   * 获取文件统计信息
   */
  getFileStats(): {
    total: number
    loaded: number
    loading: number
    error: number
    totalSize: number
  } {
    const stats = {
      total: this.state.files.length,
      loaded: 0,
      loading: 0,
      error: 0,
      totalSize: 0
    }
    
    this.state.files.forEach(file => {
      stats.totalSize += file.size
      
      if (file.error) {
        stats.error++
      } else if (file.isLoading) {
        stats.loading++
      } else if (file.dicomImage) {
        stats.loaded++
      }
    })
    
    return stats
  }
  
  /**
   * 导出文件信息
   */
  exportFileInfo(fileId: string): any {
    const file = this.getFileById(fileId)
    if (!file || !file.dicomImage) return null
    
    return {
      fileName: file.name,
      fileSize: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      metadata: file.dicomImage.metadata,
      imageInfo: {
        width: file.dicomImage.width,
        height: file.dicomImage.height,
        pixelDataLength: file.dicomImage.pixelData.length
      }
    }
  }
  
  /**
   * 搜索文件
   */
  searchFiles(query: string): DicomFile[] {
    const lowerQuery = query.toLowerCase()
    
    return this.state.files.filter(file => {
      // 搜索文件名
      if (file.name.toLowerCase().includes(lowerQuery)) {
        return true
      }
      
      // 搜索患者信息
      if (file.dicomImage?.metadata) {
        const metadata = file.dicomImage.metadata
        const searchFields = [
          metadata.patientName,
          metadata.patientId,
          metadata.studyDescription,
          metadata.seriesDescription,
          metadata.modality
        ]
        
        return searchFields.some(field => 
          field && field.toLowerCase().includes(lowerQuery)
        )
      }
      
      return false
    })
  }
  
  /**
   * 按条件排序文件
   */
  sortFiles(sortBy: 'name' | 'date' | 'size' | 'patientName', ascending = true): DicomFile[] {
    const files = [...this.state.files]
    
    files.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = a.lastModified - b.lastModified
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'patientName':
          const nameA = a.dicomImage?.metadata.patientName || ''
          const nameB = b.dicomImage?.metadata.patientName || ''
          comparison = nameA.localeCompare(nameB)
          break
      }
      
      return ascending ? comparison : -comparison
    })
    
    return files
  }
  
  /**
   * 生成文件ID
   */
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  /**
   * 验证DICOM文件
   */
  static isDicomFile(file: File): boolean {
    const validExtensions = ['.dcm', '.dicom']
    const validMimeTypes = ['application/dicom']
    
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    )
    
    const hasValidMimeType = validMimeTypes.includes(file.type)
    
    return hasValidExtension || hasValidMimeType
  }
}
