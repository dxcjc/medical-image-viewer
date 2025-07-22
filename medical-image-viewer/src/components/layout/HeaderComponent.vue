<template>
  <div class="flex items-center justify-between h-full px-5">
    <div class="flex items-center">
      <div class="flex items-center text-white text-lg font-bold">
        <el-icon class="text-2xl mr-2 text-blue-400"><Monitor /></el-icon>
        <span class="whitespace-nowrap">医学影像查看器</span>
      </div>
    </div>

    <div class="flex-1 flex justify-center">
      <el-menu
        :default-active="activeIndex"
        class="border-b-0"
        mode="horizontal"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
        @select="handleSelect"
      >
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/viewer">
          <el-icon><View /></el-icon>
          <span>影像查看器</span>
        </el-menu-item>
        <el-menu-item index="/about">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="flex items-center">
      <el-button type="primary" size="small" @click="openFileDialog">
        <el-icon><Upload /></el-icon>
        上传DICOM
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor, House, View, InfoFilled, Upload } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const activeIndex = computed(() => route.path)

const handleSelect = (key: string) => {
  router.push(key)
}

const openFileDialog = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dcm,.dicom'
  input.multiple = true

  input.onchange = event => {
    const files = (event.target as HTMLInputElement).files
    if (files && files.length > 0) {
      ElMessage.success(`选择了 ${files.length} 个DICOM文件`)
      // TODO: 处理文件上传逻辑
      console.log('选择的文件:', files)
    }
  }

  input.click()
}
</script>

<style scoped>
@media (max-width: 768px) {
  .logo-text {
    @apply hidden;
  }

  .header-menu .el-menu-item span {
    @apply hidden;
  }
}
</style>
