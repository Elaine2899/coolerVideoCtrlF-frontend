<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// 綁定輸入欄位資料
const userName = ref('')       // 使用者名稱
const email = ref('')          // 使用者 email
const password = ref('')       // 使用者密碼
const errorMessage = ref('')   // 錯誤訊息顯示用
const router = useRouter()     // Vue Router 用於頁面跳轉

// 登入函式（當使用者按下登入按鈕時觸發）
const login = async () => {
  errorMessage.value = ''  // 清除舊錯誤訊息

  try {
    // 呼叫後端的登入 API，傳送帳密
    const res = await axios.post('http://localhost:8000/user_login', {
      user_name: userName.value,
      email: email.value,
      password: password.value
    })

    // 拿到 JWT token 後儲存到 localStorage
    const token = res.data.access_token
    localStorage.setItem('access_token', token)

    // 登入成功後導向首頁或個人頁面
    router.push('/')
  } catch (err) {
    // 錯誤處理：顯示錯誤訊息
    errorMessage.value = err.response?.data?.detail || '登入失敗，請再試一次'
  }
}
</script>


<template>
  <div class="login-container">
    <div class="form">
      <h2>登入</h2>
      <input v-model="userName" type="text" placeholder="請輸入使用者名稱" />
      <input v-model="email" type="email" placeholder="請輸入 Email" />
      <input v-model="password" type="password" placeholder="請輸入密碼" />
      <button @click="login">登入</button>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  background: #85b1c5;
}

.form {
  background: #4e6a96;
  padding: 2rem;
  border-radius: 10px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 300px;
}

input {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
}

button {
  padding: 0.5rem;
  background: #c27878;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #5a78ab;
}

.error {
  background-color: #b94a48;
  padding: 0.5rem;
  border-radius: 4px;
  color: white;
  font-size: 0.9rem;
}
</style>
