import { vi } from 'vitest'

// Mock Canvas API
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
    colorSpace: 'srgb' as PredefinedColorSpace
  })),
  canvas: {} as HTMLCanvasElement,
  getContextAttributes: vi.fn(),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
  // Add other required properties with default values
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low' as ImageSmoothingQuality,
  strokeStyle: '#000000',
  fillStyle: '#000000',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  lineWidth: 1,
  lineCap: 'butt' as CanvasLineCap,
  lineJoin: 'miter' as CanvasLineJoin,
  miterLimit: 10,
  lineDashOffset: 0,
  font: '10px sans-serif',
  textAlign: 'start' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  direction: 'inherit' as CanvasDirection,
  // Add required methods
  arc: vi.fn(),
  arcTo: vi.fn(),
  beginPath: vi.fn(),
  bezierCurveTo: vi.fn(),
  clip: vi.fn(),
  closePath: vi.fn(),
  createImageData: vi.fn(),
  createLinearGradient: vi.fn(),
  createPattern: vi.fn(),
  createRadialGradient: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  getLineDash: vi.fn(() => []),
  isPointInPath: vi.fn(() => false),
  isPointInStroke: vi.fn(() => false),
  lineTo: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 } as TextMetrics)),
  moveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  rect: vi.fn(),
  resetTransform: vi.fn(),
  setLineDash: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  strokeText: vi.fn(),
  transform: vi.fn()
})) as any

global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob())
})

// Mock ImageData
global.ImageData = class ImageData {
  data: Uint8ClampedArray
  width: number
  height: number
  colorSpace: PredefinedColorSpace

  constructor(data: Uint8ClampedArray | number, width?: number, height?: number) {
    if (typeof data === 'number') {
      this.width = data
      this.height = width || 0
      this.data = new Uint8ClampedArray(this.width * this.height * 4)
    } else {
      this.data = data
      this.width = width || 0
      this.height = height || 0
    }
    this.colorSpace = 'srgb'
  }
} as any

// Mock Touch API
global.Touch = class Touch {
  identifier: number
  target: EventTarget
  clientX: number
  clientY: number
  pageX: number
  pageY: number
  screenX: number
  screenY: number
  radiusX: number
  radiusY: number
  rotationAngle: number
  force: number

  constructor(init: TouchInit) {
    this.identifier = init.identifier
    this.target = init.target
    this.clientX = init.clientX || 0
    this.clientY = init.clientY || 0
    this.pageX = init.pageX || 0
    this.pageY = init.pageY || 0
    this.screenX = init.screenX || 0
    this.screenY = init.screenY || 0
    this.radiusX = init.radiusX || 0
    this.radiusY = init.radiusY || 0
    this.rotationAngle = init.rotationAngle || 0
    this.force = init.force || 0
  }
} as any

// Mock URL API
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock File API
global.File = class File extends Blob {
  name: string
  lastModified: number
  webkitRelativePath: string

  constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
    super(fileBits, options)
    this.name = fileName
    this.lastModified = options?.lastModified || Date.now()
    this.webkitRelativePath = ''
  }
} as any

// Mock FileReader
global.FileReader = class FileReader extends EventTarget {
  static readonly EMPTY = 0
  static readonly LOADING = 1
  static readonly DONE = 2

  result: string | ArrayBuffer | null = null
  error: DOMException | null = null
  readyState: number = 0

  readAsArrayBuffer(file: Blob) {
    setTimeout(() => {
      this.result = new ArrayBuffer(1024)
      this.readyState = 2
      this.dispatchEvent(new Event('load'))
    }, 0)
  }

  readAsText(file: Blob) {
    setTimeout(() => {
      this.result = 'mock file content'
      this.readyState = 2
      this.dispatchEvent(new Event('load'))
    }, 0)
  }

  abort(): void {
    this.readyState = 2
    this.dispatchEvent(new Event('abort'))
  }
} as any

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

// Mock console methods to reduce noise in tests
global.console.log = vi.fn()
global.console.warn = vi.fn()
global.console.error = vi.fn()
