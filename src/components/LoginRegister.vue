<script setup>
import { ref, defineEmits, defineProps } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const props = defineProps({
  mode: String // 'login' or 'register'
})

const emit = defineEmits(['toggleMode']) // 切換登入/註冊

const userName = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')


const router = useRouter()

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const payload = {
    user_name: userName.value,
    email: email.value,
    password: password.value
  }

  try {
    if (props.mode === 'login') {
      const res = await axios.post('http://localhost:8000/user_login', payload)
      localStorage.setItem('access_token', res.data.access_token)
      router.push('/')
    } else {
      const res = await axios.post('http://localhost:8000/user_register', payload)
      if (res.data.status === 'User registered successfully') {
        successMessage.value = '註冊成功，請登入！'
      } else {
        errorMessage.value = res.data.message || res.data.status
      }
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || (props.mode === 'login' ? '登入失敗' : '註冊失敗')
  }
}
</script>

<template>
  <div class="form">
    <h2>{{ props.mode === 'login' ? '登入' : '註冊' }}</h2>

    <input v-model="userName" type="text" placeholder="請輸入使用者名稱" />
    <input v-model="email" type="email" placeholder="請輸入 Email" />
    <input v-model="password" type="password" placeholder="請輸入密碼" />

    <button @click="handleSubmit">{{ props.mode === 'login' ? '登入' : '註冊' }}</button>

    <div class="toggle">
      <span>
        {{ props.mode === 'login' ? '沒有帳號嗎？' : '已有帳號？' }}
      </span>
      <a href="#" @click.prevent="emit('toggleMode')">
        {{ props.mode === 'login' ? '註冊' : '登入' }}
      </a>
    </div>

    <div v-if="successMessage" class="success">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<style scoped>
.form {
  background: #4e6a96;
  padding: 2rem;
  border-radius: 10px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 320px;
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

.toggle {
  display: flex;
  justify-content: center;
  gap: 0.3rem;
  font-size: 0.9rem;
}

.toggle a {
  color: #aad2ff;
  cursor: pointer;
  text-decoration: underline;
}

.success {
  background-color: #4caf50;
  padding: 0.5rem;
  border-radius: 4px;
  color: white;
}

.error {
  background-color: #b94a48;
  padding: 0.5rem;
  border-radius: 4px;
  color: white;
}
</style>
