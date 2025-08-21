<script>
export default {
  name: 'VideoView'
}
</script>
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import SearchBox from '@/components/SearchBox.vue'

const route = useRoute()
const router = useRouter()
const query = ref(route.query.query || '')
const results = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const hasFetched = ref(false)

// 收藏彈窗狀態
const showCollectionModal = ref(false)
const selectedCollection = ref('')
const newCollectionName = ref('')
const pendingVideoId = ref(null) // 暫存要收藏的那支影片 id
const CollectionName = ref([])

const fetchResults = async () => {
  if (!query.value || hasFetched.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await axios.get('http://localhost:8000/search', {
      params: { query: query.value },
      timeout: 180000, // 指定 timeout 時間（ms）
    })
    results.value = res.data.results
    router.replace({ query: { query: query.value } })
    hasFetched.value = true
  } catch (e) {
    errorMessage.value = '搜尋錯誤：' + (e?.message || '發生未知錯誤')
    console.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

// 初次載入 or URL query 改變時重新抓資料
onMounted(() => {
  console.log('VideoView mounted')
  fetchResults()
})
onUnmounted(() => {
  console.log('VideoView unmounted')
})
watch(() => route.query.query, (newQuery) => {
  query.value = newQuery || ''
  hasFetched.value = false
  fetchResults()
}, { immediate: true })

// 觀看影片紀錄--TimLin
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
    alert(videoId + ' 已點擊')
    console.error('❌ 點擊記錄失敗', err)
  }
}
const onClickVideo = (videoId) => {
  // 假設你不知道 from/to，就填 0
  recordVideoClick(videoId, 0, 0)
}

const handleOverlayClick = (videoId) => { 
  
  onClickVideo(videoId)
}

const onSearch = () => {
  router.push({ query: { query: query.value || '' } }) 
}




// 打開彈窗（呼叫時帶入當前影片的 id）製作收藏按鈕
const selectCollection = async (videoId) => {
  pendingVideoId.value = videoId
  // 若你已有 fetchFavoriteCollection()，這邊可先刷新一次
  try {
    const token = localStorage.getItem('access_token')
    const res = await axios.get('http://localhost:8000/favorite_video', {
      headers: { Authorization: token },
      params: { order: 'show_all_videos' }
    })
    CollectionName.value = res.data.favorites || []
  } catch (e) {
    console.error('讀取收藏類別失敗', e)
  }
  selectedCollection.value = ''
  newCollectionName.value = ''
  showCollectionModal.value = true
}

// 確認加入收藏
const confirmAddToCollection = async () => {
  if (!pendingVideoId.value) return
  const token = localStorage.getItem('access_token')

  // 先處理「如果輸入了新收藏名稱就先建立」
  let targetCollection = selectedCollection.value
  if (!targetCollection && newCollectionName.value.trim()) {
    try {
      await axios.get('http://localhost:8000/favorite_video', {
        headers: { Authorization: token },
        params: { order: 'add_collection', collection_name: newCollectionName.value.trim() }
      })
      targetCollection = newCollectionName.value.trim()
    } catch (e) {
      alert('新增收藏類別失敗')
      return
    }
  }

  if (!targetCollection) {
    alert('請選擇或輸入收藏類別')
    return
  }

  // 加入影片到收藏
  try {
    await axios.get('http://localhost:8000/favorite_video', {
      headers: { Authorization: token },
      params: { order: 'add_collection_video', collection_name: targetCollection, video_id: pendingVideoId.value }
    })
    showCollectionModal.value = false
    alert('已加入收藏！')
  } catch (e) {
    alert('新增收藏影片失敗')
  }
}
</script>

<template>
  <div class="container">
    <div>
      <SearchBox v-model="query" @enter="onSearch" />
    </div>

    <!-- Loading 狀態 -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>搜尋中，請稍候...</p>
    </div>

    <!-- 結果區塊 -->
    <div v-else-if="results.length">
      <div v-for="item in results" :key="item.url" class="card">
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
            <iframe :src="item.url" frameborder="0" allowfullscreen class="video"></iframe>
          </div>
        </router-link>

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

        <!--<button @click.stop="selectCollection(item.video_id)">收藏影片</button>-->
        <!-- 收藏選擇彈窗 -->
              <div v-if="showCollectionModal" class="modal-mask" @click.self="showCollectionModal = false">
                <div class="modal">
                  <h3>選擇收藏類別</h3>

                  <div class="collection-list">
                    <label v-for="c in CollectionName" :key="c.collection_name" class="collection-item">
                      <input
                        type="radio"
                        name="collection"
                        :value="c.collection_name"
                        v-model="selectedCollection"
                      />
                      <span>{{ c.collection_name }}</span>
                    </label>
                    <div v-if="!CollectionName?.length" class="empty">目前還沒有收藏類別</div>
                  </div>

                  <div class="divider">或</div>

                  <div class="new-collection">
                    <input
                      type="text"
                      v-model="newCollectionName"
                      placeholder="輸入新的收藏類別名稱"
                    />
                  </div>

                  <div class="actions">
                    <button class="btn ghost" @click="showCollectionModal = false">取消</button>
                    <button class="btn primary" @click="confirmAddToCollection">加入</button>
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
  background: #D4F1F9;
  padding: 2rem 15%;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  padding: 2rem;
}

.spinner {
  border: 4px solid rgba(118, 129, 221, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
.loading p {
  color: #3d5373;
  text-decoration: none;
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
  display: grid;
  grid-template-columns: 1fr 2fr;
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
<!-- /* .card {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #FFFBD9;
  color: white;
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: 1rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.card a {
  text-decoration: none;
  color: #3d5373;
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
.video {
  width: 350px;
  height: 200px;
  border-radius: 8px;
}
.title {
  width: 350px;
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
  font-size:1rem;
}
.tag {
  display: inline-block;
  color: rgba(61, 83, 115, 0.5);
  border-radius: 3px;
  margin-right: 5px;
} */
</style> -->
