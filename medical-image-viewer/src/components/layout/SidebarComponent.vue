<template>
  <div class="h-full p-4 flex flex-col">
    <!-- 侧边栏头部 -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-medical-text-primary mb-2">导航菜单</h3>
      <div class="w-12 h-0.5 bg-gradient-to-r from-primary-500 to-transparent rounded"></div>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 space-y-2">
      <!-- 主要导航 -->
      <div class="mb-6">
        <h4 class="text-xs font-medium text-medical-text-muted uppercase tracking-wider mb-3">主要功能</h4>
        <div class="space-y-1">
          <router-link
            v-for="item in mainNavItems"
            :key="item.path"
            :to="item.path"
            class="sidebar-item flex items-center space-x-3 px-3 py-2.5 rounded-lg text-medical-text-secondary hover:text-medical-text-primary hover:bg-medical-hover transition-all duration-200"
            :class="{ 'sidebar-item-active': activeIndex === item.path }"
          >
            <el-icon class="text-lg"><component :is="item.icon" /></el-icon>
            <span class="font-medium">{{ item.label }}</span>
          </router-link>
        </div>
      </div>

      <!-- 工具菜单 -->
      <div class="mb-6">
        <h4 class="text-xs font-medium text-medical-text-muted uppercase tracking-wider mb-3">工具</h4>
        <div class="space-y-1">
          <button
            v-for="item in toolItems"
            :key="item.key"
            @click="item.action"
            class="sidebar-item w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-medical-text-secondary hover:text-medical-text-primary hover:bg-medical-hover transition-all duration-200"
          >
            <el-icon class="text-lg"><component :is="item.icon" /></el-icon>
            <span class="font-medium">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <!-- 帮助菜单 -->
      <div>
        <h4 class="text-xs font-medium text-medical-text-muted uppercase tracking-wider mb-3">帮助</h4>
        <div class="space-y-1">
          <router-link
            v-for="item in helpNavItems"
            :key="item.path"
            :to="item.path"
            class="sidebar-item flex items-center space-x-3 px-3 py-2.5 rounded-lg text-medical-text-secondary hover:text-medical-text-primary hover:bg-medical-hover transition-all duration-200"
            :class="{ 'sidebar-item-active': activeIndex === item.path }"
          >
            <el-icon class="text-lg"><component :is="item.icon" /></el-icon>
            <span class="font-medium">{{ item.label }}</span>
          </router-link>
          <button
            @click="handleHelp"
            class="sidebar-item w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-medical-text-secondary hover:text-medical-text-primary hover:bg-medical-hover transition-all duration-200"
          >
            <el-icon class="text-lg"><QuestionFilled /></el-icon>
            <span class="font-medium">使用帮助</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 侧边栏底部 -->
    <div class="mt-auto pt-4 border-t border-medical-border">
      <div class="text-xs text-medical-text-muted text-center">
        <p>Medical Image Viewer</p>
        <p>v0.1.0</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { House, View, Upload, Setting, InfoFilled, QuestionFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const activeIndex = computed(() => route.path)

// 主要导航项
const mainNavItems = ref([
  {
    path: '/',
    label: '首页',
    icon: 'House'
  },
  {
    path: '/viewer',
    label: '影像查看器',
    icon: 'View'
  }
])

// 工具项
const toolItems = ref([
  {
    key: 'upload',
    label: '上传文件',
    icon: 'Upload',
    action: handleUpload
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: 'Setting',
    action: handleSettings
  }
])

// 帮助导航项
const helpNavItems = ref([
  {
    path: '/about',
    label: '关于系统',
    icon: 'InfoFilled'
  }
])

function handleUpload() {
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

function handleSettings() {
  ElMessage.info('设置功能开发中...')
}

function handleHelp() {
  ElMessage.info('帮助功能开发中...')
}
</script>
<style scoped>
.sidebar-item {
  position: relative;
}

.sidebar-item-active {
  @apply text-primary-400 bg-primary-500/10;
}

.sidebar-item-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: linear-gradient(180deg, #0ea5e9, #06b6d4);
  border-radius: 0 2px 2px 0;
}

.sidebar-item:hover {
  transform: translateX(2px);
}
</style>


