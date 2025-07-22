<template>
  <div class="home-view">
    <LayoutComponent>
      <template #main>
        <div class="home-content">
          <el-card class="welcome-card">
            <template #header>
              <div class="card-header">
                <h2>欢迎使用医学影像查看器</h2>
              </div>
            </template>
            <div class="welcome-content">
              <p>这是一个基于Vue.js的医学影像渲染处理系统</p>
              <div class="features">
                <h3>主要功能：</h3>
                <ul>
                  <li>DICOM格式医学影像文件的解析和显示</li>
                  <li>大尺寸医学影像的高效切片和分片加载</li>
                  <li>影像的缩放、平移、旋转等基本操作</li>
                  <li>多帧影像的播放控制</li>
                  <li>影像的测量工具（长度、角度、面积等）</li>
                  <li>窗宽窗位调节功能</li>
                </ul>
              </div>
              <div class="actions">
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

<style scoped>
.home-view {
  height: 100vh;
}

.home-content {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px);
}

.welcome-card {
  max-width: 800px;
  width: 100%;
}

.card-header h2 {
  margin: 0;
  color: #409eff;
}

.welcome-content {
  text-align: center;
}

.features {
  margin: 30px 0;
  text-align: left;
}

.features h3 {
  color: #303133;
  margin-bottom: 15px;
}

.features ul {
  list-style-type: none;
  padding: 0;
}

.features li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.features li:before {
  content: '✓';
  color: #67c23a;
  font-weight: bold;
  margin-right: 10px;
}

.actions {
  margin-top: 30px;
}
</style>
