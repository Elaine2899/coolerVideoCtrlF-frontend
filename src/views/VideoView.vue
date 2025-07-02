<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import SearchBox from '@/components/SearchBox.vue'

const route = useRoute()
const query = ref(route.query.query || '')
const results = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const fetchResults = async () => {
  if (!query.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await axios.get('http://localhost:8000/search', {
      params: { query: query.value },
      timeout: 180000, // 指定 timeout 時間（ms）
    })
    results.value = res.data.results
  } catch (e) {
    errorMessage.value = '搜尋錯誤：' + (e?.message || '發生未知錯誤')
    console.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

// 初次載入 or URL query 改變時重新抓資料
onMounted(fetchResults)
watch(() => route.query.query, (newQuery) => {
  query.value = newQuery
  fetchResults()
})
</script>

<template>
  <div class="container">
    <div>
      <SearchBox v-model="query" @enter="fetchResults" />
    </div>

    <!-- Loading 狀態 -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>搜尋中，請稍候...</p>
    </div>

    <!-- 結果區塊 -->
    <div v-else-if="results.length">
      <div v-for="item in results" :key="item.url" class="card">
        <div class="left">
          <iframe :src="item.url" frameborder="0" allowfullscreen class="video"></iframe>
          <div class="title">{{ item.title }}</div>
        </div>
        <div class="right">
          <div class="summary">
            <div v-for="(line, idx) in item.summary.split('\n')" :key="idx">
              {{ line }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 查無資料 -->
    <div v-else-if="!isLoading && !results.length && !errorMessage">查無結果</div>

    <!-- 錯誤訊息 -->
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>


<style scoped>
.container {
  background: #85b1c5;
  padding: 2rem;
  min-height: calc(100vh - 60px);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  padding: 2rem;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #ffdddd;
  background-color: #b94a48;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.card {
  display: flex;
  flex-direction: row;
  background: #4e6a96;
  color: white;
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: 1rem;
}
.left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.right {
  padding: 0rem 1rem;
  display: flex;
}
.video {
  width: 350px;
  height: 200px;
  border-radius: 8px;
}
.summary {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.title {
  width: 350px;
  background: #6380b3;
  padding: 0.5rem 1rem;
  font-weight: bold;
}
</style>
