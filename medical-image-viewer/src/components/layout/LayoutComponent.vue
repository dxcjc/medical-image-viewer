<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <HeaderComponent />
    </el-header>
    <el-container class="layout-body">
      <el-aside v-if="showSidebar" class="layout-aside" width="200px">
        <SidebarComponent />
      </el-aside>
      <el-main class="layout-main">
        <slot name="main" />
      </el-main>
    </el-container>
    <el-footer v-if="showFooter" class="layout-footer" height="40px">
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

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-header {
  background: #545c64;
  color: #fff;
  padding: 0;
  line-height: 60px;
}

.layout-body {
  flex: 1;
}

.layout-aside {
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.layout-main {
  padding: 0;
  background: #fff;
}

.layout-footer {
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  text-align: center;
  line-height: 40px;
  color: #909399;
  font-size: 12px;
}
</style>
