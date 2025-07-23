<template>
  <div class="h-full py-2">
    <el-menu :default-active="activeIndex" class="border-r-0 h-full" @select="handleSelect">
      <el-menu-item-group title="导航">
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/viewer">
          <el-icon><View /></el-icon>
          <span>影像查看器</span>
        </el-menu-item>
      </el-menu-item-group>

      <el-menu-item-group title="工具">
        <el-menu-item index="upload" @click="handleUpload">
          <el-icon><Upload /></el-icon>
          <span>上传文件</span>
        </el-menu-item>
        <el-menu-item index="settings" @click="handleSettings">
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </el-menu-item>
      </el-menu-item-group>

      <el-menu-item-group title="帮助">
        <el-menu-item index="/about">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </el-menu-item>
        <el-menu-item index="help" @click="handleHelp">
          <el-icon><QuestionFilled /></el-icon>
          <span>帮助</span>
        </el-menu-item>
      </el-menu-item-group>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
// Vue APIs and ElMessage are auto-imported
import { House, View, Upload, Setting, InfoFilled, QuestionFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const activeIndex = computed(() => route.path)

const handleSelect = (key: string) => {
  if (key.startsWith('/')) {
    router.push(key)
  }
}

const handleUpload = () => {
  ElMessage.info('上传功能开发中...')
}

const handleSettings = () => {
  ElMessage.info('设置功能开发中...')
}

const handleHelp = () => {
  ElMessage.info('帮助功能开发中...')
}
</script>


