/**
 * 图像插值算法实现
 * 用于医学影像的高质量缩放和显示
 */

export enum InterpolationType {
  NEAREST_NEIGHBOR = 'nearest',
  BILINEAR = 'bilinear',
  BICUBIC = 'bicubic'
}

export interface InterpolationOptions {
  type: InterpolationType
  preserveAspectRatio: boolean
  antiAliasing: boolean
}

export class ImageInterpolation {
  /**
   * 最近邻插值
   * 适用于需要保持像素值精确性的医学影像
   */
  static nearestNeighbor(
    sourceData: Uint8Array | Uint16Array | Int16Array | Float32Array,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): Float32Array {
    const result = new Float32Array(targetWidth * targetHeight)
    
    const scaleX = sourceWidth / targetWidth
    const scaleY = sourceHeight / targetHeight
    
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const sourceX = Math.floor(x * scaleX)
        const sourceY = Math.floor(y * scaleY)
        
        const sourceIndex = sourceY * sourceWidth + sourceX
        const targetIndex = y * targetWidth + x
        
        result[targetIndex] = sourceData[sourceIndex]
      }
    }
    
    return result
  }

  /**
   * 双线性插值
   * 提供平滑的缩放效果，适用于一般医学影像显示
   */
  static bilinear(
    sourceData: Uint8Array | Uint16Array | Int16Array | Float32Array,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): Float32Array {
    const result = new Float32Array(targetWidth * targetHeight)
    
    const scaleX = (sourceWidth - 1) / (targetWidth - 1)
    const scaleY = (sourceHeight - 1) / (targetHeight - 1)
    
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const sourceX = x * scaleX
        const sourceY = y * scaleY
        
        const x1 = Math.floor(sourceX)
        const y1 = Math.floor(sourceY)
        const x2 = Math.min(x1 + 1, sourceWidth - 1)
        const y2 = Math.min(y1 + 1, sourceHeight - 1)
        
        const dx = sourceX - x1
        const dy = sourceY - y1
        
        // 获取四个邻近像素值
        const p11 = sourceData[y1 * sourceWidth + x1]
        const p12 = sourceData[y1 * sourceWidth + x2]
        const p21 = sourceData[y2 * sourceWidth + x1]
        const p22 = sourceData[y2 * sourceWidth + x2]
        
        // 双线性插值计算
        const interpolatedValue = 
          p11 * (1 - dx) * (1 - dy) +
          p12 * dx * (1 - dy) +
          p21 * (1 - dx) * dy +
          p22 * dx * dy
        
        const targetIndex = y * targetWidth + x
        result[targetIndex] = interpolatedValue
      }
    }
    
    return result
  }

  /**
   * 双三次插值
   * 提供最高质量的缩放效果，适用于高精度医学影像分析
   */
  static bicubic(
    sourceData: Uint8Array | Uint16Array | Int16Array | Float32Array,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number
  ): Float32Array {
    const result = new Float32Array(targetWidth * targetHeight)
    
    const scaleX = (sourceWidth - 1) / (targetWidth - 1)
    const scaleY = (sourceHeight - 1) / (targetHeight - 1)
    
    // 三次插值核函数
    const cubicKernel = (t: number): number => {
      const a = -0.5
      const absT = Math.abs(t)
      
      if (absT <= 1) {
        return (a + 2) * absT * absT * absT - (a + 3) * absT * absT + 1
      } else if (absT <= 2) {
        return a * absT * absT * absT - 5 * a * absT * absT + 8 * a * absT - 4 * a
      } else {
        return 0
      }
    }
    
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const sourceX = x * scaleX
        const sourceY = y * scaleY
        
        const x0 = Math.floor(sourceX)
        const y0 = Math.floor(sourceY)
        
        let interpolatedValue = 0
        let weightSum = 0
        
        // 4x4邻域插值
        for (let dy = -1; dy <= 2; dy++) {
          for (let dx = -1; dx <= 2; dx++) {
            const sx = x0 + dx
            const sy = y0 + dy
            
            if (sx >= 0 && sx < sourceWidth && sy >= 0 && sy < sourceHeight) {
              const weight = cubicKernel(sourceX - sx) * cubicKernel(sourceY - sy)
              const pixelValue = sourceData[sy * sourceWidth + sx]
              
              interpolatedValue += weight * pixelValue
              weightSum += weight
            }
          }
        }
        
        const targetIndex = y * targetWidth + x
        result[targetIndex] = weightSum > 0 ? interpolatedValue / weightSum : 0
      }
    }
    
    return result
  }

  /**
   * 通用插值方法
   */
  static interpolate(
    sourceData: Uint8Array | Uint16Array | Int16Array | Float32Array,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    type: InterpolationType = InterpolationType.BILINEAR
  ): Float32Array {
    switch (type) {
      case InterpolationType.NEAREST_NEIGHBOR:
        return this.nearestNeighbor(sourceData, sourceWidth, sourceHeight, targetWidth, targetHeight)
      case InterpolationType.BILINEAR:
        return this.bilinear(sourceData, sourceWidth, sourceHeight, targetWidth, targetHeight)
      case InterpolationType.BICUBIC:
        return this.bicubic(sourceData, sourceWidth, sourceHeight, targetWidth, targetHeight)
      default:
        throw new Error(`不支持的插值类型: ${type}`)
    }
  }

  /**
   * 创建缩放后的ImageData
   */
  static createScaledImageData(
    sourceImageData: ImageData,
    targetWidth: number,
    targetHeight: number,
    type: InterpolationType = InterpolationType.BILINEAR
  ): ImageData {
    const sourceWidth = sourceImageData.width
    const sourceHeight = sourceImageData.height
    const sourceData = sourceImageData.data
    
    // 提取灰度数据（假设是灰度图像）
    const grayscaleData = new Float32Array(sourceWidth * sourceHeight)
    for (let i = 0; i < grayscaleData.length; i++) {
      grayscaleData[i] = sourceData[i * 4] // 使用R通道
    }
    
    // 执行插值
    const interpolatedData = this.interpolate(
      grayscaleData,
      sourceWidth,
      sourceHeight,
      targetWidth,
      targetHeight,
      type
    )
    
    // 创建新的ImageData
    const targetImageData = new ImageData(targetWidth, targetHeight)
    const targetData = targetImageData.data
    
    for (let i = 0; i < interpolatedData.length; i++) {
      const value = Math.max(0, Math.min(255, Math.round(interpolatedData[i])))
      const rgbaIndex = i * 4
      
      targetData[rgbaIndex] = value     // R
      targetData[rgbaIndex + 1] = value // G
      targetData[rgbaIndex + 2] = value // B
      targetData[rgbaIndex + 3] = 255   // A
    }
    
    return targetImageData
  }

  /**
   * 计算最佳插值类型
   * 根据缩放比例和性能要求选择合适的插值算法
   */
  static getBestInterpolationType(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    performanceMode = false
  ): InterpolationType {
    const scaleX = targetWidth / sourceWidth
    const scaleY = targetHeight / sourceHeight
    const scale = Math.max(scaleX, scaleY)
    
    if (performanceMode) {
      return InterpolationType.NEAREST_NEIGHBOR
    }
    
    if (scale >= 2) {
      // 放大时使用双三次插值获得更好的质量
      return InterpolationType.BICUBIC
    } else if (scale <= 0.5) {
      // 缩小时使用双线性插值避免混叠
      return InterpolationType.BILINEAR
    } else {
      // 接近1:1时使用双线性插值
      return InterpolationType.BILINEAR
    }
  }

  /**
   * 抗锯齿处理
   */
  static applyAntiAliasing(
    imageData: ImageData,
    strength = 0.5
  ): ImageData {
    const width = imageData.width
    const height = imageData.height
    const sourceData = imageData.data
    const resultData = new Uint8ClampedArray(sourceData.length)
    
    // 简单的高斯模糊抗锯齿
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ]
    const kernelSum = 16
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4
            const weight = kernel[ky + 1][kx + 1]
            
            r += sourceData[pixelIndex] * weight
            g += sourceData[pixelIndex + 1] * weight
            b += sourceData[pixelIndex + 2] * weight
          }
        }
        
        const targetIndex = (y * width + x) * 4
        const originalIndex = targetIndex
        
        // 混合原始值和模糊值
        resultData[targetIndex] = Math.round(
          sourceData[originalIndex] * (1 - strength) + (r / kernelSum) * strength
        )
        resultData[targetIndex + 1] = Math.round(
          sourceData[originalIndex + 1] * (1 - strength) + (g / kernelSum) * strength
        )
        resultData[targetIndex + 2] = Math.round(
          sourceData[originalIndex + 2] * (1 - strength) + (b / kernelSum) * strength
        )
        resultData[targetIndex + 3] = sourceData[originalIndex + 3]
      }
    }
    
    // 复制边缘像素
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          const index = (y * width + x) * 4
          resultData[index] = sourceData[index]
          resultData[index + 1] = sourceData[index + 1]
          resultData[index + 2] = sourceData[index + 2]
          resultData[index + 3] = sourceData[index + 3]
        }
      }
    }
    
    return new ImageData(resultData, width, height)
  }
}
