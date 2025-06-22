<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchBox from '@/components/SearchBox.vue'

const router = useRouter()
const searchQuery = ref('')

const doSearch = async () => {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/video', query: { query: searchQuery.value } })
}
</script>

<template>
  <div class="homeBox">
    <h2>問點東西吧</h2>
    <!-- 搜尋區 -->
    <div class="searchBox">
      <SearchBox v-model="searchQuery" @enter="doSearch" />
    </div>
  </div>
</template>

<style scoped>
.homeBox {
  background-color: #85b1c5;
  min-height: calc(100vh - 60px);
  font-family: 'Noto Sans TC', sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.searchBox {
  width: 100%;
}

</style>
