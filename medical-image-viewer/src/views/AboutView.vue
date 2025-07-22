<template>
  <div class="about-view">
    <LayoutComponent>
      <template #main>
        <div class="about-content">
          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <h2>关于医学影像查看器</h2>
              </div>
            </template>
            <div class="about-info">
              <div class="info-section">
                <h3>项目信息</h3>
                <p><strong>版本：</strong>0.1.0</p>
                <p><strong>描述：</strong>基于Vue.js的医学影像渲染处理系统</p>
                <p><strong>技术栈：</strong>Vue 3 + TypeScript + Vite + Element Plus</p>
              </div>

              <div class="info-section">
                <h3>核心技术</h3>
                <ul>
                  <li><strong>前端框架：</strong>Vue 3 + TypeScript + Vite</li>
                  <li><strong>医学影像：</strong>Cornerstone.js 3.0 + dcmjs</li>
                  <li><strong>大图像处理：</strong>OpenSeadragon + libvips</li>
                  <li><strong>状态管理：</strong>Pinia</li>
                  <li><strong>UI组件：</strong>Element Plus</li>
                  <li><strong>3D渲染：</strong>VTK.js（可选）</li>
                </ul>
              </div>

              <div class="info-section">
                <h3>开发团队</h3>
                <p>Medical Image Team</p>
              </div>

              <div class="info-section">
                <h3>许可证</h3>
                <p>MIT License</p>
              </div>
            </div>
          </el-card>
        </div>
      </template>
    </LayoutComponent>
  </div>
</template>

<script setup lang="ts">
import LayoutComponent from '@/components/layout/LayoutComponent.vue'
</script>

<style scoped>
.about-view {
  height: 100vh;
}

.about-content {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px);
}

.about-card {
  max-width: 800px;
  width: 100%;
}

.card-header h2 {
  margin: 0;
  color: #409eff;
}

.about-info {
  text-align: left;
}

.info-section {
  margin-bottom: 30px;
}

.info-section h3 {
  color: #303133;
  margin-bottom: 15px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 5px;
}

.info-section ul {
  list-style-type: none;
  padding: 0;
}

.info-section li {
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-section p {
  margin: 10px 0;
  line-height: 1.6;
}
</style>
