import * as dcmjs from 'dcmjs'
import * as dicomParser from 'dicom-parser'

// DICOM传输语法常量
export const TRANSFER_SYNTAXES = {
  IMPLICIT_VR_LITTLE_ENDIAN: '1.2.840.10008.1.2',
  EXPLICIT_VR_LITTLE_ENDIAN: '1.2.840.10008.1.2.1',
  EXPLICIT_VR_BIG_ENDIAN: '1.2.840.10008.1.2.2',
  DEFLATED_EXPLICIT_VR_LITTLE_ENDIAN: '1.2.840.10008.1.2.1.99',
  JPEG_BASELINE_1: '1.2.840.10008.1.2.4.50',
  JPEG_EXTENDED_2_4: '1.2.840.10008.1.2.4.51',
  JPEG_LOSSLESS_14: '1.2.840.10008.1.2.4.57',
  JPEG_LOSSLESS_14_1: '1.2.840.10008.1.2.4.70',
  JPEG_LS_LOSSLESS: '1.2.840.10008.1.2.4.80',
  JPEG_LS_LOSSY: '1.2.840.10008.1.2.4.81',
  JPEG_2000_LOSSLESS: '1.2.840.10008.1.2.4.90',
  JPEG_2000_LOSSY: '1.2.840.10008.1.2.4.91',
  RLE_LOSSLESS: '1.2.840.10008.1.2.5'
} as const

export interface DicomMetadata {
  // 患者信息
  patientName?: string
  patientId?: string
  patientBirthDate?: string
  patientSex?: string
  patientAge?: string
  patientWeight?: number
  patientHeight?: number

  // 检查信息
  studyDate?: string
  studyTime?: string
  studyInstanceUID?: string
  studyDescription?: string
  studyId?: string
  accessionNumber?: string

  // 序列信息
  seriesDate?: string
  seriesTime?: string
  seriesInstanceUID?: string
  seriesDescription?: string
  seriesNumber?: number
  modality?: string

  // 实例信息
  sopInstanceUID?: string
  sopClassUID?: string
  instanceNumber?: number
  acquisitionDate?: string
  acquisitionTime?: string

  // 图像参数
  rows?: number
  columns?: number
  bitsAllocated?: number
  bitsStored?: number
  highBit?: number
  pixelRepresentation?: number
  samplesPerPixel?: number
  photometricInterpretation?: string
  planarConfiguration?: number

  // 几何参数
  pixelSpacing?: number[]
  sliceThickness?: number
  sliceLocation?: number
  imagePosition?: number[]
  imageOrientation?: number[]
  frameOfReferenceUID?: string

  // 显示参数
  windowCenter?: number | number[]
  windowWidth?: number | number[]
  rescaleIntercept?: number
  rescaleSlope?: number
  rescaleType?: string

  // 技术参数
  kvp?: number
  exposureTime?: number
  xRayTubeCurrent?: number
  exposure?: number
  filterType?: string
  convolutionKernel?: string

  // 传输语法和编码
  transferSyntaxUID?: string
  implementationClassUID?: string
  implementationVersionName?: string

  // 文件元信息
  fileMetaInformationVersion?: Uint8Array
  mediaStorageSOPClassUID?: string
  mediaStorageSOPInstanceUID?: string

  // 其他重要标签
  specificCharacterSet?: string
  imageType?: string[]
  acquisitionMatrix?: number[]
  flipAngle?: number
  echoTime?: number
  repetitionTime?: number
  inversionTime?: number
  sequenceName?: string
  protocolName?: string
  scanOptions?: string[]
  mrAcquisitionType?: string
  sliceThicknessOriginal?: number
  spacingBetweenSlices?: number
  numberOfAverages?: number
  imagingFrequency?: number
  imagedNucleus?: string
  echoNumbers?: number
  magneticFieldStrength?: number
  percentSampling?: number
  percentPhaseFieldOfView?: number
  pixelBandwidth?: number
  deviceSerialNumber?: string
  softwareVersions?: string[]
  protocolName2?: string
  transmitCoilName?: string
  acquisitionMatrix2?: number[]
  inPlanePhaseEncodingDirection?: string
  flipAngle2?: number
  variableFlipAngleFlag?: string
  sar?: number
  dbDt?: number
}

// DICOM文件验证结果
export interface DicomValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  transferSyntax?: string
  hasPixelData: boolean
  estimatedSize: number
}

// 像素数据信息
export interface PixelDataInfo {
  data: Uint8Array | Uint16Array | Int16Array | Float32Array
  width: number
  height: number
  bitsAllocated: number
  bitsStored: number
  highBit: number
  pixelRepresentation: number
  samplesPerPixel: number
  photometricInterpretation: string
  planarConfiguration?: number
  transferSyntaxUID: string
  compressed: boolean
  frames: number
}

// 增强的DICOM图像接口
export interface DicomImage {
  metadata: DicomMetadata
  pixelDataInfo: PixelDataInfo
  pixelData: Uint8Array | Uint16Array | Int16Array | Float32Array
  imageData?: ImageData
  canvas?: HTMLCanvasElement
  width: number
  height: number
  frames: number
  currentFrame: number
  minPixelValue: number
  maxPixelValue: number
  meanPixelValue: number
  standardDeviation: number
  histogram?: number[]
  lut?: Uint8Array
  voiLuts?: any[]
  overlays?: any[]
  annotations?: any[]
}

// 解析选项
export interface DicomParseOptions {
  includePixelData: boolean
  validateIntegrity: boolean
  generateHistogram: boolean
  extractOverlays: boolean
  extractAnnotations: boolean
  maxMemoryUsage: number // MB
  progressCallback?: (progress: number) => void
  errorCallback?: (error: Error) => void
}

// 默认解析选项
export const DEFAULT_PARSE_OPTIONS: DicomParseOptions = {
  includePixelData: true,
  validateIntegrity: true,
  generateHistogram: false,
  extractOverlays: false,
  extractAnnotations: false,
  maxMemoryUsage: 512, // 512MB
}

export class DicomParser {
  /**
   * 验证DICOM文件格式和完整性
   */
  static async validateDicomFile(file: File): Promise<DicomValidationResult> {
    const result: DicomValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      hasPixelData: false,
      estimatedSize: file.size
    }

    try {
      // 检查文件大小
      if (file.size === 0) {
        result.errors.push('文件为空')
        return result
      }

      if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB
        result.warnings.push('文件过大，可能影响性能')
      }

      // 读取文件头部进行快速验证
      const headerBuffer = await this.readFileChunk(file, 0, 1024)
      const headerBytes = new Uint8Array(headerBuffer)

      // 检查DICOM前缀
      const dicmPrefix = new Uint8Array([0x44, 0x49, 0x43, 0x4D]) // "DICM"
      let hasDicmPrefix = false

      // 检查128字节前导码后的DICM标识
      if (headerBytes.length >= 132) {
        hasDicmPrefix = headerBytes.slice(128, 132).every((byte, index) => byte === dicmPrefix[index])
      }

      if (!hasDicmPrefix) {
        // 尝试检查是否为隐式VR格式（没有前导码）
        try {
          const dataset = dicomParser.parseDicom(headerBytes)
          if (dataset.elements) {
            result.warnings.push('检测到隐式VR格式，没有DICM前缀')
          }
        } catch {
          result.errors.push('不是有效的DICOM文件格式')
          return result
        }
      }

      // 尝试解析完整文件
      const fullBuffer = await file.arrayBuffer()
      const byteArray = new Uint8Array(fullBuffer)

      try {
        // 使用dicom-parser进行详细验证
        const dataset = dicomParser.parseDicom(byteArray)

        // 检查必需的DICOM标签
        const requiredTags = [
          'x00080016', // SOP Class UID
          'x00080018', // SOP Instance UID
          'x00200013'  // Instance Number
        ]

        for (const tag of requiredTags) {
          if (!dataset.elements[tag]) {
            result.warnings.push(`缺少必需标签: ${tag}`)
          }
        }

        // 检查传输语法
        const transferSyntaxElement = dataset.elements.x00020010
        if (transferSyntaxElement) {
          result.transferSyntax = dataset.string(transferSyntaxElement.tag)
        }

        // 检查像素数据
        const pixelDataElement = dataset.elements.x7fe00010
        if (pixelDataElement) {
          result.hasPixelData = true
        } else {
          result.warnings.push('未找到像素数据')
        }

        result.isValid = true

      } catch (error) {
        result.errors.push(`DICOM解析错误: ${error instanceof Error ? error.message : '未知错误'}`)
      }

    } catch (error) {
      result.errors.push(`文件读取错误: ${error instanceof Error ? error.message : '未知错误'}`)
    }

    return result
  }

  /**
   * 解析DICOM文件（增强版）
   */
  static async parseDicomFile(file: File, options: Partial<DicomParseOptions> = {}): Promise<DicomImage> {
    const parseOptions = { ...DEFAULT_PARSE_OPTIONS, ...options }

    try {
      console.log('开始解析DICOM文件:', file.name)

      // 验证文件
      if (parseOptions.validateIntegrity) {
        const validation = await this.validateDicomFile(file)
        if (!validation.isValid) {
          throw new Error(`DICOM文件验证失败: ${validation.errors.join(', ')}`)
        }

        if (validation.warnings.length > 0) {
          console.warn('DICOM文件警告:', validation.warnings)
        }
      }

      // 检查内存使用
      const estimatedMemory = file.size / (1024 * 1024) // MB
      if (estimatedMemory > parseOptions.maxMemoryUsage) {
        throw new Error(`文件过大，预计内存使用 ${estimatedMemory.toFixed(1)}MB 超过限制 ${parseOptions.maxMemoryUsage}MB`)
      }

      // 读取文件数据
      const arrayBuffer = await file.arrayBuffer()
      const byteArray = new Uint8Array(arrayBuffer)

      parseOptions.progressCallback?.(20)

      // 使用dicom-parser解析
      const dataset = dicomParser.parseDicom(byteArray)

      parseOptions.progressCallback?.(40)

      // 提取元数据
      const metadata = this.extractEnhancedMetadata(dataset)

      parseOptions.progressCallback?.(60)

      // 提取像素数据信息
      const pixelDataInfo = this.extractPixelDataInfo(dataset, metadata)

      // 提取像素数据
      let pixelData: Uint8Array | Uint16Array | Int16Array | Float32Array
      if (parseOptions.includePixelData) {
        pixelData = this.extractEnhancedPixelData(dataset, pixelDataInfo)
      } else {
        // 创建空的像素数据
        pixelData = new Uint8Array(0)
      }

      parseOptions.progressCallback?.(80)

      // 计算统计信息
      const stats = this.calculatePixelStatistics(pixelData, pixelDataInfo)

      // 生成直方图
      let histogram: number[] | undefined
      if (parseOptions.generateHistogram && pixelData.length > 0) {
        histogram = this.generateHistogram(pixelData, pixelDataInfo)
      }

      // 创建图像数据
      let imageData: ImageData | undefined
      let canvas: HTMLCanvasElement | undefined

      if (parseOptions.includePixelData && pixelData.length > 0) {
        imageData = this.createEnhancedImageData(pixelData, pixelDataInfo, metadata)
        canvas = this.createEnhancedCanvas(imageData, metadata)
      }

      parseOptions.progressCallback?.(100)

      const dicomImage: DicomImage = {
        metadata,
        pixelDataInfo,
        pixelData,
        imageData,
        canvas,
        width: metadata.columns || 0,
        height: metadata.rows || 0,
        frames: pixelDataInfo.frames,
        currentFrame: 0,
        minPixelValue: stats.min,
        maxPixelValue: stats.max,
        meanPixelValue: stats.mean,
        standardDeviation: stats.std,
        histogram,
        voiLuts: [],
        overlays: [],
        annotations: []
      }

      console.log('DICOM解析完成:', dicomImage)
      return dicomImage

    } catch (error) {
      parseOptions.errorCallback?.(error as Error)
      console.error('DICOM解析失败:', error)
      throw new Error(`DICOM文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  /**
   * 读取文件片段
   */
  private static readFileChunk(file: File, start: number, length: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file.slice(start, start + length))
    })
  }

  /**
   * 提取增强的DICOM元数据
   */
  private static extractEnhancedMetadata(dataset: any): DicomMetadata {
    const getString = (tag: string) => {
      const element = dataset.elements[tag]
      return element ? dataset.string(tag) : undefined
    }

    const getNumber = (tag: string) => {
      const element = dataset.elements[tag]
      if (!element) return undefined
      const value = dataset.string(tag)
      return value ? parseFloat(value) : undefined
    }

    const getNumbers = (tag: string) => {
      const element = dataset.elements[tag]
      if (!element) return undefined
      const value = dataset.string(tag)
      return value ? value.split('\\').map(parseFloat) : undefined
    }

    const getInt = (tag: string) => {
      const element = dataset.elements[tag]
      if (!element) return undefined
      const value = dataset.string(tag)
      return value ? parseInt(value, 10) : undefined
    }

    return {
      // 患者信息
      patientName: getString('x00100010') || 'Unknown',
      patientId: getString('x00100020') || '',
      patientBirthDate: getString('x00100030'),
      patientSex: getString('x00100040'),
      patientAge: getString('x00101010'),
      patientWeight: getNumber('x00101030'),
      patientHeight: getNumber('x00101020'),

      // 检查信息
      studyDate: getString('x00080020'),
      studyTime: getString('x00080030'),
      studyInstanceUID: getString('x0020000d'),
      studyDescription: getString('x00081030'),
      studyId: getString('x00200010'),
      accessionNumber: getString('x00080050'),

      // 序列信息
      seriesDate: getString('x00080021'),
      seriesTime: getString('x00080031'),
      seriesInstanceUID: getString('x0020000e'),
      seriesDescription: getString('x0008103e'),
      seriesNumber: getInt('x00200011'),
      modality: getString('x00080060'),

      // 实例信息
      sopInstanceUID: getString('x00080018'),
      sopClassUID: getString('x00080016'),
      instanceNumber: getInt('x00200013') || 1,
      acquisitionDate: getString('x00080022'),
      acquisitionTime: getString('x00080032'),

      // 图像参数
      rows: getInt('x00280010') || 0,
      columns: getInt('x00280011') || 0,
      bitsAllocated: getInt('x00280100') || 8,
      bitsStored: getInt('x00280101') || 8,
      highBit: getInt('x00280102'),
      pixelRepresentation: getInt('x00280103') || 0,
      samplesPerPixel: getInt('x00280002') || 1,
      photometricInterpretation: getString('x00280004') || 'MONOCHROME2',
      planarConfiguration: getInt('x00280006'),

      // 几何参数
      pixelSpacing: getNumbers('x00280030') || [1, 1],
      sliceThickness: getNumber('x00180050'),
      sliceLocation: getNumber('x00201041'),
      imagePosition: getNumbers('x00200032'),
      imageOrientation: getNumbers('x00200037'),
      frameOfReferenceUID: getString('x00200052'),

      // 显示参数
      windowCenter: (() => {
        const values = getNumbers('x00281050')
        return values ? (values.length === 1 ? values[0] : values) : 128
      })(),
      windowWidth: (() => {
        const values = getNumbers('x00281051')
        return values ? (values.length === 1 ? values[0] : values) : 256
      })(),
      rescaleIntercept: getNumber('x00281052') || 0,
      rescaleSlope: getNumber('x00281053') || 1,
      rescaleType: getString('x00281054'),

      // 技术参数
      kvp: getNumber('x00180060'),
      exposureTime: getNumber('x00181150'),
      xRayTubeCurrent: getNumber('x00181151'),
      exposure: getNumber('x00181152'),
      filterType: getString('x00181160'),
      convolutionKernel: getString('x00181210'),

      // 传输语法和编码
      transferSyntaxUID: getString('x00020010'),
      implementationClassUID: getString('x00020012'),
      implementationVersionName: getString('x00020013'),

      // 文件元信息
      mediaStorageSOPClassUID: getString('x00020002'),
      mediaStorageSOPInstanceUID: getString('x00020003'),

      // 其他重要标签
      specificCharacterSet: getString('x00080005'),
      imageType: getString('x00080008')?.split('\\'),
      acquisitionMatrix: getNumbers('x00181310'),
      flipAngle: getNumber('x00181314'),
      echoTime: getNumber('x00180081'),
      repetitionTime: getNumber('x00180080'),
      inversionTime: getNumber('x00180082'),
      sequenceName: getString('x00180024'),
      protocolName: getString('x00181030'),
      scanOptions: getString('x00180022')?.split('\\'),
      mrAcquisitionType: getString('x00180023'),
      spacingBetweenSlices: getNumber('x00180088'),
      numberOfAverages: getNumber('x00180083'),
      imagingFrequency: getNumber('x00180084'),
      imagedNucleus: getString('x00180085'),
      echoNumbers: getNumber('x00180086'),
      magneticFieldStrength: getNumber('x00180087'),
      percentSampling: getNumber('x00180093'),
      percentPhaseFieldOfView: getNumber('x00180094'),
      pixelBandwidth: getNumber('x00180095'),
      deviceSerialNumber: getString('x00181000'),
      softwareVersions: getString('x00181020')?.split('\\'),
      transmitCoilName: getString('x00181251'),
      inPlanePhaseEncodingDirection: getString('x00181312'),
      sar: getNumber('x00180206'),
      dbDt: getNumber('x00180207')
    }
  }
  
  /**
   * 提取像素数据信息
   */
  private static extractPixelDataInfo(dataset: any, metadata: DicomMetadata): PixelDataInfo {
    const pixelDataElement = dataset.elements.x7fe00010

    if (!pixelDataElement) {
      throw new Error('未找到像素数据')
    }

    const transferSyntaxUID = metadata.transferSyntaxUID || TRANSFER_SYNTAXES.IMPLICIT_VR_LITTLE_ENDIAN
    const isCompressed = this.isCompressedTransferSyntax(transferSyntaxUID)

    // 计算帧数
    const numberOfFrames = parseInt(dataset.string('x00280008') || '1', 10)

    return {
      data: new Uint8Array(0), // 将在extractEnhancedPixelData中填充
      width: metadata.columns || 0,
      height: metadata.rows || 0,
      bitsAllocated: metadata.bitsAllocated || 8,
      bitsStored: metadata.bitsStored || 8,
      highBit: metadata.highBit || (metadata.bitsStored || 8) - 1,
      pixelRepresentation: metadata.pixelRepresentation || 0,
      samplesPerPixel: metadata.samplesPerPixel || 1,
      photometricInterpretation: metadata.photometricInterpretation || 'MONOCHROME2',
      planarConfiguration: metadata.planarConfiguration,
      transferSyntaxUID,
      compressed: isCompressed,
      frames: numberOfFrames
    }
  }

  /**
   * 检查是否为压缩传输语法
   */
  private static isCompressedTransferSyntax(transferSyntaxUID: string): boolean {
    const compressedSyntaxes = [
      TRANSFER_SYNTAXES.JPEG_BASELINE_1,
      TRANSFER_SYNTAXES.JPEG_EXTENDED_2_4,
      TRANSFER_SYNTAXES.JPEG_LOSSLESS_14,
      TRANSFER_SYNTAXES.JPEG_LOSSLESS_14_1,
      TRANSFER_SYNTAXES.JPEG_LS_LOSSLESS,
      TRANSFER_SYNTAXES.JPEG_LS_LOSSY,
      TRANSFER_SYNTAXES.JPEG_2000_LOSSLESS,
      TRANSFER_SYNTAXES.JPEG_2000_LOSSY,
      TRANSFER_SYNTAXES.RLE_LOSSLESS
    ]

    return compressedSyntaxes.includes(transferSyntaxUID)
  }

  /**
   * 提取增强的像素数据
   */
  private static extractEnhancedPixelData(dataset: any, pixelDataInfo: PixelDataInfo): Uint8Array | Uint16Array | Int16Array | Float32Array {
    const pixelDataElement = dataset.elements.x7fe00010

    if (!pixelDataElement) {
      throw new Error('未找到像素数据')
    }

    // 获取原始像素数据
    let rawPixelData: Uint8Array

    if (pixelDataInfo.compressed) {
      // 处理压缩数据
      rawPixelData = this.decompressPixelData(dataset, pixelDataInfo)
    } else {
      // 处理未压缩数据
      rawPixelData = new Uint8Array(dataset.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length)
    }

    // 根据位深度和像素表示转换数据类型
    return this.convertPixelDataType(rawPixelData, pixelDataInfo)
  }

  /**
   * 解压缩像素数据
   */
  private static decompressPixelData(dataset: any, pixelDataInfo: PixelDataInfo): Uint8Array {
    const transferSyntaxUID = pixelDataInfo.transferSyntaxUID

    switch (transferSyntaxUID) {
      case TRANSFER_SYNTAXES.RLE_LOSSLESS:
        return this.decompressRLE(dataset, pixelDataInfo)

      case TRANSFER_SYNTAXES.JPEG_BASELINE_1:
      case TRANSFER_SYNTAXES.JPEG_EXTENDED_2_4:
        return this.decompressJPEG(dataset, pixelDataInfo)

      case TRANSFER_SYNTAXES.JPEG_LOSSLESS_14:
      case TRANSFER_SYNTAXES.JPEG_LOSSLESS_14_1:
        return this.decompressJPEGLossless(dataset, pixelDataInfo)

      case TRANSFER_SYNTAXES.JPEG_2000_LOSSLESS:
      case TRANSFER_SYNTAXES.JPEG_2000_LOSSY:
        return this.decompressJPEG2000(dataset, pixelDataInfo)

      default:
        throw new Error(`不支持的压缩格式: ${transferSyntaxUID}`)
    }
  }

  /**
   * RLE解压缩
   */
  private static decompressRLE(dataset: any, pixelDataInfo: PixelDataInfo): Uint8Array {
    // 简化的RLE解压缩实现
    // 实际项目中应该使用专门的RLE解压缩库
    console.warn('RLE解压缩功能需要专门的解压缩库支持')
    throw new Error('RLE解压缩暂未实现')
  }

  /**
   * JPEG解压缩
   */
  private static decompressJPEG(dataset: any, pixelDataInfo: PixelDataInfo): Uint8Array {
    // 简化的JPEG解压缩实现
    // 实际项目中应该使用专门的JPEG解压缩库
    console.warn('JPEG解压缩功能需要专门的解压缩库支持')
    throw new Error('JPEG解压缩暂未实现')
  }

  /**
   * JPEG无损解压缩
   */
  private static decompressJPEGLossless(dataset: any, pixelDataInfo: PixelDataInfo): Uint8Array {
    console.warn('JPEG无损解压缩功能需要专门的解压缩库支持')
    throw new Error('JPEG无损解压缩暂未实现')
  }

  /**
   * JPEG2000解压缩
   */
  private static decompressJPEG2000(dataset: any, pixelDataInfo: PixelDataInfo): Uint8Array {
    console.warn('JPEG2000解压缩功能需要专门的解压缩库支持')
    throw new Error('JPEG2000解压缩暂未实现')
  }

  /**
   * 转换像素数据类型
   */
  private static convertPixelDataType(rawData: Uint8Array, pixelDataInfo: PixelDataInfo): Uint8Array | Uint16Array | Int16Array | Float32Array {
    const { bitsAllocated, pixelRepresentation } = pixelDataInfo

    if (bitsAllocated <= 8) {
      return rawData
    } else if (bitsAllocated <= 16) {
      const uint16Array = new Uint16Array(rawData.buffer, rawData.byteOffset, rawData.byteLength / 2)

      if (pixelRepresentation === 0) {
        return uint16Array
      } else {
        // 转换为有符号16位
        return new Int16Array(uint16Array.buffer, uint16Array.byteOffset, uint16Array.length)
      }
    } else if (bitsAllocated <= 32) {
      if (pixelRepresentation === 0) {
        return new Uint32Array(rawData.buffer, rawData.byteOffset, rawData.byteLength / 4) as any
      } else {
        return new Float32Array(rawData.buffer, rawData.byteOffset, rawData.byteLength / 4)
      }
    } else {
      throw new Error(`不支持的位深度: ${bitsAllocated}`)
    }
  }
  
  /**
   * 计算像素统计信息
   */
  private static calculatePixelStatistics(pixelData: Uint8Array | Uint16Array | Int16Array | Float32Array, pixelDataInfo: PixelDataInfo): {
    min: number
    max: number
    mean: number
    std: number
  } {
    if (pixelData.length === 0) {
      return { min: 0, max: 0, mean: 0, std: 0 }
    }

    let min = Number.MAX_VALUE
    let max = Number.MIN_VALUE
    let sum = 0

    // 计算最小值、最大值和总和
    for (let i = 0; i < pixelData.length; i++) {
      const value = pixelData[i]
      if (value < min) min = value
      if (value > max) max = value
      sum += value
    }

    const mean = sum / pixelData.length

    // 计算标准差
    let sumSquaredDiff = 0
    for (let i = 0; i < pixelData.length; i++) {
      const diff = pixelData[i] - mean
      sumSquaredDiff += diff * diff
    }

    const std = Math.sqrt(sumSquaredDiff / pixelData.length)

    return { min, max, mean, std }
  }

  /**
   * 生成直方图
   */
  private static generateHistogram(pixelData: Uint8Array | Uint16Array | Int16Array | Float32Array, pixelDataInfo: PixelDataInfo): number[] {
    const { bitsAllocated, pixelRepresentation } = pixelDataInfo

    // 确定直方图的bin数量
    let numBins: number
    if (bitsAllocated <= 8) {
      numBins = 256
    } else if (bitsAllocated <= 16) {
      numBins = pixelRepresentation === 0 ? 65536 : 32768
    } else {
      numBins = 1024 // 对于32位数据，使用较少的bin
    }

    const histogram = new Array(numBins).fill(0)

    // 计算像素值范围
    const stats = this.calculatePixelStatistics(pixelData, pixelDataInfo)
    const range = stats.max - stats.min

    if (range === 0) {
      histogram[0] = pixelData.length
      return histogram
    }

    // 填充直方图
    for (let i = 0; i < pixelData.length; i++) {
      const normalizedValue = (pixelData[i] - stats.min) / range
      const binIndex = Math.min(Math.floor(normalizedValue * (numBins - 1)), numBins - 1)
      histogram[binIndex]++
    }

    return histogram
  }

  /**
   * 创建增强的ImageData对象
   */
  private static createEnhancedImageData(
    pixelData: Uint8Array | Uint16Array | Int16Array | Float32Array,
    pixelDataInfo: PixelDataInfo,
    metadata: DicomMetadata
  ): ImageData {
    const width = pixelDataInfo.width
    const height = pixelDataInfo.height

    if (width === 0 || height === 0) {
      throw new Error('无效的图像尺寸')
    }

    // 处理多采样像素
    const samplesPerPixel = pixelDataInfo.samplesPerPixel
    const expectedPixelCount = width * height * samplesPerPixel

    if (pixelData.length < expectedPixelCount) {
      throw new Error(`像素数据不完整: 期望 ${expectedPixelCount} 个像素，实际 ${pixelData.length} 个`)
    }

    // 创建RGBA数据
    const rgbaData = new Uint8ClampedArray(width * height * 4)

    if (samplesPerPixel === 1) {
      // 灰度图像
      this.processMonochromeImage(pixelData, rgbaData, pixelDataInfo, metadata)
    } else if (samplesPerPixel === 3) {
      // RGB彩色图像
      this.processColorImage(pixelData, rgbaData, pixelDataInfo, metadata)
    } else {
      throw new Error(`不支持的采样数: ${samplesPerPixel}`)
    }

    return new ImageData(rgbaData, width, height)
  }

  /**
   * 处理单色图像
   */
  private static processMonochromeImage(
    pixelData: Uint8Array | Uint16Array | Int16Array | Float32Array,
    rgbaData: Uint8ClampedArray,
    pixelDataInfo: PixelDataInfo,
    metadata: DicomMetadata
  ): void {
    const { width, height, photometricInterpretation } = pixelDataInfo

    // 窗宽窗位参数
    const windowCenter = Array.isArray(metadata.windowCenter) ? metadata.windowCenter[0] : metadata.windowCenter || 128
    const windowWidth = Array.isArray(metadata.windowWidth) ? metadata.windowWidth[0] : metadata.windowWidth || 256
    const rescaleIntercept = metadata.rescaleIntercept || 0
    const rescaleSlope = metadata.rescaleSlope || 1

    // 计算窗宽窗位范围
    const windowMin = windowCenter - windowWidth / 2
    const windowMax = windowCenter + windowWidth / 2

    // 是否需要反转（MONOCHROME1）
    const invert = photometricInterpretation === 'MONOCHROME1'

    for (let i = 0; i < width * height; i++) {
      // 应用rescale变换
      let pixelValue = pixelData[i] * rescaleSlope + rescaleIntercept

      // 应用窗宽窗位
      if (pixelValue <= windowMin) {
        pixelValue = 0
      } else if (pixelValue >= windowMax) {
        pixelValue = 255
      } else {
        pixelValue = ((pixelValue - windowMin) / windowWidth) * 255
      }

      // 应用反转
      if (invert) {
        pixelValue = 255 - pixelValue
      }

      // 确保值在有效范围内
      pixelValue = Math.max(0, Math.min(255, Math.round(pixelValue)))

      // 设置RGBA值
      const rgbaIndex = i * 4
      rgbaData[rgbaIndex] = pixelValue     // R
      rgbaData[rgbaIndex + 1] = pixelValue // G
      rgbaData[rgbaIndex + 2] = pixelValue // B
      rgbaData[rgbaIndex + 3] = 255        // A
    }
  }

  /**
   * 处理彩色图像
   */
  private static processColorImage(
    pixelData: Uint8Array | Uint16Array | Int16Array | Float32Array,
    rgbaData: Uint8ClampedArray,
    pixelDataInfo: PixelDataInfo,
    metadata: DicomMetadata
  ): void {
    const { width, height, planarConfiguration } = pixelDataInfo
    const rescaleIntercept = metadata.rescaleIntercept || 0
    const rescaleSlope = metadata.rescaleSlope || 1

    for (let i = 0; i < width * height; i++) {
      let r: number, g: number, b: number

      if (planarConfiguration === 0) {
        // RGB交错存储 (RGBRGBRGB...)
        r = pixelData[i * 3] * rescaleSlope + rescaleIntercept
        g = pixelData[i * 3 + 1] * rescaleSlope + rescaleIntercept
        b = pixelData[i * 3 + 2] * rescaleSlope + rescaleIntercept
      } else {
        // RGB平面存储 (RRR...GGG...BBB...)
        const pixelCount = width * height
        r = pixelData[i] * rescaleSlope + rescaleIntercept
        g = pixelData[i + pixelCount] * rescaleSlope + rescaleIntercept
        b = pixelData[i + pixelCount * 2] * rescaleSlope + rescaleIntercept
      }

      // 确保值在有效范围内
      r = Math.max(0, Math.min(255, Math.round(r)))
      g = Math.max(0, Math.min(255, Math.round(g)))
      b = Math.max(0, Math.min(255, Math.round(b)))

      // 设置RGBA值
      const rgbaIndex = i * 4
      rgbaData[rgbaIndex] = r     // R
      rgbaData[rgbaIndex + 1] = g // G
      rgbaData[rgbaIndex + 2] = b // B
      rgbaData[rgbaIndex + 3] = 255 // A
    }
  }
  
  /**
   * 创建增强的Canvas元素
   */
  private static createEnhancedCanvas(imageData: ImageData, metadata: DicomMetadata): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = metadata.columns || 0
    canvas.height = metadata.rows || 0

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // 设置图像渲染质量
      ctx.imageSmoothingEnabled = false // 医学图像通常不需要平滑
      ctx.putImageData(imageData, 0, 0)
    }

    return canvas
  }

  /**
   * 获取支持的传输语法列表
   */
  static getSupportedTransferSyntaxes(): string[] {
    return [
      TRANSFER_SYNTAXES.IMPLICIT_VR_LITTLE_ENDIAN,
      TRANSFER_SYNTAXES.EXPLICIT_VR_LITTLE_ENDIAN,
      TRANSFER_SYNTAXES.EXPLICIT_VR_BIG_ENDIAN,
      TRANSFER_SYNTAXES.DEFLATED_EXPLICIT_VR_LITTLE_ENDIAN
      // 压缩格式需要额外的解压缩库支持
    ]
  }

  /**
   * 检查传输语法是否支持
   */
  static isTransferSyntaxSupported(transferSyntaxUID: string): boolean {
    return this.getSupportedTransferSyntaxes().includes(transferSyntaxUID)
  }

  /**
   * 获取传输语法描述
   */
  static getTransferSyntaxDescription(transferSyntaxUID: string): string {
    const descriptions: Record<string, string> = {
      [TRANSFER_SYNTAXES.IMPLICIT_VR_LITTLE_ENDIAN]: 'Implicit VR Little Endian',
      [TRANSFER_SYNTAXES.EXPLICIT_VR_LITTLE_ENDIAN]: 'Explicit VR Little Endian',
      [TRANSFER_SYNTAXES.EXPLICIT_VR_BIG_ENDIAN]: 'Explicit VR Big Endian',
      [TRANSFER_SYNTAXES.DEFLATED_EXPLICIT_VR_LITTLE_ENDIAN]: 'Deflated Explicit VR Little Endian',
      [TRANSFER_SYNTAXES.JPEG_BASELINE_1]: 'JPEG Baseline (Process 1)',
      [TRANSFER_SYNTAXES.JPEG_EXTENDED_2_4]: 'JPEG Extended (Process 2 & 4)',
      [TRANSFER_SYNTAXES.JPEG_LOSSLESS_14]: 'JPEG Lossless (Process 14)',
      [TRANSFER_SYNTAXES.JPEG_LOSSLESS_14_1]: 'JPEG Lossless (Process 14, Selection Value 1)',
      [TRANSFER_SYNTAXES.JPEG_LS_LOSSLESS]: 'JPEG-LS Lossless',
      [TRANSFER_SYNTAXES.JPEG_LS_LOSSY]: 'JPEG-LS Lossy',
      [TRANSFER_SYNTAXES.JPEG_2000_LOSSLESS]: 'JPEG 2000 Lossless',
      [TRANSFER_SYNTAXES.JPEG_2000_LOSSY]: 'JPEG 2000 Lossy',
      [TRANSFER_SYNTAXES.RLE_LOSSLESS]: 'RLE Lossless'
    }

    return descriptions[transferSyntaxUID] || `Unknown (${transferSyntaxUID})`
  }
  
  /**
   * 应用增强的窗宽窗位调整
   */
  static applyEnhancedWindowLevel(dicomImage: DicomImage, windowCenter: number, windowWidth: number, invert = false): void {
    if (!dicomImage.imageData || !dicomImage.pixelData) return

    const { pixelDataInfo, metadata } = dicomImage
    const { width, height, photometricInterpretation, samplesPerPixel } = pixelDataInfo

    if (samplesPerPixel !== 1) {
      console.warn('窗宽窗位调整仅适用于灰度图像')
      return
    }

    const rgbaData = dicomImage.imageData.data
    const rescaleIntercept = metadata.rescaleIntercept || 0
    const rescaleSlope = metadata.rescaleSlope || 1

    const windowMin = windowCenter - windowWidth / 2
    const windowMax = windowCenter + windowWidth / 2

    // 是否需要反转
    const shouldInvert = invert || photometricInterpretation === 'MONOCHROME1'

    for (let i = 0; i < width * height; i++) {
      let pixelValue = dicomImage.pixelData[i] * rescaleSlope + rescaleIntercept

      // 应用窗宽窗位
      if (pixelValue <= windowMin) {
        pixelValue = 0
      } else if (pixelValue >= windowMax) {
        pixelValue = 255
      } else {
        pixelValue = ((pixelValue - windowMin) / windowWidth) * 255
      }

      // 应用反转
      if (shouldInvert) {
        pixelValue = 255 - pixelValue
      }

      // 确保值在有效范围内
      pixelValue = Math.max(0, Math.min(255, Math.round(pixelValue)))

      const rgbaIndex = i * 4
      rgbaData[rgbaIndex] = pixelValue
      rgbaData[rgbaIndex + 1] = pixelValue
      rgbaData[rgbaIndex + 2] = pixelValue
    }

    // 更新canvas
    if (dicomImage.canvas) {
      const ctx = dicomImage.canvas.getContext('2d')
      if (ctx) {
        ctx.imageSmoothingEnabled = false
        ctx.putImageData(dicomImage.imageData, 0, 0)
      }
    }
  }

  /**
   * 应用LUT（查找表）
   */
  static applyLUT(dicomImage: DicomImage, lut: Uint8Array): void {
    if (!dicomImage.imageData || !dicomImage.pixelData) return

    const { pixelDataInfo } = dicomImage
    const { width, height, samplesPerPixel } = pixelDataInfo

    if (samplesPerPixel !== 1) {
      console.warn('LUT仅适用于灰度图像')
      return
    }

    const rgbaData = dicomImage.imageData.data

    for (let i = 0; i < width * height; i++) {
      const pixelValue = Math.max(0, Math.min(lut.length - 1, Math.round(dicomImage.pixelData[i])))
      const lutValue = lut[pixelValue]

      const rgbaIndex = i * 4
      rgbaData[rgbaIndex] = lutValue
      rgbaData[rgbaIndex + 1] = lutValue
      rgbaData[rgbaIndex + 2] = lutValue
    }

    // 更新canvas
    if (dicomImage.canvas) {
      const ctx = dicomImage.canvas.getContext('2d')
      if (ctx) {
        ctx.imageSmoothingEnabled = false
        ctx.putImageData(dicomImage.imageData, 0, 0)
      }
    }
  }

  /**
   * 创建预设窗宽窗位
   */
  static createPresetWindowLevels(metadata: DicomMetadata): Array<{ name: string; center: number; width: number }> {
    const presets: Array<{ name: string; center: number; width: number }> = []

    // 从DICOM元数据获取预设值
    const windowCenter = metadata.windowCenter
    const windowWidth = metadata.windowWidth

    if (windowCenter && windowWidth) {
      const centers = Array.isArray(windowCenter) ? windowCenter : [windowCenter]
      const widths = Array.isArray(windowWidth) ? windowWidth : [windowWidth]

      for (let i = 0; i < Math.min(centers.length, widths.length); i++) {
        presets.push({
          name: `预设 ${i + 1}`,
          center: centers[i],
          width: widths[i]
        })
      }
    }

    // 根据模态添加常用预设
    const modality = metadata.modality
    switch (modality) {
      case 'CT':
        presets.push(
          { name: '肺窗', center: -600, width: 1600 },
          { name: '纵隔窗', center: 50, width: 350 },
          { name: '骨窗', center: 400, width: 1800 },
          { name: '脑窗', center: 40, width: 80 },
          { name: '肝窗', center: 60, width: 160 }
        )
        break
      case 'MR':
        presets.push(
          { name: 'T1窗', center: 500, width: 1000 },
          { name: 'T2窗', center: 1000, width: 2000 },
          { name: 'FLAIR窗', center: 800, width: 1600 }
        )
        break
      case 'XA':
      case 'RF':
        presets.push(
          { name: '血管窗', center: 128, width: 256 }
        )
        break
    }

    return presets
  }

  /**
   * 获取像素值（考虑rescale变换）
   */
  static getPixelValue(dicomImage: DicomImage, x: number, y: number): number | null {
    const { pixelDataInfo, metadata } = dicomImage
    const { width, height } = pixelDataInfo

    if (x < 0 || x >= width || y < 0 || y >= height) {
      return null
    }

    const index = y * width + x
    if (index >= dicomImage.pixelData.length) {
      return null
    }

    const rawValue = dicomImage.pixelData[index]
    const rescaleSlope = metadata.rescaleSlope || 1
    const rescaleIntercept = metadata.rescaleIntercept || 0

    return rawValue * rescaleSlope + rescaleIntercept
  }

  /**
   * 获取Hounsfield单位值（仅适用于CT）
   */
  static getHounsfieldValue(dicomImage: DicomImage, x: number, y: number): number | null {
    if (dicomImage.metadata.modality !== 'CT') {
      return null
    }

    return this.getPixelValue(dicomImage, x, y)
  }

  // 保持向后兼容的旧方法
  static applyWindowLevel = this.applyEnhancedWindowLevel
}
