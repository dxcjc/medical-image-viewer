<template>
  <div class="medical-toolbar flex items-center justify-between h-full px-6 relative">
    <!-- 左侧Logo和标题 -->
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
          <el-icon class="text-xl text-white"><Monitor /></el-icon>
        </div>
        <div class="hidden sm:block">
          <h1 class="text-lg font-bold gradient-text">医学影像查看器</h1>
          <p class="text-xs text-medical-text-muted">Medical Image Viewer</p>
        </div>
      </div>
    </div>

    <!-- 中央导航菜单 -->
    <div class="flex-1 flex justify-center">
      <nav class="flex items-center space-x-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item px-4 py-2 rounded-lg text-medical-text-secondary hover:text-medical-text-primary hover:bg-medical-hover transition-all duration-200 flex items-center space-x-2"
          :class="{ 'nav-item-active': activeIndex === item.path }"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span class="hidden md:inline">{{ item.label }}</span>
        </router-link>
      </nav>
    </div>

    <!-- 右侧操作按钮 -->
    <div class="flex items-center space-x-3">
      <el-tooltip content="上传DICOM文件" placement="bottom">
        <button
          class="medical-button px-3 py-2 text-sm"
          @click="openFileDialog">
          <el-icon class="mr-1"><Upload /></el-icon>
          <span class="hidden sm:inline">上传</span>
        </button>
      </el-tooltip>

      <el-tooltip content="设置" placement="bottom">
        <button
          class="p-2 rounded-lg text-medical-text-secondary hover:text-medical-text-primary hover:bg-medical-hover transition-all duration-200"
          @click="openSettings">
          <el-icon><Setting /></el-icon>
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor, House, View, InfoFilled, Upload, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const activeIndex = computed(() => route.path)

// 菜单项配置
const menuItems = ref([
  {
    path: '/',
    label: '首页',
    icon: 'House'
  },
  {
    path: '/viewer',
    label: '影像查看器',
    icon: 'View'
  },
  {
    path: '/about',
    label: '关于',
    icon: 'InfoFilled'
  }
])

const openFileDialog = () => {
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

const openSettings = () => {
  ElMessage.info('设置功能开发中...')
}
</script>

<style scoped>
.nav-item {
  position: relative;
}

.nav-item-active {
  @apply text-primary-400 bg-primary-500/10;
}

.nav-item-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
  border-radius: 1px;
}

@media (max-width: 768px) {
  .nav-item span {
    @apply hidden;
  }
}
</style>
