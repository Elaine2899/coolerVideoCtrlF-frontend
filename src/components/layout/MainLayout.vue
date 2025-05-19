<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="main-layout">
    <header>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </header>
    
    <main>
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.main-layout {
  width: 100%;
  min-height: 100vh;
}

nav {
  display: flex;
  gap: 1rem;
}
</style>