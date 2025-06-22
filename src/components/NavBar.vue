<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'

const showDropdown = ref(false)
const dropdownRef = ref(null)
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}
const handleClickOutside = (event) => {
  if (
    showDropdown.value &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target)
  ) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <nav class="navbar">
    <!-- 左邊 -->
    <RouterLink to="/" class="logo">🐾 Functrol</RouterLink>

    <!-- 右邊 -->
    <div class="rightBox">
      <RouterLink to="/map" class="nav-item">學習地圖</RouterLink>

      <div class="dropdownWrapper" ref="dropdownRef">
        <button class="nav-item" @click="toggleDropdown">個人</button>

        <div v-if="showDropdown" class="dropdown">
          <RouterLink to="/user" class="dropdownItem">使用者</RouterLink>
          <RouterLink to="/favor" class="dropdownItem">收藏</RouterLink>
          <RouterLink to="/setting" class="dropdownItem">設定</RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  height: 60px;
  background-color: #c27878;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo {
  font-size: 1.5rem;
  text-decoration: none;
  color: white;
  font-weight: bold;
}

.rightBox {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-item {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
}

.dropdownWrapper {
  position: relative;
}

.dropdown {
  position: absolute;
  top: 2.5rem;
  right: 0;
  background-color: #4e6a96;
  border-radius: 6px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 2000;
  min-width: 120px;
}

.dropdownItem {
  color: white;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.dropdownItem:hover {
  background-color: #3d5373;
}
</style>
