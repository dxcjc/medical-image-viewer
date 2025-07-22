<template>
  <div id="app" class="medical-app bg-medical-bg-primary">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('🏥 医学影像查看器启动成功')
  console.log('🎨 现代化界面设计已加载')
})
</script>

<style scoped>
.medical-app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at 25% 25%, rgba(14, 165, 233, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(14, 165, 233, 0.02) 0%, transparent 50%),
              var(--medical-bg-primary);
}
</style>
