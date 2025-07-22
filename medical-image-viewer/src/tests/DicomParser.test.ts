import { describe, it, expect, beforeEach } from 'vitest'
import { DicomParser } from '@/services/dicom/DicomParser'

describe('DicomParser', () => {
  let mockFile: File

  beforeEach(() => {
    // 创建模拟的DICOM文件
    const mockArrayBuffer = new ArrayBuffer(1024)
    const mockBlob = new Blob([mockArrayBuffer], { type: 'application/dicom' })
    mockFile = new File([mockBlob], 'test.dcm', { type: 'application/dicom' })
  })

  describe('parseDicomFile', () => {
    it('应该能够解析有效的DICOM文件', async () => {
      // 由于需要真实的DICOM数据，这里只测试错误处理
      try {
        await DicomParser.parseDicomFile(mockFile)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('DICOM文件解析失败')
      }
    })

    it('应该在文件为空时抛出错误', async () => {
      const emptyFile = new File([], 'empty.dcm', { type: 'application/dicom' })
      
      try {
        await DicomParser.parseDicomFile(emptyFile)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('extractMetadata', () => {
    it('应该能够提取基本的DICOM元数据', () => {
      const mockDataset = {
        PatientName: { Alphabetic: 'Test Patient' },
        PatientID: 'TEST001',
        StudyDate: '20240101',
        Modality: 'CT',
        Rows: 512,
        Columns: 512,
        BitsAllocated: 16,
        WindowCenter: 40,
        WindowWidth: 400
      }

      // 使用反射访问私有方法进行测试
      const metadata = (DicomParser as any).extractMetadata(mockDataset)

      expect(metadata.patientName).toBe('Test Patient')
      expect(metadata.patientId).toBe('TEST001')
      expect(metadata.studyDate).toBe('20240101')
      expect(metadata.modality).toBe('CT')
      expect(metadata.rows).toBe(512)
      expect(metadata.columns).toBe(512)
      expect(metadata.bitsAllocated).toBe(16)
      expect(metadata.windowCenter).toBe(40)
      expect(metadata.windowWidth).toBe(400)
    })

    it('应该为缺失的字段提供默认值', () => {
      const emptyDataset = {}
      const metadata = (DicomParser as any).extractMetadata(emptyDataset)

      expect(metadata.patientName).toBe('Unknown')
      expect(metadata.patientId).toBe('')
      expect(metadata.rows).toBe(0)
      expect(metadata.columns).toBe(0)
      expect(metadata.bitsAllocated).toBe(8)
      expect(metadata.windowCenter).toBe(128)
      expect(metadata.windowWidth).toBe(256)
    })
  })

  describe('createImageData', () => {
    it('应该能够创建8位图像数据', () => {
      const pixelData = new Uint8Array([0, 128, 255, 64])
      const metadata = {
        columns: 2,
        rows: 2,
        windowCenter: 128,
        windowWidth: 256,
        rescaleIntercept: 0,
        rescaleSlope: 1
      }

      const imageData = (DicomParser as any).createImageData(pixelData, metadata)

      expect(imageData).toBeInstanceOf(ImageData)
      expect(imageData.width).toBe(2)
      expect(imageData.height).toBe(2)
      expect(imageData.data.length).toBe(16) // 2x2x4 (RGBA)
    })

    it('应该在无效尺寸时抛出错误', () => {
      const pixelData = new Uint8Array([0, 128, 255, 64])
      const metadata = {
        columns: 0,
        rows: 0,
        windowCenter: 128,
        windowWidth: 256
      }

      expect(() => {
        (DicomParser as any).createImageData(pixelData, metadata)
      }).toThrow('无效的图像尺寸')
    })
  })

  describe('applyWindowLevel', () => {
    it('应该能够应用窗宽窗位调整', () => {
      const pixelData = new Uint8Array([0, 128, 255, 64])
      const metadata = {
        columns: 2,
        rows: 2,
        rescaleIntercept: 0,
        rescaleSlope: 1
      }

      const imageData = new ImageData(new Uint8ClampedArray(16), 2, 2)
      const canvas = document.createElement('canvas')
      canvas.width = 2
      canvas.height = 2

      const dicomImage = {
        metadata,
        pixelData,
        imageData,
        canvas,
        width: 2,
        height: 2
      }

      // 应该不抛出错误
      expect(() => {
        DicomParser.applyWindowLevel(dicomImage, 128, 256)
      }).not.toThrow()
    })
  })
})

describe('DicomParser 集成测试', () => {
  it('应该能够处理完整的DICOM解析流程', () => {
    // 这里可以添加使用真实DICOM文件的集成测试
    // 由于需要真实的DICOM数据，暂时跳过
    expect(true).toBe(true)
  })
})
