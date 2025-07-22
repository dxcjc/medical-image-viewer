<template>
  <div class="h-screen">
    <LayoutComponent>
      <template #main>
        <div class="p-5 flex justify-center items-start min-h-viewer-full">
          <el-card class="max-w-3xl w-full">
            <template #header>
              <div class="text-center">
                <h2 class="m-0 text-primary-500 text-2xl font-bold">欢迎使用医学影像查看器</h2>
              </div>
            </template>
            <div class="text-center">
              <p class="text-gray-600 mb-8">这是一个基于Vue.js的医学影像渲染处理系统</p>
              <div class="my-8 text-left">
                <h3 class="text-gray-800 mb-4 text-lg font-semibold">主要功能：</h3>
                <ul class="list-none p-0 space-y-2">
                  <li class="py-2 border-b border-gray-100 relative pl-6">
                    <span class="absolute left-0 text-success font-bold">✓</span>
                    DICOM格式医学影像文件的解析和显示
                  </li>
                  <li class="py-2 border-b border-gray-100 relative pl-6">
                    <span class="absolute left-0 text-success font-bold">✓</span>
                    大尺寸医学影像的高效切片和分片加载
                  </li>
                  <li class="py-2 border-b border-gray-100 relative pl-6">
                    <span class="absolute left-0 text-success font-bold">✓</span>
                    影像的缩放、平移、旋转等基本操作
                  </li>
                  <li class="py-2 border-b border-gray-100 relative pl-6">
                    <span class="absolute left-0 text-success font-bold">✓</span>
                    多帧影像的播放控制
                  </li>
                  <li class="py-2 border-b border-gray-100 relative pl-6">
                    <span class="absolute left-0 text-success font-bold">✓</span>
                    影像的测量工具（长度、角度、面积等）
                  </li>
                  <li class="py-2 border-b border-gray-100 relative pl-6">
                    <span class="absolute left-0 text-success font-bold">✓</span>
                    窗宽窗位调节功能
                  </li>
                </ul>
              </div>
              <div class="mt-8">
                <el-button type="primary" size="large" @click="goToViewer">
                  <el-icon><View /></el-icon>
                  开始使用
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </template>
    </LayoutComponent>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import LayoutComponent from '@/components/layout/LayoutComponent.vue'
import { View } from '@element-plus/icons-vue'

const router = useRouter()

const goToViewer = () => {
  router.push('/viewer')
}
</script>


