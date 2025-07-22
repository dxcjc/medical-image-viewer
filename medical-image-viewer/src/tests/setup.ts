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
    height: 1
  }))
}))

global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob())
})

// Mock ImageData
global.ImageData = class ImageData {
  data: Uint8ClampedArray
  width: number
  height: number

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
  }
}

// Mock Touch API
global.Touch = class Touch {
  identifier: number
  target: EventTarget
  clientX: number
  clientY: number

  constructor(init: TouchInit) {
    this.identifier = init.identifier
    this.target = init.target
    this.clientX = init.clientX
    this.clientY = init.clientY
  }
}

// Mock URL API
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock File API
global.File = class File extends Blob {
  name: string
  lastModified: number

  constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
    super(fileBits, options)
    this.name = fileName
    this.lastModified = options?.lastModified || Date.now()
  }
}

// Mock FileReader
global.FileReader = class FileReader extends EventTarget {
  result: string | ArrayBuffer | null = null
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
}

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
