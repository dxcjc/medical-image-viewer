<template>
  <div id="app" class="medical-app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">

onMounted(() => {
  console.log('医学影像查看器启动成功')
})
</script>

<style scoped>
.medical-app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
