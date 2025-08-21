<script setup>
import { useRoute } from 'vue-router'
import { useLeftbar } from '@/composables/useLeftbar'

const route = useRoute()
const { toggle } = useLeftbar()

const onMenuClick = () => {
  if (route.path.startsWith('/map')) {
    toggle()
  }
}
</script>

<template>
  <nav class="navbar">
    <!-- 左邊 -->
    <div class="leftBox">
      <i
        v-if="route.path.startsWith('/map')"
        class="bi bi-list"
        @click="onMenuClick"
      ></i>
    </div>

    <!-- 中間 -->
    <div class="middleBox">
      <RouterLink to="/" class="logo hover-item">
        <img src="@/assets/paws-2.png" alt="Logo" class="logo-img"/>
        Functrol
      </RouterLink>
    </div>

    <!-- 右邊 -->
    <div class="rightBox">
      <RouterLink to="/map" class="nav-item hover-item">學習地圖</RouterLink>
      <RouterLink to="/user" class="nav-item hover-item">使用者</RouterLink>
      <RouterLink to="/favor" class="nav-item hover-item">收藏</RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  height: 70px;
  background-color: #22223B;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar > div {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
}

.navbar > div:nth-child(1) i {
  font-size: 1.5rem;
  transition: transform 0.2s ease;
  cursor: pointer;
}
.navbar > div:nth-child(1) i:hover {
  transform: scale(1.3);
  font-weight: bold;
  /* color: rgba(240, 229, 155, 1); */
}

.navbar > div:nth-child(2) {
  justify-content: center;
}

.navbar > div:nth-child(3) {
  justify-content: flex-end;
  gap: 1.5rem;
}

.logo {
  font-size: 1.5rem;
  text-decoration: none;
  color: white;
  font-weight: bold;
}
.logo img {
  rotate: 20deg;
}

.logo-img {
  width: 40px;
  height: 40px;
  margin-right: 0.5rem;
}

.nav-item {
  display: inline-block;
  background: none;
  border: none;
  border-radius: 15px;
  color: #F8EDE3;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  user-select: none;
}

.hover-item {
  transition: transform 0.3s ease;
}
.hover-item:hover {
  transform: scale(1.05) translate(2px, -2px);
  color: #ccc;
}
</style>
