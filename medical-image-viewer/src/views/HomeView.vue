<template>
  <div class="h-screen bg-medical-bg-primary">
    <LayoutComponent>
      <template #main>
        <div class="min-h-viewer-full flex items-center justify-center p-6 relative overflow-hidden">
          <!-- 背景装饰 -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-float"></div>
            <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-cyan/5 rounded-full blur-3xl animate-float" style="animation-delay: 1s;"></div>
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-emerald/5 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
          </div>

          <!-- 主内容卡片 -->
          <div class="medical-card max-w-4xl w-full animate-fade-in relative z-10">
            <!-- 头部区域 -->
            <div class="p-8 text-center border-b border-medical-border">
              <div class="flex items-center justify-center mb-4">
                <div class="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow animate-glow-pulse">
                  <el-icon class="text-3xl text-white"><Monitor /></el-icon>
                </div>
              </div>
              <h1 class="text-4xl font-bold gradient-text mb-3">医学影像查看器</h1>
              <p class="text-medical-text-secondary text-lg">基于现代Web技术的专业医学影像渲染处理系统</p>
            </div>

            <!-- 功能特性区域 -->
            <div class="p-8">
              <h2 class="text-2xl font-semibold text-medical-text-primary mb-6 text-center">核心功能特性</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div v-for="(feature, index) in features" :key="index"
                     class="feature-card p-6 rounded-xl bg-medical-bg-tertiary border border-medical-border hover-lift hover-glow transition-all duration-300"
                     :style="{ animationDelay: `${index * 0.1}s` }">
                  <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0">
                      <div class="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center">
                        <el-icon class="text-white text-lg"><Check /></el-icon>
                      </div>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-medical-text-primary mb-2">{{ feature.title }}</h3>
                      <p class="text-medical-text-secondary">{{ feature.description }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 操作按钮区域 -->
              <div class="text-center space-y-4">
                <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <el-button
                    type="primary"
                    size="large"
                    class="medical-button px-8 py-3 text-lg font-semibold"
                    @click="goToViewer">
                    <el-icon class="mr-2"><View /></el-icon>
                    开始使用查看器
                  </el-button>
                  <el-button
                    size="large"
                    class="px-8 py-3 text-lg bg-medical-bg-tertiary border-medical-border text-medical-text-primary hover:bg-medical-hover"
                    @click="uploadFile">
                    <el-icon class="mr-2"><Upload /></el-icon>
                    上传DICOM文件
                  </el-button>
                </div>
                <p class="text-medical-text-muted text-sm">支持 .dcm, .dicom 格式文件</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </LayoutComponent>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LayoutComponent from '@/components/layout/LayoutComponent.vue'
import { View, Upload, Monitor, Check } from '@element-plus/icons-vue'

const router = useRouter()

// 功能特性数据
const features = ref([
  {
    title: 'DICOM文件解析',
    description: '支持标准DICOM格式医学影像文件的解析和显示，兼容多种医学设备输出'
  },
  {
    title: '高效图像渲染',
    description: '采用WebGL硬件加速，支持大尺寸医学影像的高效切片和分片加载'
  },
  {
    title: '专业查看工具',
    description: '提供缩放、平移、旋转等基本操作，以及窗宽窗位调节功能'
  },
  {
    title: '多帧影像播放',
    description: '支持多帧影像序列的播放控制，可调节播放速度和帧间隔'
  },
  {
    title: '精确测量工具',
    description: '内置长度、角度、面积等测量工具，满足临床诊断需求'
  },
  {
    title: '标注与批注',
    description: '支持在影像上添加标注和批注，便于医生记录和交流'
  }
])

const goToViewer = () => {
  router.push('/viewer')
}

const uploadFile = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dcm,.dicom'
  input.multiple = true

  input.onchange = event => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      ElMessage.success(`成功选择 ${files.length} 个DICOM文件`)
      // TODO: 处理文件上传逻辑
      console.log('选择的文件:', files)
      // 跳转到查看器页面
      router.push('/viewer')
    }
  }

  input.click()
}
</script>
<style scoped>
.feature-card {
  animation: slideInFromBottom 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes slideInFromBottom {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>


