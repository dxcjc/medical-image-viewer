import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 工具类型枚举
export enum ToolType {
  PAN = 'pan',
  ZOOM = 'zoom',
  WINDOW_LEVEL = 'windowLevel',
  LENGTH = 'length',
  ANGLE = 'angle',
  RECTANGLE = 'rectangle',
  ELLIPSE = 'ellipse',
  ARROW = 'arrow',
  TEXT = 'text',
  FREEHAND = 'freehand'
}

// 工具配置接口
export interface ToolConfig {
  type: ToolType
  name: string
  icon: string
  description: string
  enabled: boolean
  options?: Record<string, any>
}

// 测量数据接口
export interface Measurement {
  id: string
  type: ToolType
  viewportId: string
  imageId: string
  data: any
  value?: number
  unit?: string
  label?: string
  created: Date
  modified: Date
}

// 标注数据接口
export interface Annotation {
  id: string
  type: ToolType
  viewportId: string
  imageId: string
  data: any
  text?: string
  color?: string
  created: Date
  modified: Date
}

// 点坐标接口
export interface Point {
  x: number
  y: number
}

// 长度测量数据
export interface LengthMeasurement extends Measurement {
  type: ToolType.LENGTH
  data: {
    startPoint: Point
    endPoint: Point
  }
  value: number // 长度值
  unit: string // 单位 (mm, px)
}

// 角度测量数据
export interface AngleMeasurement extends Measurement {
  type: ToolType.ANGLE
  data: {
    point1: Point
    vertex: Point
    point2: Point
  }
  value: number // 角度值（度）
  unit: string // 单位 (°)
}

// 矩形测量数据
export interface RectangleMeasurement extends Measurement {
  type: ToolType.RECTANGLE
  data: {
    startPoint: Point
    endPoint: Point
  }
  value: number // 面积值
  unit: string // 单位 (mm², px²)
}

export const useToolStore = defineStore('tool', () => {
  // 状态
  const activeTool = ref<ToolType>(ToolType.PAN)
  const toolConfigs = ref(new Map<ToolType, ToolConfig>())
  const measurements = ref(new Map<string, Measurement[]>())
  const annotations = ref(new Map<string, Annotation[]>())
  const isDrawing = ref(false)
  const currentMeasurement = ref<Measurement | null>(null)
  const currentAnnotation = ref<Annotation | null>(null)

  // 初始化工具配置
  const initializeTools = () => {
    const defaultTools: ToolConfig[] = [
      {
        type: ToolType.PAN,
        name: '平移',
        icon: 'Rank',
        description: '平移图像',
        enabled: true
      },
      {
        type: ToolType.ZOOM,
        name: '缩放',
        icon: 'ZoomIn',
        description: '缩放图像',
        enabled: true
      },
      {
        type: ToolType.WINDOW_LEVEL,
        name: '窗宽窗位',
        icon: 'Operation',
        description: '调节窗宽窗位',
        enabled: true
      },
      {
        type: ToolType.LENGTH,
        name: '长度测量',
        icon: 'Minus',
        description: '测量长度',
        enabled: true,
        options: {
          showLabel: true,
          precision: 2
        }
      },
      {
        type: ToolType.ANGLE,
        name: '角度测量',
        icon: 'Sort',
        description: '测量角度',
        enabled: true,
        options: {
          showLabel: true,
          precision: 1
        }
      },
      {
        type: ToolType.RECTANGLE,
        name: '矩形测量',
        icon: 'Grid',
        description: '测量矩形面积',
        enabled: true,
        options: {
          showLabel: true,
          precision: 2
        }
      },
      {
        type: ToolType.ELLIPSE,
        name: '椭圆测量',
        icon: 'CirclePlus',
        description: '测量椭圆面积',
        enabled: true,
        options: {
          showLabel: true,
          precision: 2
        }
      },
      {
        type: ToolType.ARROW,
        name: '箭头标注',
        icon: 'Right',
        description: '添加箭头标注',
        enabled: true,
        options: {
          color: '#ffff00',
          thickness: 2
        }
      },
      {
        type: ToolType.TEXT,
        name: '文本标注',
        icon: 'EditPen',
        description: '添加文本标注',
        enabled: true,
        options: {
          color: '#ffff00',
          fontSize: 14
        }
      },
      {
        type: ToolType.FREEHAND,
        name: '自由绘制',
        icon: 'Edit',
        description: '自由绘制标注',
        enabled: true,
        options: {
          color: '#ffff00',
          thickness: 2
        }
      }
    ]

    defaultTools.forEach(tool => {
      toolConfigs.value.set(tool.type, tool)
    })
  }

  // 计算属性
  const availableTools = computed(() =>
    Array.from(toolConfigs.value.values()).filter(tool => tool.enabled)
  )

  const activeToolConfig = computed(() => toolConfigs.value.get(activeTool.value))

  const isMeasurementTool = computed(() =>
    [ToolType.LENGTH, ToolType.ANGLE, ToolType.RECTANGLE, ToolType.ELLIPSE].includes(
      activeTool.value
    )
  )

  const isAnnotationTool = computed(() =>
    [ToolType.ARROW, ToolType.TEXT, ToolType.FREEHAND].includes(activeTool.value)
  )

  // 工具操作方法
  const setActiveTool = (tool: ToolType) => {
    if (toolConfigs.value.has(tool) && toolConfigs.value.get(tool)?.enabled) {
      activeTool.value = tool
      isDrawing.value = false
      currentMeasurement.value = null
      currentAnnotation.value = null
    }
  }

  const enableTool = (tool: ToolType) => {
    const config = toolConfigs.value.get(tool)
    if (config) {
      config.enabled = true
    }
  }

  const disableTool = (tool: ToolType) => {
    const config = toolConfigs.value.get(tool)
    if (config) {
      config.enabled = false
      // 如果禁用的是当前工具，切换到平移工具
      if (activeTool.value === tool) {
        setActiveTool(ToolType.PAN)
      }
    }
  }

  const updateToolConfig = (tool: ToolType, updates: Partial<ToolConfig>) => {
    const config = toolConfigs.value.get(tool)
    if (config) {
      Object.assign(config, updates)
    }
  }

  // 测量相关方法
  const addMeasurement = (imageId: string, measurement: Measurement) => {
    if (!measurements.value.has(imageId)) {
      measurements.value.set(imageId, [])
    }
    measurements.value.get(imageId)!.push(measurement)
  }

  const removeMeasurement = (imageId: string, measurementId: string) => {
    const imageMeasurements = measurements.value.get(imageId)
    if (imageMeasurements) {
      const index = imageMeasurements.findIndex(m => m.id === measurementId)
      if (index > -1) {
        imageMeasurements.splice(index, 1)
      }
    }
  }

  const updateMeasurement = (
    imageId: string,
    measurementId: string,
    updates: Partial<Measurement>
  ) => {
    const imageMeasurements = measurements.value.get(imageId)
    if (imageMeasurements) {
      const measurement = imageMeasurements.find(m => m.id === measurementId)
      if (measurement) {
        Object.assign(measurement, updates)
        measurement.modified = new Date()
      }
    }
  }

  const getMeasurements = (imageId: string): Measurement[] => {
    return measurements.value.get(imageId) || []
  }

  const clearMeasurements = (imageId: string) => {
    measurements.value.delete(imageId)
  }

  // 标注相关方法
  const addAnnotation = (imageId: string, annotation: Annotation) => {
    if (!annotations.value.has(imageId)) {
      annotations.value.set(imageId, [])
    }
    annotations.value.get(imageId)!.push(annotation)
  }

  const removeAnnotation = (imageId: string, annotationId: string) => {
    const imageAnnotations = annotations.value.get(imageId)
    if (imageAnnotations) {
      const index = imageAnnotations.findIndex(a => a.id === annotationId)
      if (index > -1) {
        imageAnnotations.splice(index, 1)
      }
    }
  }

  const updateAnnotation = (
    imageId: string,
    annotationId: string,
    updates: Partial<Annotation>
  ) => {
    const imageAnnotations = annotations.value.get(imageId)
    if (imageAnnotations) {
      const annotation = imageAnnotations.find(a => a.id === annotationId)
      if (annotation) {
        Object.assign(annotation, updates)
        annotation.modified = new Date()
      }
    }
  }

  const getAnnotations = (imageId: string): Annotation[] => {
    return annotations.value.get(imageId) || []
  }

  const clearAnnotations = (imageId: string) => {
    annotations.value.delete(imageId)
  }

  // 绘制状态管理
  const startDrawing = (measurement?: Measurement, annotation?: Annotation) => {
    isDrawing.value = true
    currentMeasurement.value = measurement || null
    currentAnnotation.value = annotation || null
  }

  const stopDrawing = () => {
    isDrawing.value = false
    currentMeasurement.value = null
    currentAnnotation.value = null
  }

  // 工具辅助方法
  const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const calculateDistance = (point1: Point, point2: Point): number => {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  const calculateAngle = (point1: Point, vertex: Point, point2: Point): number => {
    const vector1 = { x: point1.x - vertex.x, y: point1.y - vertex.y }
    const vector2 = { x: point2.x - vertex.x, y: point2.y - vertex.y }

    const dot = vector1.x * vector2.x + vector1.y * vector2.y
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y)
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y)

    const cosAngle = dot / (mag1 * mag2)
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI)
  }

  const calculateRectangleArea = (startPoint: Point, endPoint: Point): number => {
    const width = Math.abs(endPoint.x - startPoint.x)
    const height = Math.abs(endPoint.y - startPoint.y)
    return width * height
  }

  // 清理所有数据
  const clearAll = () => {
    measurements.value.clear()
    annotations.value.clear()
    isDrawing.value = false
    currentMeasurement.value = null
    currentAnnotation.value = null
    setActiveTool(ToolType.PAN)
  }

  // 初始化工具
  initializeTools()

  return {
    // 状态
    activeTool,
    toolConfigs,
    measurements,
    annotations,
    isDrawing,
    currentMeasurement,
    currentAnnotation,

    // 计算属性
    availableTools,
    activeToolConfig,
    isMeasurementTool,
    isAnnotationTool,

    // 方法
    setActiveTool,
    enableTool,
    disableTool,
    updateToolConfig,
    addMeasurement,
    removeMeasurement,
    updateMeasurement,
    getMeasurements,
    clearMeasurements,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    getAnnotations,
    clearAnnotations,
    startDrawing,
    stopDrawing,
    generateId,
    calculateDistance,
    calculateAngle,
    calculateRectangleArea,
    clearAll
  }
})
