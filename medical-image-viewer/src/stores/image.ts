import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// DICOM影像数据接口
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

// DICOM元数据接口
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

// 研究数据接口
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

// 序列数据接口
export interface Series {
  seriesInstanceUID: string
  studyInstanceUID: string
  seriesNumber?: number
  seriesDescription?: string
  modality?: string
  imageCount: number
  images: DicomImage[]
}

export const useImageStore = defineStore('image', () => {
  // 状态
  const studies = ref(new Map<string, Study>())
  const series = ref(new Map<string, Series>())
  const images = ref(new Map<string, DicomImage>())
  const currentStudy = ref<Study | null>(null)
  const currentSeries = ref<Series | null>(null)
  const currentImage = ref<DicomImage | null>(null)
  const loadingStates = ref(new Map<string, boolean>())
  const errors = ref(new Map<string, string>())

  // 计算属性
  const studyList = computed(() => Array.from(studies.value.values()))
  const seriesList = computed(() => Array.from(series.value.values()))
  const imageList = computed(() => Array.from(images.value.values()))

  const currentStudyImages = computed(() => {
    if (!currentStudy.value) return []
    return currentStudy.value.series.flatMap(s => s.images)
  })

  const currentSeriesImages = computed(() => {
    return currentSeries.value?.images || []
  })

  const isLoading = computed(() => {
    return Array.from(loadingStates.value.values()).some(loading => loading)
  })

  const hasErrors = computed(() => {
    return errors.value.size > 0
  })

  // 操作方法
  const addStudy = (study: Study) => {
    studies.value.set(study.studyInstanceUID, study)
  }

  const addSeries = (seriesData: Series) => {
    series.value.set(seriesData.seriesInstanceUID, seriesData)

    // 更新对应的研究
    const study = studies.value.get(seriesData.studyInstanceUID)
    if (study) {
      const existingSeriesIndex = study.series.findIndex(
        s => s.seriesInstanceUID === seriesData.seriesInstanceUID
      )
      if (existingSeriesIndex >= 0) {
        study.series[existingSeriesIndex] = seriesData
      } else {
        study.series.push(seriesData)
      }
    }
  }

  const addImage = (image: DicomImage) => {
    images.value.set(image.id, image)

    // 更新对应的序列
    const seriesData = series.value.get(image.seriesInstanceUID)
    if (seriesData) {
      const existingImageIndex = seriesData.images.findIndex(img => img.id === image.id)
      if (existingImageIndex >= 0) {
        seriesData.images[existingImageIndex] = image
      } else {
        seriesData.images.push(image)
      }
    }
  }

  const setCurrentStudy = (studyInstanceUID: string) => {
    const study = studies.value.get(studyInstanceUID)
    if (study) {
      currentStudy.value = study
      // 自动选择第一个序列
      if (study.series.length > 0) {
        setCurrentSeries(study.series[0].seriesInstanceUID)
      }
    }
  }

  const setCurrentSeries = (seriesInstanceUID: string) => {
    const seriesData = series.value.get(seriesInstanceUID)
    if (seriesData) {
      currentSeries.value = seriesData
      // 自动选择第一个影像
      if (seriesData.images.length > 0) {
        setCurrentImage(seriesData.images[0].id)
      }
    }
  }

  const setCurrentImage = (imageId: string) => {
    const image = images.value.get(imageId)
    if (image) {
      currentImage.value = image
    }
  }

  const setLoading = (key: string, loading: boolean) => {
    if (loading) {
      loadingStates.value.set(key, true)
    } else {
      loadingStates.value.delete(key)
    }
  }

  const setError = (key: string, error: string) => {
    errors.value.set(key, error)
  }

  const clearError = (key: string) => {
    errors.value.delete(key)
  }

  const clearAllErrors = () => {
    errors.value.clear()
  }

  const removeImage = (imageId: string) => {
    const image = images.value.get(imageId)
    if (image) {
      images.value.delete(imageId)

      // 从序列中移除
      const seriesData = series.value.get(image.seriesInstanceUID)
      if (seriesData) {
        seriesData.images = seriesData.images.filter(img => img.id !== imageId)
      }

      // 如果是当前影像，清除选择
      if (currentImage.value?.id === imageId) {
        currentImage.value = null
      }
    }
  }

  const removeSeries = (seriesInstanceUID: string) => {
    const seriesData = series.value.get(seriesInstanceUID)
    if (seriesData) {
      // 移除所有影像
      seriesData.images.forEach(image => {
        images.value.delete(image.id)
      })

      series.value.delete(seriesInstanceUID)

      // 从研究中移除
      const study = studies.value.get(seriesData.studyInstanceUID)
      if (study) {
        study.series = study.series.filter(s => s.seriesInstanceUID !== seriesInstanceUID)
      }

      // 如果是当前序列，清除选择
      if (currentSeries.value?.seriesInstanceUID === seriesInstanceUID) {
        currentSeries.value = null
        currentImage.value = null
      }
    }
  }

  const removeStudy = (studyInstanceUID: string) => {
    const study = studies.value.get(studyInstanceUID)
    if (study) {
      // 移除所有序列和影像
      study.series.forEach(seriesData => {
        removeSeries(seriesData.seriesInstanceUID)
      })

      studies.value.delete(studyInstanceUID)

      // 如果是当前研究，清除选择
      if (currentStudy.value?.studyInstanceUID === studyInstanceUID) {
        currentStudy.value = null
        currentSeries.value = null
        currentImage.value = null
      }
    }
  }

  const clearAll = () => {
    studies.value.clear()
    series.value.clear()
    images.value.clear()
    currentStudy.value = null
    currentSeries.value = null
    currentImage.value = null
    loadingStates.value.clear()
    errors.value.clear()
  }

  return {
    // 状态
    studies,
    series,
    images,
    currentStudy,
    currentSeries,
    currentImage,
    loadingStates,
    errors,

    // 计算属性
    studyList,
    seriesList,
    imageList,
    currentStudyImages,
    currentSeriesImages,
    isLoading,
    hasErrors,

    // 方法
    addStudy,
    addSeries,
    addImage,
    setCurrentStudy,
    setCurrentSeries,
    setCurrentImage,
    setLoading,
    setError,
    clearError,
    clearAllErrors,
    removeImage,
    removeSeries,
    removeStudy,
    clearAll
  }
})
