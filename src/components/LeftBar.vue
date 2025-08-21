<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useLeftbar } from '@/composables/useLeftbar'
import axios from 'axios'

// 收起
const { collapsed, toggle, open, close } = useLeftbar()
const classes = computed(() => ({
  leftbar: true,
  collapsed: collapsed.value,
}))

// emit phase 資料給 MapView
const emit = defineEmits(['selectPhase', 'refreshDelete', 'openAnalysis'])

const openQuery = reactive({})
const learningMaps = ref({})

// 只回傳有 query 且 phases 不為空的項目
const filteredLearningMaps = computed(() => {
  return Object.entries(learningMaps.value).map(([query, data]) => ({
    query,
    map_id: data.map_id,
    learning_map: data.learning_map,
  })).filter(entry =>
    entry.query && entry.learning_map && Object.keys(entry.learning_map).length > 0
  )
})

const fetchLearningMaps = async () => {
  const token = localStorage.getItem("access_token")
  try {
    const res = await axios.get('http://localhost:8000/show_learning_map', {
      headers: {
        Authorization: token
      }
    })

    const maps = res.data
    learningMaps.value = {} // 清空原本資料
    Object.keys(openQuery).forEach(k => delete openQuery[k]) // 重置 open 狀態

    maps.forEach(({ query, learning_map, map_id }) => {
      learningMaps.value[query] = {
        map_id,
        learning_map
      }
      openQuery[query] = true
    })

  } catch (err) {
    console.error("API 認證失敗", err.response?.data || err.message)
  }
}
// defineExpose({ fetchLearningMaps })

onMounted(async () => {
  fetchLearningMaps()
})

const toggleQuery = (query) => {
  openQuery[query] = !openQuery[query]
}

const handlePhaseClick = (query, phaseKey, phaseData,mapId) => {
  emit('selectPhase', {
    query,
    phaseKey,
    map_id: mapId, //傳map_id給 MapView
    ...phaseData
  })
}
const deleteMap = async (query) => {
  const token = localStorage.getItem("access_token")
  const mapId = learningMaps.value[query]?.map_id

  if (!mapId) return

  const confirmed = confirm(`確定要刪除 map_id 為 "${mapId}" 的學習地圖 "${query}" 嗎？這將無法復原。`)
  if (!confirmed) {
    return
  }

  try {
    await axios.delete('http://localhost:8000/delete_learning_map', {
      params: { map_id: mapId },
      headers: { Authorization: token }
    })

    // 刪除後清除 local data
    delete learningMaps.value[query]
    delete openQuery[query]
    // 通知 MapView 更新狀態
    emit('refreshDelete', mapId)
     // 刷新 LeftBar
    await fetchLearningMaps()

  } catch (err) {
    console.error("刪除學習地圖失敗", err.response?.data || err.message)
  }
}
defineExpose({ toggle, open, close, fetchLearningMaps })
</script>

<template>
  <aside :class="classes">
    <div v-for="entry in filteredLearningMaps" :key="entry.query">

      <div
  class="section"
  style="display: flex; justify-content: space-between; align-items: center;"
>
  <div @click="toggleQuery(entry.query)" style="flex: 1; cursor: pointer;">
    <span class="arrow">{{ openQuery[entry.query] ? '▼' : '▶' }}</span>
    {{ entry.query }}
  </div>

  <!-- ⬇️ 這裡改成刪除鍵，並阻止冒泡避免展開/收合 -->
  <button
    class="danger-btn"
    @click.stop="deleteMap(entry.query)"
    aria-label="刪除學習地圖"
    title="刪除學習地圖"
  >
    🗑️
  </button>
</div>

   <div v-if="openQuery[entry.query]" class="sub-section">
  <div
    class="item"
    v-for="(phase, phaseKey) in entry.learning_map"
    :key="phaseKey"
    @click="handlePhaseClick(entry.query, phaseKey, phase, entry.map_id)"
  >
    {{ phase.title }}
  </div>

  <!-- ⬇️ 改成把學習分析放在展開區塊底部 -->
  <div
  class="item analyze-entry"
  @click.stop="emit('openAnalysis', { map_id: entry.map_id, query: entry.query })"
  style="display:flex; align-items:center; gap:.4rem;"
>
  <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
    <path d="M3 17L9 11L13 14L21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="9" cy="11" r="1.5" fill="currentColor"/>
    <circle cx="13" cy="14" r="1.5" fill="currentColor"/>
    <circle cx="21" cy="6"  r="1.5" fill="currentColor"/>
  </svg>
  學習分析
</div>
</div>

    </div>
  </aside>
</template>

<style scoped>
.leftbar {
  align-self: start;
  position: sticky;
  height: max(var(--mapPage-h, 0px), 100dvh);
  top: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: rgba(254, 224, 226, 0.5);
  color: #9B1D20;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 0.95rem;
  /* 隱藏 Firefox 的滾動條 */
  scrollbar-width: none;
  transition: opacity .2s ease;
  z-index: 1;
}

 /* 隱藏 Chrome / Safari 的滾動條 */
.leftbar::-webkit-scrollbar {
  display: none;
}

.leftbar.collapsed {
  opacity: 0;
  pointer-events: none;
}

.section {
  padding: 0.5rem;
  background-color: rgba(240, 229, 155, 1);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.section:hover {
  background-color: rgb(219, 205, 116);
}

.sub-section {
  background-color: rgba(240, 229, 155, 0.6);
  padding-left: 1rem;
}

.item {
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  transition: transform 0.3s ease;
  border-radius: 4px;
}

.item:hover {
  background-color: rgb(224, 215, 155);
  transform: translateX(0.3rem);
}

.arrow {
  width: 1rem;
  display: inline-block;
}
/* ===== 科技感「學習分析」按鈕 ===== */
.section .analyze-btn {
  flex: 0 0 auto;                /* 不要被壓縮 */
}

.analyze-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 6px 12px;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: .3px;

  color: #fff;
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(255,255,255,.15) 0%, rgba(255,255,255,0) 60%),
    linear-gradient(135deg, #5B8CFF 0%, #7C4DFF 60%, #00D4FF 100%);

  border: 1px solid rgba(255,255,255,.25);
  border-radius: 10px;

  box-shadow:
    0 2px 10px rgba(92, 133, 255, .25),
    inset 0 0 0 1px rgba(255,255,255,.08);
  backdrop-filter: saturate(1.2);

  cursor: pointer;
  transition: transform .15s ease, box-shadow .2s ease, filter .2s ease, background .25s ease;
}

.analyze-btn .icon {
  width: 16px;
  height: 16px;
  opacity: .95;
}

/* 右上角微光點＋呼吸動效 */
.analyze-btn .glow-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, #fff, #7C4DFF 60%, rgba(124,77,255,0) 70%);
  filter: blur(.3px);
  pointer-events: none;
  animation: pulse 2.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: .9; }
  50%      { transform: scale(1.3); opacity: .5; }
}

.analyze-btn:hover {
  box-shadow:
    0 6px 18px rgba(92, 133, 255, .38),
    inset 0 0 0 1px rgba(255,255,255,.1);
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.analyze-btn:active {
  transform: translateY(0);
  box-shadow:
    0 3px 10px rgba(92, 133, 255, .28),
    inset 0 0 0 1px rgba(255,255,255,.08);
}

.analyze-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(0, 212, 255, .35),
    0 8px 20px rgba(92, 133, 255, .35);
}

/* 偏好減少動效的使用者 */
@media (prefers-reduced-motion: reduce) {
  .analyze-btn,
  .analyze-btn .glow-dot {
    animation: none;
    transition: none;
  }
}
/* ===== 科技感：刪除鍵（danger-btn）===== */
.danger-btn {
  --glow: rgba(255, 71, 87, .55);
  --bg1: #ff6b6b;              /* 主色 */
  --bg2: #ff3b3b;              /* hover 深色 */
  --border: rgba(255, 255, 255, .28);

  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 36px;
  height: 32px;
  padding: 0;

  color: #fff;
  background:
    radial-gradient(140% 140% at 0% 0%, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 60%),
    linear-gradient(135deg, var(--bg1), #ff3366 60%, #ff1e56 100%);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow:
    0 6px 16px var(--glow),
    inset 0 0 0 1px rgba(255,255,255,.08);
  cursor: pointer;

  transition: transform .15s ease, box-shadow .2s ease, filter .2s ease, background .25s ease;
}

.danger-btn:hover {
  background:
    radial-gradient(140% 140% at 0% 0%, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 60%),
    linear-gradient(135deg, var(--bg2), #ff214d 60%, #ff0f4a 100%);
  box-shadow:
    0 10px 22px var(--glow),
    inset 0 0 0 1px rgba(255,255,255,.1);
  transform: translateY(-1px);
  filter: brightness(1.02);
}

.danger-btn:active {
  transform: translateY(0);
  box-shadow:
    0 5px 14px var(--glow),
    inset 0 0 0 1px rgba(255,255,255,.08);
}

.danger-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(255, 71, 87, .35),
    0 10px 24px var(--glow);
}

/* ===== 科技感：學習分析（列表項目樣式）------------------------===== */
.item.analyze-entry {
  position: relative;
  border-radius: 10px;
  padding: 0.5rem 0.65rem;

  color: #17324a;
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 60%),
    linear-gradient(135deg, #5B8CFF 0%, #7C4DFF 60%, #00D4FF 100%);
  color: #fff;
  border: 1px solid rgba(255,255,255,.25);
  box-shadow:
    0 6px 16px rgba(91, 140, 255, .35),
    inset 0 0 0 1px rgba(255,255,255,.08);
  backdrop-filter: saturate(1.15);

  transition: transform .15s ease, box-shadow .2s ease, filter .2s ease, background .25s ease;
}

.item.analyze-entry .icon {
  opacity: .95;
}

/* 右上角微光點（呼吸） */
.item.analyze-entry::after {
  content: "";
  position: absolute;
  top: 4px; right: 6px;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, #fff, #7C4DFF 60%, rgba(124,77,255,0) 70%);
  filter: blur(.35px);
  animation: pulseGlow 2.1s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulseGlow {
  0%, 100% { transform: scale(1); opacity: .9; }
  50%      { transform: scale(1.35); opacity: .55; }
}

.item.analyze-entry:hover {
  transform: translateX(.15rem);
  filter: brightness(1.04);
  box-shadow:
    0 10px 22px rgba(91, 140, 255, .42),
    inset 0 0 0 1px rgba(255,255,255,.1);
}

.item.analyze-entry:active {
  transform: translateX(0);
  box-shadow:
    0 6px 16px rgba(91, 140, 255, .32),
    inset 0 0 0 1px rgba(255,255,255,.08);
}

/* 無障礙：鍵盤可見焦點（把 div 視覺上像按鈕） */
.item.analyze-entry:focus {
  outline: none;
}
.item.analyze-entry:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(0, 212, 255, .38),
    0 10px 24px rgba(91, 140, 255, .35);
}

/* 減少動態偏好 */
@media (prefers-reduced-motion: reduce) {
  .danger-btn,
  .item.analyze-entry {
    transition: none;
    animation: none;
  }
}
</style>


