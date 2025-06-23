<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'

// emit phase 資料給 MapView
const emit = defineEmits(['selectPhase'])

const openQuery = reactive({})
const learningMaps = ref({})

onMounted(async () => {
  const res = await axios.get('http://localhost:8000/learning_map')
  const query = res.data.query
  const map = res.data.learning_map

  learningMaps.value[query] = map
  openQuery[query] = true
})

const toggleQuery = (query) => {
  openQuery[query] = !openQuery[query]
}

const handlePhaseClick = (query, phaseKey, phaseData) => {
  emit('selectPhase', {
    query,
    phaseKey,
    ...phaseData,
  })
}
</script>

<template>
  <aside class="leftbar">
    <div v-for="(phases, query) in learningMaps" :key="query">
      <div class="section" @click="toggleQuery(query)">
        <span class="arrow">{{ openQuery[query] ? '▼' : '▶' }}</span>
        {{ query }}
      </div>

      <div v-if="openQuery[query]" class="sub-section">
        <div
          class="item"
          v-for="(phase, phaseKey) in phases"
          :key="phaseKey"
          @click="handlePhaseClick(query, phaseKey, phase)"
        >
          {{ phase.title }}
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.leftbar {
  position: fixed;              /* 固定在畫面上 */
  overflow-y: auto;             /* 若內容超出則可滾動 */
  z-index: 10;
  top: 60px;                    /* 加上這一行，避開上方 NavBar */
  bottom: 0;                    /* 保證延伸到畫面底部 */
  width: 250px;
  background-color: #6b8fa3;
  color: white;
  padding: 0.5rem;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 0.95rem;
  scrollbar-width: none; /* 隱藏 Firefox 的滾動條 */
}

.leftbar::-webkit-scrollbar {
  display: none; /* 隱藏 Chrome / Safari 的滾動條 */
}

.section {
  padding: 0.5rem;
  background-color: #4e6a96;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.section:hover {
  background-color: #5a78ab;
}

.sub-section {
  background-color: #789bb4;
  padding-left: 1rem;
}

.item {
  padding: 0.4rem 0.5rem;
  cursor: pointer;
}

.item:hover {
  background-color: #5f7f9d;
}

.arrow {
  width: 1rem;
  display: inline-block;
}
</style>
