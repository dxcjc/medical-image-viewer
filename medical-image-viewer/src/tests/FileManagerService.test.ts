import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FileManagerService } from '@/services/file/FileManagerService'

// Mock DicomParser
const mockDicomImage = {
  metadata: {
    patientName: 'Test Patient',
    patientId: 'TEST001',
    modality: 'CT',
    studyDate: '20240101'
  },
  pixelData: new Uint8Array(512 * 512),
  width: 512,
  height: 512,
  canvas: (() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    return canvas
  })()
}

vi.mock('@/services/dicom/DicomParser', () => ({
  DicomParser: {
    parseDicomFile: vi.fn().mockResolvedValue(mockDicomImage)
  }
}))

describe('FileManagerService', () => {
  let fileManager: FileManagerService
  let mockFile: File

  beforeEach(() => {
    fileManager = new FileManagerService()
    
    // 创建模拟DICOM文件
    const mockArrayBuffer = new ArrayBuffer(1024)
    const mockBlob = new Blob([mockArrayBuffer], { type: 'application/dicom' })
    mockFile = new File([mockBlob], 'test.dcm', { 
      type: 'application/dicom',
      lastModified: Date.now()
    })
  })

  describe('状态管理', () => {
    it('应该能够获取初始状态', () => {
      const state = fileManager.getState()
      
      expect(state.files).toEqual([])
      expect(state.currentFileId).toBeUndefined()
      expect(state.isUploading).toBe(false)
      expect(state.uploadProgress).toBe(0)
    })

    it('应该能够添加和移除监听器', () => {
      const listener = vi.fn()
      
      fileManager.addListener(listener)
      fileManager.removeListener(listener)
      
      // 应该不会抛出错误
      expect(true).toBe(true)
    })
  })

  describe('文件操作', () => {
    it('应该能够添加DICOM文件', async () => {
      const files = [mockFile]
      
      await fileManager.addFiles(files)
      
      const state = fileManager.getState()
      expect(state.files).toHaveLength(1)
      expect(state.files[0].name).toBe('test.dcm')
      expect(state.currentFileId).toBe(state.files[0].id)
    })

    it('应该过滤非DICOM文件', async () => {
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const files = [textFile]
      
      await expect(fileManager.addFiles(files)).rejects.toThrow('未找到有效的DICOM文件')
    })

    it('应该能够移除文件', async () => {
      await fileManager.addFiles([mockFile])
      const state = fileManager.getState()
      const fileId = state.files[0].id
      
      fileManager.removeFile(fileId)
      
      const newState = fileManager.getState()
      expect(newState.files).toHaveLength(0)
      expect(newState.currentFileId).toBeUndefined()
    })

    it('应该能够清空所有文件', async () => {
      await fileManager.addFiles([mockFile])
      
      fileManager.clearFiles()
      
      const state = fileManager.getState()
      expect(state.files).toHaveLength(0)
      expect(state.currentFileId).toBeUndefined()
    })

    it('应该能够设置当前文件', async () => {
      await fileManager.addFiles([mockFile])
      const state = fileManager.getState()
      const fileId = state.files[0].id
      
      fileManager.setCurrentFile(fileId)
      
      const newState = fileManager.getState()
      expect(newState.currentFileId).toBe(fileId)
    })
  })

  describe('文件查询', () => {
    beforeEach(async () => {
      await fileManager.addFiles([mockFile])
    })

    it('应该能够获取当前文件', () => {
      const currentFile = fileManager.getCurrentFile()
      
      expect(currentFile).toBeDefined()
      expect(currentFile?.name).toBe('test.dcm')
    })

    it('应该能够根据ID获取文件', () => {
      const state = fileManager.getState()
      const fileId = state.files[0].id
      
      const file = fileManager.getFileById(fileId)
      
      expect(file).toBeDefined()
      expect(file?.id).toBe(fileId)
    })

    it('应该能够获取文件列表', () => {
      const files = fileManager.getFiles()
      
      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('test.dcm')
    })

    it('应该能够获取文件统计信息', () => {
      const stats = fileManager.getFileStats()
      
      expect(stats.total).toBe(1)
      expect(stats.totalSize).toBeGreaterThan(0)
    })
  })

  describe('文件搜索', () => {
    beforeEach(async () => {
      // 添加多个文件进行搜索测试
      const file1 = new File([new ArrayBuffer(1024)], 'patient1.dcm', { type: 'application/dicom' })
      const file2 = new File([new ArrayBuffer(1024)], 'patient2.dcm', { type: 'application/dicom' })
      
      await fileManager.addFiles([file1, file2])
    })

    it('应该能够按文件名搜索', () => {
      const results = fileManager.searchFiles('patient1')
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('patient1.dcm')
    })

    it('应该能够按患者信息搜索', () => {
      const results = fileManager.searchFiles('Test Patient')
      
      // 由于mock返回相同的患者信息，应该找到所有文件
      expect(results.length).toBeGreaterThan(0)
    })

    it('应该在没有匹配时返回空数组', () => {
      const results = fileManager.searchFiles('nonexistent')
      
      expect(results).toHaveLength(0)
    })
  })

  describe('文件排序', () => {
    beforeEach(async () => {
      const file1 = new File([new ArrayBuffer(1024)], 'a.dcm', { 
        type: 'application/dicom',
        lastModified: Date.now() - 1000
      })
      const file2 = new File([new ArrayBuffer(2048)], 'b.dcm', { 
        type: 'application/dicom',
        lastModified: Date.now()
      })
      
      await fileManager.addFiles([file1, file2])
    })

    it('应该能够按名称排序', () => {
      const sorted = fileManager.sortFiles('name', true)
      
      expect(sorted[0].name).toBe('a.dcm')
      expect(sorted[1].name).toBe('b.dcm')
    })

    it('应该能够按大小排序', () => {
      const sorted = fileManager.sortFiles('size', true)
      
      expect(sorted[0].size).toBeLessThanOrEqual(sorted[1].size)
    })

    it('应该能够按日期排序', () => {
      const sorted = fileManager.sortFiles('date', true)
      
      expect(sorted[0].lastModified).toBeLessThanOrEqual(sorted[1].lastModified)
    })

    it('应该能够降序排序', () => {
      const sorted = fileManager.sortFiles('name', false)
      
      expect(sorted[0].name).toBe('b.dcm')
      expect(sorted[1].name).toBe('a.dcm')
    })
  })

  describe('文件信息导出', () => {
    beforeEach(async () => {
      await fileManager.addFiles([mockFile])
    })

    it('应该能够导出文件信息', () => {
      const state = fileManager.getState()
      const fileId = state.files[0].id
      
      const info = fileManager.exportFileInfo(fileId)
      
      expect(info).toBeDefined()
      expect(info.fileName).toBe('test.dcm')
      expect(info.metadata).toBeDefined()
      expect(info.imageInfo).toBeDefined()
    })

    it('应该在文件不存在时返回null', () => {
      const info = fileManager.exportFileInfo('nonexistent')
      
      expect(info).toBeNull()
    })
  })

  describe('工具方法', () => {
    it('应该能够格式化文件大小', () => {
      expect(FileManagerService.formatFileSize(0)).toBe('0 Bytes')
      expect(FileManagerService.formatFileSize(1024)).toBe('1 KB')
      expect(FileManagerService.formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(FileManagerService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('应该能够验证DICOM文件', () => {
      const dicomFile = new File([], 'test.dcm', { type: 'application/dicom' })
      const textFile = new File([], 'test.txt', { type: 'text/plain' })
      
      expect(FileManagerService.isDicomFile(dicomFile)).toBe(true)
      expect(FileManagerService.isDicomFile(textFile)).toBe(false)
    })

    it('应该能够通过扩展名验证DICOM文件', () => {
      const dcmFile = new File([], 'test.dcm')
      const dicomFile = new File([], 'test.dicom')
      
      expect(FileManagerService.isDicomFile(dcmFile)).toBe(true)
      expect(FileManagerService.isDicomFile(dicomFile)).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('应该处理文件解析错误', async () => {
      // Mock解析失败
      const { DicomParser } = await import('@/services/dicom/DicomParser')
      vi.mocked(DicomParser.parseDicomFile).mockRejectedValueOnce(new Error('解析失败'))
      
      await fileManager.addFiles([mockFile])
      
      const state = fileManager.getState()
      expect(state.files[0].error).toBe('解析失败')
      expect(state.files[0].isLoading).toBe(false)
    })
  })
})
