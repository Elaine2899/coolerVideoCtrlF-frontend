<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import SearchBox from '@/components/SearchBox.vue'

const route = useRoute()
const query = ref(route.query.query || '')
const results = ref([])
const fetchResults = async () => {
  if (!query.value) return
  try {
    const res = await axios.get('http://localhost:8000/search', {
      params: { query: query.value }
    })
    results.value = res.data
  } catch (e) {
    console.error('搜尋錯誤', e)
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

    <div v-if="results.length">
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

    <div v-else>查無結果</div>
  </div>
</template>

<style scoped>
.container {
  background: #85b1c5;
  padding: 2rem;
  min-height: calc(100vh - 60px);
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
