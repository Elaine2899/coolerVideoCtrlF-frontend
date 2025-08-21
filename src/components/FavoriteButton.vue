<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

// Props
const props = defineProps({
  videoId: { type: String, required: true }
})

const visible = ref(false)
const selectedCollection = ref('')
const newCollectionName = ref('')
const collectionNameList = ref([])
const isCollected = ref(false)

// 通知父組件（可選）
const emit = defineEmits(['updated'])

const fetchCollectionsAndCheck = async () => {
  try {
    const token = localStorage.getItem('access_token')
    const res = await axios.get('http://localhost:8000/favorite_video', {
      headers: { Authorization: token },
      params: { order: 'show_all_videos' }
    })
    collectionNameList.value = res.data.favorites || []

    // 檢查是否已收藏
    isCollected.value = collectionNameList.value.some(c =>
      c.videos?.some(v => v.video_id === props.videoId)
    )
  } catch (e) {
    console.error('讀取收藏類別失敗', e)
  }
}

// onMounted(fetchCollectionsAndCheck)
watch(() => props.videoId, fetchCollectionsAndCheck, { immediate: true })

const open = () => {
  if (!props.videoId) return
  selectedCollection.value = ''
  newCollectionName.value = ''
  visible.value = true
  fetchCollectionsAndCheck()
}

const close = () => {
  visible.value = false
}

const confirmAdd = async () => {
  const token = localStorage.getItem('access_token')
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

  try {
    await axios.get('http://localhost:8000/favorite_video', {
      headers: { Authorization: token },
      params: {
        order: 'add_collection_video',
        collection_name: targetCollection,
        video_id: props.videoId
      }
    })
    isCollected.value = true
    emit('updated')
    close()
  } catch (e) {
    alert('新增收藏影片失敗')
  }
}
</script>

<template>
  <div>
    <!-- 愛心方框按鈕（全 inline 樣式） -->
    <button
      @click.stop="open"
      :aria-pressed="isCollected.toString()"
      :title="isCollected ? '已收藏' : '加入收藏'"
      :style="{
        width: '80px',
        height: '40px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',        // 方框內保持透明
        border: '1.5px solid #dc3545',         // 紅色外框（Bootstrap danger 紅）
        borderRadius: '10px',
        padding: '0',
        cursor: 'pointer',
        transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease'
      }"
    ><p style="color: black;font-size: 15px;margin-right: 10px;">收藏</p>
      <i
        :class="isCollected ? 'bi bi-heart-fill' : 'bi bi-heart'"
        :style="{
          fontSize: '1.2rem',
          color: '#dc3545'                      // 愛心顏色紅色（未收藏 = 紅色空心；已收藏 = 紅色實心）
        }"
      />
    </button>

    <!-- 彈窗 -->
    <Teleport to="body">
    <div v-if="visible" class="modal-mask" @click.self="close">
      <div class="modal">
        <h3>選擇收藏類別</h3>
        <div class="collection-list">
          <label
            v-for="c in collectionNameList"
            :key="c.collection_name"
            class="collection-item"
          >
            <input
              type="radio"
              name="collection"
              :value="c.collection_name"
              v-model="selectedCollection"
            />
            <span>{{ c.collection_name }}</span>
          </label>
          <div v-if="!collectionNameList?.length" class="empty">目前還沒有收藏類別</div>
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
          <button class="btn ghost" @click="close">取消</button>
          <button class="btn primary" @click="confirmAdd">加入</button>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<style scoped>
.heart-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.8rem;
  padding: 0.2rem;
  transition: transform 0.2s ease;
}
.heart-btn:hover {
  transform: scale(1.2);
}
.heart {
  font-size: 1.8rem;
}
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
.collection-list {
  max-height: 220px;
  overflow: auto;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 0.5rem;
  background: #fafafa;
}
.collection-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
}
.collection-item:hover {
  background: #eef6ff;
}
.empty {
  color: #8c8c8c;
  padding: 0.5rem;
  text-align: center;
}
.divider {
  text-align: center;
  color: #9aa6b2;
  margin: 0.8rem 0;
}
.new-collection input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d7d7d7;
  border-radius: 8px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn {
  padding: 0.55rem 1rem;
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
.btn.primary:hover {
  background: #2f405a;
}
</style>
