// 导出所有类型定义

// 基础类型
export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

// DICOM相关类型
export interface DicomMetadata {
  patientName?: string
  patientID?: string
  studyDate?: string
  studyTime?: string
  modality?: string
  studyDescription?: string
  seriesDescription?: string
  institutionName?: string
  rows?: number
  columns?: number
  bitsAllocated?: number
  bitsStored?: number
  pixelSpacing?: number[]
  windowCenter?: number[]
  windowWidth?: number[]
  rescaleIntercept?: number
  rescaleSlope?: number
  [key: string]: any
}

export interface DicomImage {
  id: string
  sopInstanceUID: string
  studyInstanceUID: string
  seriesInstanceUID: string
  patientName?: string
  studyDate?: string
  modality?: string
  width: number
  height: number
  pixelData?: ArrayBuffer
  metadata?: DicomMetadata
  file?: File
  loadedAt: Date
}

export interface Study {
  studyInstanceUID: string
  patientName?: string
  patientID?: string
  studyDate?: string
  studyTime?: string
  studyDescription?: string
  modality?: string
  seriesCount: number
  imageCount: number
  series: Series[]
}

export interface Series {
  seriesInstanceUID: string
  studyInstanceUID: string
  seriesNumber?: number
  seriesDescription?: string
  modality?: string
  imageCount: number
  images: DicomImage[]
}

// 视口相关类型
export interface Viewport {
  id: string
  element?: HTMLElement
  scale: number
  translation: Point
  rotation: number
  windowLevel: { center: number; width: number }
  invert: boolean
  flipHorizontal: boolean
  flipVertical: boolean
  interpolation: 'nearest' | 'linear'
  colormap?: string
}

export interface ViewportLayout {
  rows: number
  columns: number
  activeViewport: number
}

// 工具相关类型
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

export interface ToolConfig {
  type: ToolType
  name: string
  icon: string
  description: string
  enabled: boolean
  options?: Record<string, any>
}

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

// 渲染相关类型
export interface RenderOptions {
  interpolation: 'nearest' | 'linear'
  colormap?: string
  invert: boolean
  windowLevel: { center: number; width: number }
}

export interface ImageRenderer {
  render(element: HTMLElement, image: DicomImage, viewport: Viewport): Promise<void>
  updateViewport(viewport: Viewport): void
  destroy(): void
}

// 缓存相关类型
export interface CacheItem {
  key: string
  data: any
  size: number
  priority: number
  lastAccessed: number
  accessCount: number
  created: number
  expires?: number
}

export interface CacheStats {
  totalSize: number
  itemCount: number
  hitCount: number
  missCount: number
  hitRate: number
  memoryUsage: number
}

// 事件相关类型
export interface ViewerEvent {
  type: string
  target: HTMLElement
  viewport: Viewport
  image?: DicomImage
  data?: any
}

export interface MouseEvent extends ViewerEvent {
  type: 'mousedown' | 'mousemove' | 'mouseup' | 'click' | 'dblclick'
  button: number
  clientX: number
  clientY: number
  imageX: number
  imageY: number
  deltaX?: number
  deltaY?: number
}

export interface WheelEvent extends ViewerEvent {
  type: 'wheel'
  deltaY: number
  clientX: number
  clientY: number
  imageX: number
  imageY: number
}

export interface KeyboardEvent extends ViewerEvent {
  type: 'keydown' | 'keyup' | 'keypress'
  key: string
  code: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

// 性能相关类型
export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  unit?: string
}

export interface PerformanceStats {
  renderTime: number
  loadTime: number
  memoryUsage: number
  fps: number
  metrics: PerformanceMetric[]
}

// 配置相关类型
export interface ViewerConfig {
  enableWebGL: boolean
  enableWorkers: boolean
  maxCacheSize: number
  defaultWindowLevel: { center: number; width: number }
  defaultInterpolation: 'nearest' | 'linear'
  enableMeasurements: boolean
  enableAnnotations: boolean
  autoFitOnLoad: boolean
}

// API相关类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface LoadImageOptions {
  priority?: number
  useCache?: boolean
  onProgress?: (progress: number) => void
}

export interface SaveImageOptions {
  format: 'png' | 'jpeg' | 'dicom'
  quality?: number
  includeAnnotations?: boolean
  includeMeasurements?: boolean
}

// 错误相关类型
export interface ViewerError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export enum ErrorCode {
  DICOM_PARSE_ERROR = 'DICOM_PARSE_ERROR',
  IMAGE_LOAD_ERROR = 'IMAGE_LOAD_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// 窗宽窗位预设类型
export interface WindowLevelPreset {
  name: string
  center: number
  width: number
  description: string
}

// 文件相关类型
export interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// 导出工具函数类型
export type EventHandler<T = ViewerEvent> = (event: T) => void
export type AsyncEventHandler<T = ViewerEvent> = (event: T) => Promise<void>
export type Disposable = () => void
