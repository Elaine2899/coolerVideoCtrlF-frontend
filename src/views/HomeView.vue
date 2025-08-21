<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchBox from '@/components/SearchBox.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const recommendedVideos = ref([])

onMounted(() => {
  // 回到首頁預設乾淨
  searchQuery.value = ''
})

// 若用返回鍵回到首頁，也清空
watch(() => route.path, (p) => {
  if (p === '/') {
    searchQuery.value = ''
  }
})

const doSearch = async () => {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/video', query: { query: searchQuery.value } })
}

const fetchRecommendedVideos = async () => {
  const token = localStorage.getItem('access_token')
  const res = await axios.get('http://localhost:8000/recommend', {
    headers: { Authorization: token }
  })
  recommendedVideos.value = res.data.videos.map(video => ({
    title: video.title,
    url: video.embed_url,
    id : video.video_id,
  }))
  
}

const recordVideoClick = async (videoId, fromSec = 0, toSec = 0) => {// 記錄點擊事件
  const token = localStorage.getItem('access_token')
  try {
    const res = await axios.post('http://localhost:8000/click_video', {
      video_id: videoId,
      watched_from_sec: fromSec,
      watched_to_sec: toSec
    }, {
      headers: { Authorization: token }
    })
  
    console.log('✅ 點擊已記錄', res.data)
   
  } catch (err) {
    
    console.error('❌ 點擊記錄失敗', err)
  }
}

const onClickVideo = (videoId) => {
  // 假設你不知道 from/to，就填 0
  recordVideoClick(videoId, 0, 0)
}

onMounted(fetchRecommendedVideos)

const clickedVideoIds = ref(new Set())
const handleOverlayClick = (videoId) => {
  if (clickedVideoIds.value.has(videoId)) return
  clickedVideoIds.value.add(videoId)
  onClickVideo(videoId)
}
</script>

<template>
  <div class="homeBox">
    <h2>問點東西吧</h2>

    <!-- 搜尋區 -->
    <div class="searchBox">
      <SearchBox v-model="searchQuery" @enter="doSearch" />
    </div>

    <!-- 推薦影片 -->
    <div class="recommended" v-if="recommendedVideos.length">
      <h3>推薦影片</h3>
      <div class="video-grid">
        <div
          class="video-card"
          v-for="video in recommendedVideos"
          :key="video.url"
        >
          <router-link
          :to="{
            name: 'Detail',
            params: { id: video.id },
            // query: { query: query }
          }"
          class="video-card-link"
          >
            <div class="iframe-wrapper">
              <!-- 嵌入影片 -->
              <iframe
                v-if="video.url.includes('embed')"
                :src="video.url"
                frameborder="0"
                allowfullscreen
                class="video-iframe"
              ></iframe>

              <!-- 點擊遮罩，僅在未點擊過時出現 -->
              <div
                v-if="!clickedVideoIds.has(video.id)"
                class="iframe-overlay"
                @click="handleOverlayClick(video.id)"
              ></div>

              <!-- 非嵌入影片時用超連結 -->
              <a
                v-else
                :href="video.url"
                target="_blank"
                rel="noopener"
                class="video-title"
                @click.stop="onClickVideo(video.id)"
              >
              </a>
            </div>
            <p class="video-caption">{{ video.title }}</p>
          </router-link>

          <!-- 收藏影片 -->
          <!--<FavoriteButton :video-id="video.id" />-->
        </div>
      </div>
    </div>

    <!-- 無推薦影片時顯示提示 -->
    <div v-else class="recommended">
      <p>搜尋點什麼吧！</p>
    </div>
  </div>
</template>


<style scoped>
.homeBox {
  background-color: #D4F1F9;
  min-height: calc(100vh - 60px);
  font-family: 'Noto Sans TC', sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.homeBox h2 {
  margin-top: 1.5rem;
  color: #333;
}

.searchBox {
  width: 100%;
}
.recommended {
  width: 90%;
  max-width: 1000px;
  margin: 2em auto;
  text-align: center;
}

.recommended h3 {
  margin-bottom: 1em;
  color: #333;
}
.video-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
}

.video-card {
  background-color: #FFFBD9;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  width: 300px;
  text-align: center;
  transition: transform 0.3s ease;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-iframe {
  width: 100%;
  height: 170px;
  border-radius: 8px;
}

.video-title {
  display: block;
  font-weight: bold;
  margin: 0.5em 0;
  text-decoration: none;
  color: #007bff;
  transition: color 0.2s ease;
}

.video-title:hover {
  color: #0056b3;
}

.video-caption {
  font-size: 0.9rem;
  color: #555;
}
.iframe-wrapper {
  position: relative;
  width: 100%;
  height: 170px;
}

.video-iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.iframe-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  cursor: pointer;
  background-color: transparent;
}

/* 收藏的CSS */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.modal {
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 10px 40px rgba(0,0,0,.2);
}

.modal h3 {
  margin: 0 0 .8rem;
  color: #2c3e50;
}

.collection-list {
  max-height: 220px;
  overflow: auto;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: .5rem;
  background: #fafafa;
}

.collection-item {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .4rem .5rem;
  border-radius: 6px;
  cursor: pointer;
}
.collection-item:hover {
  background: #eef6ff;
}

.empty {
  color: #8c8c8c;
  padding: .5rem;
  text-align: center;
}

.divider {
  text-align: center;
  color: #9aa6b2;
  margin: .8rem 0;
}

.new-collection input {
  width: 100%;
  padding: .6rem .75rem;
  border: 1px solid #d7d7d7;
  border-radius: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
  margin-top: 1rem;
}

.btn {
  padding: .55rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.btn.ghost {
  background: #eef2f6;
  color: #3d5373;
}
.btn.primary {
  background: #3d5373;
  color: #fff;
}
.btn.primary:hover { background: #2f405a; }

</style>