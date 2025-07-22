import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DicomParser, TRANSFER_SYNTAXES, DEFAULT_PARSE_OPTIONS } from '@/services/dicom/DicomParser'

// Mock dicom-parser
vi.mock('dicom-parser', () => ({
  parseDicom: vi.fn().mockReturnValue({
    elements: {
      x00100010: { tag: 'x00100010' }, // Patient Name
      x00100020: { tag: 'x00100020' }, // Patient ID
      x00080020: { tag: 'x00080020' }, // Study Date
      x00080060: { tag: 'x00080060' }, // Modality
      x00280010: { tag: 'x00280010' }, // Rows
      x00280011: { tag: 'x00280011' }, // Columns
      x00280100: { tag: 'x00280100' }, // Bits Allocated
      x00280101: { tag: 'x00280101' }, // Bits Stored
      x00280103: { tag: 'x00280103' }, // Pixel Representation
      x00280002: { tag: 'x00280002' }, // Samples Per Pixel
      x00280004: { tag: 'x00280004' }, // Photometric Interpretation
      x00281050: { tag: 'x00281050' }, // Window Center
      x00281051: { tag: 'x00281051' }, // Window Width
      x00281052: { tag: 'x00281052' }, // Rescale Intercept
      x00281053: { tag: 'x00281053' }, // Rescale Slope
      x00020010: { tag: 'x00020010' }, // Transfer Syntax UID
      x7fe00010: { tag: 'x7fe00010', dataOffset: 1000, length: 1024 } // Pixel Data
    },
    string: vi.fn((tag: string) => {
      const mockValues: Record<string, string> = {
        x00100010: 'Test Patient',
        x00100020: 'TEST001',
        x00080020: '20240101',
        x00080060: 'CT',
        x00280010: '512',
        x00280011: '512',
        x00280100: '16',
        x00280101: '16',
        x00280103: '0',
        x00280002: '1',
        x00280004: 'MONOCHROME2',
        x00281050: '40',
        x00281051: '400',
        x00281052: '0',
        x00281053: '1',
        x00020010: TRANSFER_SYNTAXES.EXPLICIT_VR_LITTLE_ENDIAN,
        x00280008: '1'
      }
      return mockValues[tag]
    }),
    byteArray: new Uint8Array(2048)
  })
}))

describe('DicomParser', () => {
  let mockFile: File
  let mockDicomData: Uint8Array

  beforeEach(() => {
    // 创建模拟的DICOM文件数据
    mockDicomData = new Uint8Array(2048)
    // 添加DICM前缀
    mockDicomData[128] = 0x44 // D
    mockDicomData[129] = 0x49 // I
    mockDicomData[130] = 0x43 // C
    mockDicomData[131] = 0x4D // M

    const mockBlob = new Blob([mockDicomData], { type: 'application/dicom' })
    mockFile = new File([mockBlob], 'test.dcm', { type: 'application/dicom' })
  })

  describe('validateDicomFile', () => {
    it('应该能够验证有效的DICOM文件', async () => {
      const result = await DicomParser.validateDicomFile(mockFile)

      expect(result.isValid).toBe(true)
      expect(result.hasPixelData).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测空文件', async () => {
      const emptyFile = new File([], 'empty.dcm', { type: 'application/dicom' })
      const result = await DicomParser.validateDicomFile(emptyFile)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('文件为空')
    })

    it('应该警告大文件', async () => {
      // 创建一个大文件的模拟
      const largeData = new Uint8Array(3 * 1024 * 1024 * 1024) // 3GB
      const largeFile = new File([largeData], 'large.dcm', { type: 'application/dicom' })

      const result = await DicomParser.validateDicomFile(largeFile)
      expect(result.warnings.some(w => w.includes('文件过大'))).toBe(true)
    })
  })

  describe('parseDicomFile', () => {
    it('应该能够解析有效的DICOM文件', async () => {
      const result = await DicomParser.parseDicomFile(mockFile)

      expect(result).toBeDefined()
      expect(result.metadata.patientName).toBe('Test Patient')
      expect(result.metadata.patientId).toBe('TEST001')
      expect(result.metadata.modality).toBe('CT')
      expect(result.width).toBe(512)
      expect(result.height).toBe(512)
      expect(result.frames).toBe(1)
    })

    it('应该支持自定义解析选项', async () => {
      const options = {
        includePixelData: false,
        validateIntegrity: false,
        generateHistogram: true
      }

      const result = await DicomParser.parseDicomFile(mockFile, options)
      expect(result.pixelData.length).toBe(0)
    })

    it('应该在内存限制超出时抛出错误', async () => {
      const options = {
        maxMemoryUsage: 0.001 // 0.001MB
      }

      await expect(DicomParser.parseDicomFile(mockFile, options)).rejects.toThrow('文件过大')
    })

    it('应该调用进度回调', async () => {
      const progressCallback = vi.fn()
      const options = { progressCallback }

      await DicomParser.parseDicomFile(mockFile, options)
      expect(progressCallback).toHaveBeenCalledWith(20)
      expect(progressCallback).toHaveBeenCalledWith(100)
    })
  })

  describe('传输语法支持', () => {
    it('应该返回支持的传输语法列表', () => {
      const supported = DicomParser.getSupportedTransferSyntaxes()

      expect(supported).toContain(TRANSFER_SYNTAXES.IMPLICIT_VR_LITTLE_ENDIAN)
      expect(supported).toContain(TRANSFER_SYNTAXES.EXPLICIT_VR_LITTLE_ENDIAN)
      expect(Array.isArray(supported)).toBe(true)
    })

    it('应该检查传输语法是否支持', () => {
      expect(DicomParser.isTransferSyntaxSupported(TRANSFER_SYNTAXES.EXPLICIT_VR_LITTLE_ENDIAN)).toBe(true)
      expect(DicomParser.isTransferSyntaxSupported('unknown')).toBe(false)
    })

    it('应该返回传输语法描述', () => {
      const description = DicomParser.getTransferSyntaxDescription(TRANSFER_SYNTAXES.EXPLICIT_VR_LITTLE_ENDIAN)
      expect(description).toBe('Explicit VR Little Endian')

      const unknownDescription = DicomParser.getTransferSyntaxDescription('unknown')
      expect(unknownDescription).toContain('Unknown')
    })
  })

  describe('窗宽窗位功能', () => {
    let mockDicomImage: any

    beforeEach(async () => {
      mockDicomImage = await DicomParser.parseDicomFile(mockFile)
    })

    it('应该能够应用窗宽窗位调整', () => {
      expect(() => {
        DicomParser.applyEnhancedWindowLevel(mockDicomImage, 100, 200)
      }).not.toThrow()
    })

    it('应该创建预设窗宽窗位', () => {
      const presets = DicomParser.createPresetWindowLevels(mockDicomImage.metadata)

      expect(Array.isArray(presets)).toBe(true)
      expect(presets.length).toBeGreaterThan(0)

      // 检查CT预设
      const lungWindow = presets.find(p => p.name === '肺窗')
      expect(lungWindow).toBeDefined()
      expect(lungWindow?.center).toBe(-600)
      expect(lungWindow?.width).toBe(1600)
    })
  })

  describe('像素值获取', () => {
    let mockDicomImage: any

    beforeEach(async () => {
      mockDicomImage = await DicomParser.parseDicomFile(mockFile)
    })

    it('应该能够获取像素值', () => {
      const pixelValue = DicomParser.getPixelValue(mockDicomImage, 100, 100)
      expect(typeof pixelValue).toBe('number')
    })

    it('应该在坐标超出范围时返回null', () => {
      const pixelValue = DicomParser.getPixelValue(mockDicomImage, -1, -1)
      expect(pixelValue).toBeNull()

      const pixelValue2 = DicomParser.getPixelValue(mockDicomImage, 1000, 1000)
      expect(pixelValue2).toBeNull()
    })

    it('应该能够获取Hounsfield值（CT）', () => {
      const hounsfield = DicomParser.getHounsfieldValue(mockDicomImage, 100, 100)
      expect(typeof hounsfield).toBe('number')
    })

    it('应该在非CT图像时返回null', () => {
      mockDicomImage.metadata.modality = 'MR'
      const hounsfield = DicomParser.getHounsfieldValue(mockDicomImage, 100, 100)
      expect(hounsfield).toBeNull()
    })
  })

  describe('错误处理', () => {
    it('应该处理解析错误', async () => {
      // Mock解析失败
      const { parseDicom } = await import('dicom-parser')
      vi.mocked(parseDicom).mockImplementationOnce(() => {
        throw new Error('解析失败')
      })

      await expect(DicomParser.parseDicomFile(mockFile)).rejects.toThrow('DICOM文件解析失败')
    })

    it('应该处理内存不足错误', async () => {
      const options = { maxMemoryUsage: 0 }
      await expect(DicomParser.parseDicomFile(mockFile, options)).rejects.toThrow('文件过大')
    })

    it('应该调用错误回调', async () => {
      const errorCallback = vi.fn()
      const options = {
        maxMemoryUsage: 0,
        errorCallback
      }

      try {
        await DicomParser.parseDicomFile(mockFile, options)
      } catch {
        // 预期的错误
      }

      expect(errorCallback).toHaveBeenCalled()
    })
  })

  describe('性能和内存管理', () => {
    it('应该正确估算内存使用', async () => {
      const validation = await DicomParser.validateDicomFile(mockFile)
      expect(validation.estimatedSize).toBe(mockFile.size)
    })

    it('应该支持大文件处理', async () => {
      const options = { maxMemoryUsage: 1024 } // 1GB

      // 应该不抛出内存错误
      await expect(DicomParser.parseDicomFile(mockFile, options)).resolves.toBeDefined()
    })
  })

  describe('默认配置', () => {
    it('应该有正确的默认解析选项', () => {
      expect(DEFAULT_PARSE_OPTIONS.includePixelData).toBe(true)
      expect(DEFAULT_PARSE_OPTIONS.validateIntegrity).toBe(true)
      expect(DEFAULT_PARSE_OPTIONS.generateHistogram).toBe(false)
      expect(DEFAULT_PARSE_OPTIONS.maxMemoryUsage).toBe(512)
    })
  })
})

describe('DicomParser 集成测试', () => {
  it('应该能够处理完整的DICOM解析流程', async () => {
    // 创建模拟的完整DICOM文件
    const mockData = new Uint8Array(2048)
    mockData[128] = 0x44 // D
    mockData[129] = 0x49 // I
    mockData[130] = 0x43 // C
    mockData[131] = 0x4D // M

    const file = new File([mockData], 'test.dcm', { type: 'application/dicom' })

    // 验证文件
    const validation = await DicomParser.validateDicomFile(file)
    expect(validation.isValid).toBe(true)

    // 解析文件
    const dicomImage = await DicomParser.parseDicomFile(file)
    expect(dicomImage).toBeDefined()
    expect(dicomImage.metadata).toBeDefined()
    expect(dicomImage.pixelDataInfo).toBeDefined()

    // 应用窗宽窗位
    DicomParser.applyEnhancedWindowLevel(dicomImage, 100, 200)

    // 获取像素值
    const pixelValue = DicomParser.getPixelValue(dicomImage, 0, 0)
    expect(typeof pixelValue).toBe('number')
  })

  it('应该支持不同的传输语法', () => {
    const supportedSyntaxes = DicomParser.getSupportedTransferSyntaxes()
    expect(supportedSyntaxes.length).toBeGreaterThan(0)

    supportedSyntaxes.forEach(syntax => {
      expect(DicomParser.isTransferSyntaxSupported(syntax)).toBe(true)
      expect(DicomParser.getTransferSyntaxDescription(syntax)).toBeDefined()
    })
  })
})
