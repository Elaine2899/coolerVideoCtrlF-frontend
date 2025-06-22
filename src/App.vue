<script setup>
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="app-container">
    <NavBar />
    <router-view />
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
