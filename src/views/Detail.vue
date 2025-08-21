<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import FavoriteButton from '@/components/FavoriteButton.vue'

const route = useRoute()
const videoId = ref(route.params.id)
const query = ref(route.query.query || '')
const iframeSrc = ref('')

const videoData = ref({})
const loading = ref(true)
const error = ref(null)

const fetchVideo = async () => {
  loading.value = true
  try {
    const res = await axios.get(`http://localhost:8000/videos/${videoId.value}`, {
      params: query.value ? { query: query.value } : {},
      headers: {
        Authorization: localStorage.getItem('access_token')
      }
    })
    videoData.value = res.data
    iframeSrc.value = videoData.value.url
  } catch (err) {
    error.value = err.response?.data?.detail || '讀取影片失敗'
  } finally {
    loading.value = false
  }
}

watch(
  () => [route.params.id, route.query.query],
  ([newId, newQuery]) => {
    if (!newId) return
    videoId.value = newId
    query.value = newQuery || ''
    fetchVideo()
  },
  { immediate: true }
)

function goToSegment(segment) {
  const baseUrl = videoData.value.url.split('?')[0]
  const [hour, min, sec] = segment.start.split(':').map(Number)
  const startSec = hour * 3600 + min * 60 + sec
  const random = Math.floor(Math.random() * 100000) // 防止相同 URL 不更新
  iframeSrc.value = `${baseUrl}?start=${startSec}&autoplay=1&nocache=${random}`
}
</script>

<template>
  <div class="video-page">
    <div v-if="loading" class="loading">載入中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="video-layout" :class="{ 'single-column': !videoData.matched_segments?.length } ">
      <div class="video-content">
        <!-- 左邊 -->
        <div class="video-player-section">
          <iframe
            v-if="videoData?.url"
            :src="iframeSrc"
            frameborder="0"
            allowfullscreen
            class="main-video"
          ></iframe>
          <h1 class="title">{{ videoData.title }}</h1>
          <FavoriteButton :video-id="videoData.video_id" />
          <p class="summary">{{ videoData.summary || '未知' }}</p>
        </div>

        <!-- 右邊 -->
        <div v-if="videoData.matched_segments?.length" class="all-segments">
          <h2 class="title">全場最佳</h2>

          <div class="segment-cardBox">
            <div
              v-for="(segment, index) in videoData.matched_segments"
              :key="index"
              @click="goToSegment(segment)"
              class="segment-card"
            >
              <div class="segment-time">⏱ {{ segment.start }}</div>
              <div class="summary">{{ segment.summary }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.video-page {
  background-color: #cdeaf8;
  min-height: calc(100vh - 70px);
  padding: 2rem;
  font-family: 'Noto Sans TC', sans-serif;
  display: flex;
  justify-content: center;
}

.loading,
.error {
  font-size: 1.3rem;
  color: #333;
}

.video-layout {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 1400px;
  background: #fffbd9;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 沒有右側時 */
.video-layout.single-column {
  flex-direction: column;
  max-width: 960px;
}

.video-content {
  display: flex;
  flex-direction: row; /* 左右排版 */
  gap: 32px;
  width: 100%;
}

.left-panel {
  flex: 1 1 55%;
}

.right-panel {
  flex: 1 1 45%;
}

.video-player-section {
  flex: 2;
  display: flex;
  flex-direction: column;
}

.main-video {
  width: 100%;
  height: 500px;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.6rem;
  font-weight: bold;
  color: #1a3f5c;
  margin-bottom: 1rem;
}

.summary {
  font-size: 1rem;
  color: #444;
  line-height: 1.6;
  white-space: pre-wrap;
}

.all-segments {
  /* margin-top: 2rem; */
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 樣式一 */
/* .segment-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 10px;
} */
/* 樣式二 */
.segment-cardBox {
  /* display: flex;
  flex-direction: column;
  gap: 12px; */
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  /* margin-top: 1rem; */
}

.segment-card {
  background-color: #fdfae0;
  border-radius: 10px;
  padding: 12px 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  cursor: pointer;
}

.segment-card:hover {
  transform: translateY(-10px);
}

.segment-time {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
</style>