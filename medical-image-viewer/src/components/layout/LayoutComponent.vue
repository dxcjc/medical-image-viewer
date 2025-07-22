<template>
  <el-container class="h-screen bg-medical-bg-primary">
    <el-header class="medical-toolbar p-0 h-16 shadow-toolbar">
      <HeaderComponent />
    </el-header>
    <el-container class="flex-1">
      <el-aside v-if="showSidebar" class="medical-sidebar animate-slide-in-left" width="240px">
        <SidebarComponent />
      </el-aside>
      <el-main class="p-0 bg-medical-bg-primary relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-medical-bg-primary via-medical-bg-primary to-medical-bg-secondary/50"></div>
        <div class="relative z-10 h-full">
          <slot name="main" />
        </div>
      </el-main>
    </el-container>
    <el-footer v-if="showFooter" class="medical-sidebar text-center h-10 flex items-center justify-center" height="40px">
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


