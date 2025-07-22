<template>
  <el-container class="h-screen">
    <el-header class="bg-gray-600 text-white p-0 leading-[60px]">
      <HeaderComponent />
    </el-header>
    <el-container class="flex-1">
      <el-aside v-if="showSidebar" class="bg-gray-50 border-r border-gray-200" width="200px">
        <SidebarComponent />
      </el-aside>
      <el-main class="p-0 bg-white">
        <slot name="main" />
      </el-main>
    </el-container>
    <el-footer v-if="showFooter" class="bg-gray-50 border-t border-gray-200 text-center leading-10 text-gray-500 text-xs" height="40px">
      <FooterComponent />
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HeaderComponent from './HeaderComponent.vue'
import SidebarComponent from './SidebarComponent.vue'
import FooterComponent from './FooterComponent.vue'

const route = useRoute()

// 根据路由决定是否显示侧边栏和底部栏
const showSidebar = computed(() => {
  return route.name !== 'viewer' // 查看器页面不显示侧边栏
})

const showFooter = computed(() => {
  return route.name !== 'viewer' // 查看器页面不显示底部栏
})
</script>


