import * as dcmjs from 'dcmjs'

export interface DicomMetadata {
  patientName?: string
  patientId?: string
  studyDate?: string
  studyTime?: string
  modality?: string
  studyDescription?: string
  seriesDescription?: string
  instanceNumber?: number
  sliceThickness?: number
  pixelSpacing?: number[]
  rows?: number
  columns?: number
  bitsAllocated?: number
  bitsStored?: number
  samplesPerPixel?: number
  photometricInterpretation?: string
  windowCenter?: number | number[]
  windowWidth?: number | number[]
  rescaleIntercept?: number
  rescaleSlope?: number
}

export interface DicomImage {
  metadata: DicomMetadata
  pixelData: Uint8Array | Uint16Array | Int16Array
  imageData?: ImageData
  canvas?: HTMLCanvasElement
  width: number
  height: number
}

export class DicomParser {
  /**
   * 解析DICOM文件
   */
  static async parseDicomFile(file: File): Promise<DicomImage> {
    try {
      console.log('开始解析DICOM文件:', file.name)
      
      // 读取文件数据
      const arrayBuffer = await file.arrayBuffer()
      const byteArray = new Uint8Array(arrayBuffer)
      
      // 使用dcmjs解析DICOM数据
      const dataSet = dcmjs.data.DicomMessage.readFile(byteArray)
      const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dataSet.dict)
      
      console.log('DICOM数据集:', dataset)
      
      // 提取元数据
      const metadata = this.extractMetadata(dataset)
      
      // 提取像素数据
      const pixelData = this.extractPixelData(dataset)
      
      // 创建图像数据
      const imageData = this.createImageData(pixelData, metadata)
      
      // 创建Canvas
      const canvas = this.createCanvas(imageData, metadata)
      
      const dicomImage: DicomImage = {
        metadata,
        pixelData,
        imageData,
        canvas,
        width: metadata.columns || 0,
        height: metadata.rows || 0
      }
      
      console.log('DICOM解析完成:', dicomImage)
      return dicomImage
      
    } catch (error) {
      console.error('DICOM解析失败:', error)
      throw new Error(`DICOM文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  /**
   * 提取DICOM元数据
   */
  private static extractMetadata(dataset: any): DicomMetadata {
    return {
      patientName: dataset.PatientName?.Alphabetic || 'Unknown',
      patientId: dataset.PatientID || '',
      studyDate: dataset.StudyDate || '',
      studyTime: dataset.StudyTime || '',
      modality: dataset.Modality || '',
      studyDescription: dataset.StudyDescription || '',
      seriesDescription: dataset.SeriesDescription || '',
      instanceNumber: dataset.InstanceNumber || 1,
      sliceThickness: dataset.SliceThickness || 0,
      pixelSpacing: dataset.PixelSpacing || [1, 1],
      rows: dataset.Rows || 0,
      columns: dataset.Columns || 0,
      bitsAllocated: dataset.BitsAllocated || 8,
      bitsStored: dataset.BitsStored || 8,
      samplesPerPixel: dataset.SamplesPerPixel || 1,
      photometricInterpretation: dataset.PhotometricInterpretation || 'MONOCHROME2',
      windowCenter: dataset.WindowCenter || 128,
      windowWidth: dataset.WindowWidth || 256,
      rescaleIntercept: dataset.RescaleIntercept || 0,
      rescaleSlope: dataset.RescaleSlope || 1
    }
  }
  
  /**
   * 提取像素数据
   */
  private static extractPixelData(dataset: any): Uint8Array | Uint16Array | Int16Array {
    const pixelDataElement = dataset.PixelData
    
    if (!pixelDataElement) {
      throw new Error('未找到像素数据')
    }
    
    // 根据位深度选择合适的数组类型
    const bitsAllocated = dataset.BitsAllocated || 8
    
    if (bitsAllocated <= 8) {
      return new Uint8Array(pixelDataElement)
    } else if (bitsAllocated <= 16) {
      const pixelRepresentation = dataset.PixelRepresentation || 0
      if (pixelRepresentation === 0) {
        return new Uint16Array(pixelDataElement)
      } else {
        return new Int16Array(pixelDataElement)
      }
    } else {
      throw new Error(`不支持的位深度: ${bitsAllocated}`)
    }
  }
  
  /**
   * 创建ImageData对象
   */
  private static createImageData(pixelData: Uint8Array | Uint16Array | Int16Array, metadata: DicomMetadata): ImageData {
    const width = metadata.columns || 0
    const height = metadata.rows || 0
    
    if (width === 0 || height === 0) {
      throw new Error('无效的图像尺寸')
    }
    
    // 创建RGBA数据
    const rgbaData = new Uint8ClampedArray(width * height * 4)
    
    // 窗宽窗位参数
    const windowCenter = Array.isArray(metadata.windowCenter) ? metadata.windowCenter[0] : metadata.windowCenter || 128
    const windowWidth = Array.isArray(metadata.windowWidth) ? metadata.windowWidth[0] : metadata.windowWidth || 256
    const rescaleIntercept = metadata.rescaleIntercept || 0
    const rescaleSlope = metadata.rescaleSlope || 1
    
    // 计算窗宽窗位范围
    const windowMin = windowCenter - windowWidth / 2
    const windowMax = windowCenter + windowWidth / 2
    
    // 转换像素数据到RGBA
    for (let i = 0; i < pixelData.length; i++) {
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
      
      // 设置RGBA值
      const rgbaIndex = i * 4
      rgbaData[rgbaIndex] = pixelValue     // R
      rgbaData[rgbaIndex + 1] = pixelValue // G
      rgbaData[rgbaIndex + 2] = pixelValue // B
      rgbaData[rgbaIndex + 3] = 255        // A
    }
    
    return new ImageData(rgbaData, width, height)
  }
  
  /**
   * 创建Canvas元素
   */
  private static createCanvas(imageData: ImageData, metadata: DicomMetadata): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = metadata.columns || 0
    canvas.height = metadata.rows || 0
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.putImageData(imageData, 0, 0)
    }
    
    return canvas
  }
  
  /**
   * 应用窗宽窗位调整
   */
  static applyWindowLevel(dicomImage: DicomImage, windowCenter: number, windowWidth: number): void {
    const { pixelData, metadata } = dicomImage
    const width = metadata.columns || 0
    const height = metadata.rows || 0
    
    if (!dicomImage.imageData) return
    
    const rgbaData = dicomImage.imageData.data
    const rescaleIntercept = metadata.rescaleIntercept || 0
    const rescaleSlope = metadata.rescaleSlope || 1
    
    const windowMin = windowCenter - windowWidth / 2
    const windowMax = windowCenter + windowWidth / 2
    
    for (let i = 0; i < pixelData.length; i++) {
      let pixelValue = pixelData[i] * rescaleSlope + rescaleIntercept
      
      if (pixelValue <= windowMin) {
        pixelValue = 0
      } else if (pixelValue >= windowMax) {
        pixelValue = 255
      } else {
        pixelValue = ((pixelValue - windowMin) / windowWidth) * 255
      }
      
      const rgbaIndex = i * 4
      rgbaData[rgbaIndex] = pixelValue
      rgbaData[rgbaIndex + 1] = pixelValue
      rgbaData[rgbaIndex + 2] = pixelValue
    }
    
    // 更新canvas
    if (dicomImage.canvas) {
      const ctx = dicomImage.canvas.getContext('2d')
      if (ctx) {
        ctx.putImageData(dicomImage.imageData, 0, 0)
      }
    }
  }
}
