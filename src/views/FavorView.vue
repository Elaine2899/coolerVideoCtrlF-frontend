<script setup>
// # 收藏影片的區塊，顯示、新增或是刪除收藏影片
// @router.get("/favorite_video")
// def favorite_video(video_id: int,order:str, user_id: int = Depends(get_current_user)):
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// 後端「show_all_videos」回傳的總清單（每筆是 { collection_name, videos: [] }）
const all_videos = ref([])

const newCollectionName = ref('')
const activeCollection = ref(null) // 目前選到的 collection_name

const isLoading = ref(false)
const isLoadingVideos = ref(false)
const errorMessage = ref('')

const token = localStorage.getItem('access_token')

// 依照目前選到的收藏夾，計算出要顯示的影片清單
const currentVideos = computed(() => {
  const col = all_videos.value.find(c => c.collection_name === activeCollection.value)
  return col?.videos || []
})

// 取得所有收藏夾與其影片
const show_all_videos = async () => {
  isLoading.value = true
  try {
    const res = await axios.get('http://localhost:8000/favorite_video', {
      headers: { Authorization: token },
      params: { order: 'show_all_videos' }
    })
    all_videos.value = res.data.favorites || []

    // 第一次載入時，如果沒有選擇，就預設選第一個
    if (!activeCollection.value && all_videos.value.length) {
      activeCollection.value = all_videos.value[0].collection_name
    }
  } catch (err) {
    errorMessage.value = err?.response?.data?.detail || '讀取收藏資料失敗'
  } finally {
    isLoading.value = false
    isLoadingVideos.value = false
  }
}

// 切換左側收藏夾
const selectCollection = (collection_name) => {
  activeCollection.value = collection_name
}

// 新增收藏夾
const addCollectionName = async (collection_name) => {
  try {
    await axios.get('http://localhost:8000/favorite_video', {
      headers: { Authorization: token },
      params: { order: 'add_collection', collection_name }
    })
    newCollectionName.value = ''
    await show_all_videos()
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || '新增收藏類別失敗'
  }
}

// 從目前選到的收藏夾刪除某支影片
const removeFavoriteVideo = async (collection_name, videoId) => {
  try {
    await axios.get('http://localhost:8000/favorite_video', {
      headers: { Authorization: token },
      params: { order: 'delete_collection_video', video_id: videoId, collection_name }
    })
    await show_all_videos()
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || '刪除收藏影片失敗'
  }
}

// 刪除整個收藏夾
const removeFavoriteCollection = async (collection_name) => {
  try {
    await axios.get('http://localhost:8000/favorite_video', {
      headers: { Authorization: token },
      params: { order: 'delete_collection', collection_name }
    })

    // 若刪掉的是目前選到的那個，就清空選擇
    if (activeCollection.value === collection_name) {
      activeCollection.value = null
    }
    await show_all_videos()
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || '刪除收藏類別失敗'
  }
}

onMounted(show_all_videos)
</script>

<template>
  <div class="container">
    <h1>我的收藏集</h1>

    <div class="content-wrapper">
      <!-- 左邊 收藏夾列表 -->
      <div class="collections-list">
        <div v-if="isLoading" class="loading">載入收藏夾中...</div>
        <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>
        <ul v-else>
          <li v-for="collection in all_videos"
              :key="collection.collection_name"
              :class="{ active: activeCollection === collection.collection_name }"
              @click="selectCollection(collection.collection_name)">
            <div style="display:flex;justify-content: space-between;align-items: center;">
              <h2>{{ collection.collection_name }}</h2>
              <button
                @click.stop="removeFavoriteCollection(collection.collection_name)"
              >🗑️</button>
            </div>
          </li>
        </ul>

        <!-- 新增收藏夾 -->
        <div class="new-collection">
          <input v-model="newCollectionName" placeholder="輸入新收藏類別名稱" />
          <button @click="addCollectionName(newCollectionName)">新增</button>
        </div>
      </div>

      <!-- 右邊 收藏夾影片 -->
      <div class="videos-list">
        <div v-if="isLoadingVideos" class="loading">載入影片中...</div>
        <div v-else>
          <div v-for="item in currentVideos" :key="item.url" class="card">
          <div v-if="!item.video_id" ></div>
          <div v-else>
            <router-link
              :to="{
                name: 'Detail',
                params: { id: item.video_id },
                query: { query: query }
              }"
              class="card-link"
              @click="handleOverlayClick(item.video_id)" 
            >
            <div class="left">
              <iframe :src="item.embed_url" frameborder="0" allowfullscreen class="video"></iframe>
            </div>
            </router-link>  
            </div>
            <div v-if="!item.video_id" >沒有可顯示的影片資料</div>
            <div v-else >
              <div class="right">
                <router-link
                  :to="{
                    name: 'Detail',
                    params: { id: item.video_id },
                    query: { query: query }
                  }"
                  class="card-link"
                  @click="handleOverlayClick(item.video_id)" 
                >
                  <div class="title">{{ item.title }}</div>
                  <div class="summary">
                    <div v-for="(line, idx) in item.summary.split('\n')" :key="idx">
                      {{ line }}
                    </div>
                  </div>
                </router-link>             
                <div v-if="item.tags?.length" class="tags">
                    <span v-for="(tag, tIdx) in item.tags" :key="tIdx" class="tag">#{{ tag }}</span>
                </div>
              </div>
            </div>
            <div v-if="item.video_id" class="video-actions">
              <button
                @click="removeFavoriteVideo(activeCollection, item.video_id)"
                class="delete-btn"
              ><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持你的原本排版，不動樣式 */
.container {
  padding: 1rem;
  background-color: #f4fcff;
  min-height: 100vh;
}

.content-wrapper {
  display: flex;
  gap: 1rem;
}

.collection-item {
  display: flex;
  justify-content: space-between; /* 左右分開 */
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.collection-item:hover {
  background-color: #e0f7fa;
}

.collection-item.active {
  background-color: #b2ebf2;
  font-weight: bold;
}

/* 左邊收藏夾：固定寬度 */
.collections-list {
  flex: 0 0 180px; /* 不伸縮、不縮小，固定 180px */
  border-right: 1px solid #ccc;
  padding-right: 1rem;
}

.collections-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.collections-list li {
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.collections-list li:hover {
  background-color: #e0f7fa;
}

.collections-list li.active {
  background-color: #b2ebf2;
  font-weight: bold;
}


.video-actions {
  flex: 0 0 auto; /* 不伸縮，保持按鈕寬度 */
  display: flex;
  justify-content: center; /* 水平置中 */
  align-items: center;     /* 垂直置中 */
}
.error {
  color: white;
  background-color: #f44336;
  padding: 0.5rem;
  border-radius: 4px;
}

.loading {
  font-weight: bold;
}

.new-collection {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.delete-btn {
  background: rgb(192, 192, 192);
  border: none;
  color: red;
  font-size: 1.5rem;
  cursor: pointer;
}

.card {
  display: grid;
  grid-template-columns: 0.6fr 1.7fr 0.3fr;
  background: #FFFBD9;
  color: #3d5373;
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.card-link {
  text-decoration: none;
  color: inherit;
}
.video {
  width: 100%;
  height: 250px;
  border-radius: 8px;
}
.title {
  /* width: 85%; */
  background: rgba(61, 83, 115, 0.5);
  padding: 0.5rem 1rem;
  font-weight: bold;
  border-radius: 10px;
}
.summary {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #3d5373;
  font-size: 1rem;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  cursor: pointer;

}
.tag {
  color: rgba(61, 83, 115, 0.5);
  border-radius: 3px;
  padding: 0.2rem 0.5rem;
  background-color: rgba(61, 83, 115, 0.1);
  transition: transform 0.2s ease, background-color 0.2s ease;
}
.tag:hover {
  background-color: rgba(61, 83, 115, 0.2);
  color: #3d5373;
  transform: translateY(-5px);
}
.left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.right {
  padding: 0rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
}

</style>
