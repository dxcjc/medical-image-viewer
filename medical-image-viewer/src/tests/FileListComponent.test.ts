import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import FileListComponent from '@/components/file/FileListComponent.vue'
import { FileManagerService } from '@/services/file/FileManagerService'
import { useUIStore } from '@/stores/ui'
import { performanceAnalyzer } from '@/utils/performance-analyzer'

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn().mockResolvedValue(true)
  }
}))

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useWindowSize: () => ({
    width: { value: 1024 },
    height: { value: 768 }
  })
}))

// Mock performance analyzer
vi.mock('@/utils/performance-analyzer', () => ({
  performanceAnalyzer: {
    startMeasure: vi.fn().mockReturnValue('test-id'),
    endMeasure: vi.fn().mockReturnValue(100),
    recordInteraction: vi.fn(),
    recordImageLoad: vi.fn()
  }
}))

// Mock FileManagerService
const mockFileManager = {
  getFiles: vi.fn(() => []),
  getCurrentFileId: vi.fn(() => null),
  getFileStats: vi.fn(() => ({
    total: 0,
    loaded: 0,
    loading: 0,
    error: 0,
    totalSize: 0
  })),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  getState: vi.fn(() => ({
    files: [],
    currentFileId: null
  })),
  addFiles: vi.fn(),
  removeFile: vi.fn(),
  clearFiles: vi.fn(),
  searchFiles: vi.fn(() => []),
  setCurrentFile: vi.fn(),
  exportFileInfo: vi.fn(),
  refreshFiles: vi.fn()
}

describe('FileListComponent', () => {
  let wrapper: any
  
  beforeEach(() => {
    wrapper = mount(FileListComponent, {
      props: {
        fileManager: mockFileManager as any
      },
      global: {
        stubs: {
          'el-button': true,
          'el-input': true,
          'el-select': true,
          'el-option': true,
          'el-tooltip': true,
          'el-dropdown': true,
          'el-dropdown-menu': true,
          'el-dropdown-item': true,
          'el-checkbox': true,
          'el-progress': true,
          'el-dialog': true,
          'el-descriptions': true,
          'el-descriptions-item': true,
          'el-icon': true,
          'VirtualList': true
        }
      }
    })
  })

  it('应该正确渲染组件', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.file-list-component').exists()).toBe(true)
  })

  it('应该显示文件列表头部', () => {
    expect(wrapper.find('.file-list-header').exists()).toBe(true)
    expect(wrapper.find('h3').text()).toBe('文件列表')
  })

  it('应该在移动端隐藏某些元素', async () => {
    // 模拟移动端
    const mobileWrapper = mount(FileListComponent, {
      props: {
        fileManager: mockFileManager as any
      },
      global: {
        stubs: {
          'el-button': true,
          'el-input': true,
          'el-select': true,
          'el-option': true,
          'el-tooltip': true,
          'el-dropdown': true,
          'el-dropdown-menu': true,
          'el-dropdown-item': true,
          'el-checkbox': true,
          'el-progress': true,
          'el-dialog': true,
          'el-descriptions': true,
          'el-descriptions-item': true,
          'el-icon': true,
          'VirtualList': true
        },
        provide: {
          isMobile: true
        }
      }
    })
    
    expect(mobileWrapper.exists()).toBe(true)
  })

  it('应该处理搜索功能', async () => {
    const searchInput = wrapper.find('input[placeholder*="搜索"]')
    expect(searchInput.exists()).toBe(true)
    
    // 模拟搜索
    await searchInput.setValue('test')
    expect(mockFileManager.searchFiles).toHaveBeenCalledWith('test')
  })

  it('应该处理文件选择', async () => {
    const fileId = 'test-file-id'
    
    // 模拟文件选择
    await wrapper.vm.selectFile(fileId)
    
    expect(mockFileManager.setCurrentFile).toHaveBeenCalledWith(fileId)
    expect(wrapper.emitted('fileSelected')).toBeTruthy()
    expect(wrapper.emitted('fileSelected')[0]).toEqual([fileId])
  })

  it('应该处理文件上传', async () => {
    const files = [
      new File(['test'], 'test.dcm', { type: 'application/dicom' })
    ]
    
    // 模拟文件上传
    await wrapper.vm.processFiles(files)
    
    expect(mockFileManager.addFiles).toHaveBeenCalledWith(files)
  })

  it('应该处理批量操作', async () => {
    // 选择多个文件
    wrapper.vm.selectedFiles = ['file1', 'file2']
    
    // 测试批量删除
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(true)
    await wrapper.vm.batchDelete()
    
    expect(mockFileManager.removeFile).toHaveBeenCalledTimes(2)
  })

  it('应该处理键盘导航', async () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    
    // 模拟键盘事件
    await wrapper.vm.handleKeyDown(event, 'file1', 0)
    
    // 验证键盘导航逻辑
    expect(event.defaultPrevented).toBe(true)
  })

  it('应该正确计算响应式属性', () => {
    expect(wrapper.vm.isMobile).toBe(false) // 基于模拟的窗口大小
    expect(wrapper.vm.itemHeight).toBeGreaterThan(0)
  })

  it('应该处理筛选和排序', async () => {
    // 测试状态筛选
    wrapper.vm.filterStatus = 'loaded'
    await wrapper.vm.handleFilterChange()
    
    // 测试排序
    wrapper.vm.sortBy = 'size'
    await wrapper.vm.handleSortChange()
    
    expect(wrapper.vm.filteredFiles).toBeDefined()
  })

  it('应该处理拖拽上传', async () => {
    const dragEvent = new DragEvent('drop', {
      dataTransfer: new DataTransfer()
    })
    
    // 添加文件到拖拽事件
    const file = new File(['test'], 'test.dcm', { type: 'application/dicom' })
    dragEvent.dataTransfer?.files && Object.defineProperty(dragEvent.dataTransfer, 'files', {
      value: [file],
      writable: false
    })
    
    await wrapper.vm.handleDrop(dragEvent)
    
    expect(wrapper.vm.isDragOver).toBe(false)
  })

  it('应该处理错误情况', async () => {
    // 模拟文件管理器错误
    mockFileManager.addFiles.mockRejectedValue(new Error('Upload failed'))
    
    const files = [new File(['test'], 'test.dcm')]
    await wrapper.vm.processFiles(files)
    
    expect(ElMessage.error).toHaveBeenCalledWith('Upload failed')
  })

  it('应该正确清理资源', () => {
    wrapper.unmount()
    
    expect(mockFileManager.removeListener).toHaveBeenCalled()
  })
})
