<script setup>
import { ref, onMounted } from 'vue'
import LoginRegister from '@/components/LoginRegister.vue'

const mode = ref('login') // 預設顯示登入表單
const isLoggedIn = ref(false)

// 判斷有無 token，是否登入
const checkLogin = () => {
  const token = localStorage.getItem('access_token')
  isLoggedIn.value = !!token
}

// 登出
const logout = () => {
  localStorage.removeItem('access_token')
  isLoggedIn.value = false
}

// 切換登入/註冊模式
const toggleMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
}

// 初次載入時檢查登入狀態
onMounted(() => {
  checkLogin()
})
</script>

<template>
  <div class="login-container">
    <template v-if="!isLoggedIn">
      <LoginRegister :mode="mode" @toggleMode="toggleMode" />
    </template>

    <template v-else>
      <div class="user-info">
        <h2>歡迎回來！</h2>
        <p>您已登入。</p>
        <button @click="logout">登出</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  background: #D4F1F9;
}

.user-info {
  background: #91a3c2;
  padding: 2rem;
  border-radius: 10px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 320px;
  text-align: center;
}

button {
  padding: 0.5rem;
  background: rgba(240, 229, 155, 1);
  border: none;
  border-radius: 4px;
  color: #3d5373;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

button:hover {
  background: rgba(240, 229, 155, 0.7);
  color: white;
  
}
</style>
