<template>
  <div class="viewer-view">
    <LayoutComponent>
      <template #main>
        <div class="viewer-content">
          <div class="viewer-toolbar">
            <ToolbarComponent />
          </div>
          <div class="viewer-main">
            <div class="viewer-sidebar">
              <!-- 侧边栏内容 -->
              <el-card class="sidebar-card">
                <template #header>
                  <span>影像信息</span>
                </template>
                <p>暂无影像数据</p>
              </el-card>
            </div>
            <div class="viewer-canvas">
              <ImageViewerComponent />
            </div>
          </div>
        </div>
      </template>
    </LayoutComponent>
  </div>
</template>

<script setup lang="ts">
import LayoutComponent from '@/components/layout/LayoutComponent.vue'
import ToolbarComponent from '@/components/tools/ToolbarComponent.vue'
import ImageViewerComponent from '@/components/viewer/ImageViewerComponent.vue'
</script>

<style scoped>
.viewer-view {
  height: 100vh;
}

.viewer-content {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.viewer-toolbar {
  height: 60px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.viewer-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.viewer-sidebar {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  background: #fafafa;
  padding: 10px;
  overflow-y: auto;
}

.viewer-canvas {
  flex: 1;
  background: #000;
  position: relative;
}

.sidebar-card {
  margin-bottom: 10px;
}
</style>
