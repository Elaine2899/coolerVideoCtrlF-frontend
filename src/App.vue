<script setup>
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="app-container">
    <NavBar />
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style>
:root {
  --navbar-h: 70px;
}
.app-container {
  width: 100%; 
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
@media (min-width: 1024px) {
  body {
    display: block !important;
    place-items: initial !important;
  }
}

html, body {
  height: auto;
  min-height: 100%;
  overflow-x: hidden;
}
</style>
