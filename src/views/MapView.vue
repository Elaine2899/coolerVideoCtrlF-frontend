<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount, nextTick  } from 'vue'
import axios from 'axios'
import LeftBar from '@/components/LeftBar.vue'
import SearchBox from '@/components/SearchBox.vue'
import AskNote from '@/components/FloatingPanel.vue'
import LearningAnalysis from '@/components/LearningAnalysis.vue'
import { useLeftbar } from '@/composables/useLeftbar.js'
// 側欄高度計算
const { collapsed } = useLeftbar()
const mapPageRef = ref(null) 
const rhsRef = ref(null)
let ro = null
const writeHeightVar = () => {
  const mapEl = mapPageRef.value
  const rhsEl = rhsRef.value
  if (!mapEl) return

  // 右欄實際高度（fallback 用 mapPage 的高度）
  const rhsH = rhsEl?.offsetHeight ?? 0
  const pageH = mapEl.offsetHeight
  const targetH = rhsH || pageH || 0

  // 寫進 inline CSS 變數：--mapPage-h
  mapEl.style.setProperty('--mapPage-h', `${targetH}px`)
}
onMounted(async () => {
  await nextTick()
  // 初始化寫一次
  writeHeightVar()

  // 監聽右欄高度變化
  ro = new ResizeObserver(() => {
    // 用 rAF 防抖，避免大量回調
    requestAnimationFrame(writeHeightVar)
  })
  if (rhsRef.value) ro.observe(rhsRef.value)

  // 視窗尺寸變化也重算
  window.addEventListener('resize', writeHeightVar)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
  window.removeEventListener('resize', writeHeightVar)
})
// 側欄高度計算結束

const showAnalysis = ref(false)
const currentMapId = ref(null)     // ✅ 新增
const currentPhase = ref('')        // 可選，給折線圖的 phase 篩選

const openAnalysis = ({ map_id, phase_number }) => {
  currentMapId.value = map_id
  currentPhase.value = phase_number || ''
  showAnalysis.value = true
}
const closeAnalysis = () => { showAnalysis.value = false }

const isHelpPanelOpen = ref(false)

const mapQuery = ref('')
// 搜尋欄
const helperQuery = ref('')
const isLoading = ref(false)


// 測驗
const selectedPhase = ref(null) // 儲存目前被選到的 phase
const generateStatus = ref('idle')
const generatedQuestions = ref([]) 
const isSubmit = ref(false);
const showResult = ref(false);
const score = ref(0); 
const isMinimized = ref(false)
const quizVersion = ref(0)
const submitStatus = ref('idle') // 'idle' | 'submitting'

// ?
const AiAnswer = ref('')
const noteText = ref("")
const notes = ref([]) // 若你仍要顯示歷史筆記用，可保留
const handlePhaseSelect = (phase) => {
  selectedPhase.value = phase // phase 物件內應該包含 map_id
}

const currentIndex = ref(0)

// 每次跳 phase 都會回到第一部
watch(() => selectedPhase.value, () => {
  currentIndex.value = 0
})

// 將 items 中所有影片扁平化
const flattenVideos = (items) => {
    if (!Array.isArray(items)) return [];
    return items.flatMap(item => Array.isArray(item.video) ? item.video : []);
}

// 扁平化統一處理，用來精簡程式，有空再來幫程式減肥
// const videoList = computed(() => flattenVideos(selectedPhase.value?.items));

// 切換上一部影片
const prevSlide = () => {
  const allVideos = flattenVideos(selectedPhase.value?.items);
  const total = allVideos.length;
  if (total === 0) return;
  currentIndex.value = (currentIndex.value - 1 + total) % total;
}

// 切換下一部影片
const nextSlide = () => {
  const allVideos = flattenVideos(selectedPhase.value?.items);
  const total = allVideos.length;
  if (total === 0) return;
  currentIndex.value = (currentIndex.value + 1) % total;
}

const fetchLearningMaps = async () => {
  const token = localStorage.getItem("access_token")
  try {
    const res = await axios.get('http://localhost:8000/show_learning_map', {
      headers: { Authorization: token }
    })

    const maps = res.data

    if (!maps.length) return

    // 假設新增的 map 排在最後一筆（或找出符合 mapQuery 的）
    const newMap = maps.find(m => m.query === mapQuery.value)
    if (!newMap) return

    const phases = newMap.learning_map
    const firstPhaseKey = Object.keys(phases)[0]
    const firstPhase = phases[firstPhaseKey]

    selectedPhase.value = {
      query: newMap.query,
      phaseKey: firstPhaseKey,
      map_id: newMap.map_id,
      ...firstPhase,
    }
  } catch (err) {
    console.error('刷新學習地圖失敗', err.response?.data || err.message)
  }
}

// 生新地圖
const leftbarRef = ref(null)
const handleMap = async () => {
  if (isLoading.value) return
  const token = localStorage.getItem('access_token')
  if (!mapQuery.value) return

  isLoading.value = true
  try {
    console.log("生成學習地圖...")
    const res = await axios.get('http://localhost:8000/learning_map', {
      params: { query: mapQuery.value },
      headers: {
        Authorization: token
      }
    })
    // 回傳學習地圖已存在
    if (res.data.message ==='學習地圖已存在') {
      alert('學習地圖已存在，請直接點選左側欄位查看')
      return
    }

    const result = res.data

    if (result.query && result.learning_map && Object.keys(result.learning_map).length > 0) {
      // 自動選第一個階段
      const phaseKeys = Object.keys(result.learning_map).sort() // phase_1, phase_2, ...
      const firstPhaseKey = phaseKeys[0]
      const firstPhaseData = result.learning_map[firstPhaseKey]
      
      // handlePhaseSelect({ query: result.query, ...result.learning_map })
      handlePhaseSelect({
        query: result.query,
        map_id: result.map_id,
        phaseKey: firstPhaseKey,
        ...firstPhaseData
      })

      // LeftBar 刷新
      await leftbarRef.value?.fetchLearningMaps()
      await fetchLearningMaps()
    } else {
      console.warn('後端回傳空的學習地圖')
    }
  } catch (err) {
    console.error('生成學習地圖失敗', err.response?.data || err.message)
  }finally {
    isLoading.value = false
  }
}

// 刪除後清除選取狀態
const handleDeleteRefresh = async (deletedMapId) => {
  if (selectedPhase.value?.map_id === deletedMapId) {
    selectedPhase.value = null
  }
}

// 測驗
const toPhaseNumber = (s) => {
  if (typeof s === 'number') return s
  const m = String(s ?? '').match(/\d+/)
  return m ? Number(m[0]) : null
}
// ["A","B","C","D"] -> {A:"A", B:"B", C:"C", D:"D"}
const toOptionsDict = (val) => {
  if (!Array.isArray(val)) return val
  const labels = ['A','B','C','D','E','F','G','H']
  const obj = {}
  val.forEach((v, i) => { obj[labels[i] ?? String(i)] = v })
  return obj
}
const optionValues = (val) => Array.isArray(val) ? val : Object.values(val ?? {})
const sameText = (a, b) => String(a ?? '').trim() === String(b ?? '').trim()

const resetQuizUI = () => {
  isSubmit.value = false
  showResult.value = false
  score.value = 0
}

const generateQuiz = async () => {
  generateStatus.value = 'loading'
  generatedQuestions.value = []
  resetQuizUI()

  try {
    // 先把 token 拿出來並處理成 Bearer 格式
    const rawToken = localStorage.getItem('access_token') || ''
    const authHeader = rawToken.startsWith('Bearer ')
      ? rawToken
      : (rawToken ? `Bearer ${rawToken}` : '')

    const res = await axios.get('http://localhost:8000/generate_questions', {
      params: {
        map_id: selectedPhase.value?.map_id,
        phase_str: selectedPhase.value?.phaseKey
      },
      headers: authHeader ? { Authorization: authHeader } : {}
    })

    if (Array.isArray(res.data.questions)) {
      generatedQuestions.value = res.data.questions.map((q, idx) => ({
        id: (crypto?.randomUUID?.() || `${Date.now()}-${idx}`),
        question: q.question,
        options: q.options,
        answer: q.answer,
        user_answer: null,
        explain: q.explanation || ''//詳解
      }))
      quizVersion.value += 1
      generateStatus.value = 'done'
      isMinimized.value = false
    } else {
      generateStatus.value = 'idle'
      generatedQuestions.value = []
      const rawMsg = (res.data?.error || res.data?.message || '').toString()
      const friendly =
        /IN\s*\(\)/i.test(rawMsg) ? '此階段沒有可用影片，無法產生題目' :
        (res.data?.message || res.data?.error || '未取得測驗題目')
      alert(`生成失敗：${friendly}`)
      console.error('API 回傳：', res.data)
    }

  } catch (err) {
    generateStatus.value = 'idle'
    generatedQuestions.value = []
    const rawMsg = (err?.response?.data?.error || err?.message || '').toString()
    const friendly =
      /IN\s*\(\)/i.test(rawMsg) ? '此階段沒有可用影片，無法產生題目' : '生成測驗失敗'
    alert(friendly)
    console.error('生成測驗失敗：', err?.response?.data ?? err)
  } finally {
    console.log('status：', generateStatus.value)
  }
}

const submitExam = async () => {  
  isSubmit.value = true;
  showResult.value = true;

  // 計分 + 產出規格化題目（送後端用），不改動原本 generatedQuestions
  let correctCount = 0
  const normalizedQuestions = generatedQuestions.value.map((q, idx) => {
    const optsArr = optionValues(q.options)
    const correctIndex = optsArr.findIndex(opt => sameText(opt, q.answer))
    const isCorrect = (q.user_answer === correctIndex)
    const explain = q.explain 
    if (isCorrect) correctCount++

    return {
      question_number: idx + 1,
      question: q.question,
      options: toOptionsDict(q.options),                                   // 後端要 dict/jsonb
      answer: q.answer,
      user_answer: (q.user_answer != null) ? (optsArr[q.user_answer] ?? '') : '', // 後端要字串
      correct: isCorrect,
      explanation: explain
    }
  })
  
  const total = normalizedQuestions.length || 1
  score.value = Math.round((correctCount / total) * 100)
 // phase_number 轉 int
  const phase_number = toPhaseNumber(selectedPhase.value.phaseKey)
  if (phase_number == null) {
    console.error('phase_number 解析失敗：', selectedPhase.value?.phaseKey)
    alert('交卷失敗：phase_number 格式不正確')
    return
  }

  // 最終 payload
  const payload = {
    map_id: selectedPhase.value.map_id,
    phase_number,
    questions: normalizedQuestions
  }

  console.log('送後端 payload：', JSON.stringify(payload, null, 2));

  // 呼叫 API
  try {
    const token = localStorage.getItem('access_token');
    await axios.post('http://localhost:8000/exam_score', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token?.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    });
    alert('交卷成功');
  } catch (err) {
    console.error('交卷失敗詳細：', err?.response?.data ?? err);
    alert('交卷失敗');
  }
};
// 測驗結束

const onClickAnswer = (q, i) => {
  if (!showResult.value) q.user_answer = i
}
const closeQuizPanel = () => {
  resetQuizUI()
  isMinimized.value = false
  generateStatus.value = 'idle'
}

// 尋問學習助手關於目前學習地圖的問題
const askLearningAssistant = async (question) => {
  const token = localStorage.getItem('access_token')
  if (!selectedPhase.value?.map_id) {
    alert("請先選擇一張學習地圖")
    return
  }

  try {
    const res = await axios.get('http://localhost:8000/ask_ai', {
      params: { map_id: selectedPhase.value.map_id, 
                question ,
              phase_str :selectedPhase.value.phaseKey},
      headers: {
        Authorization: token
      }
    })
    AiAnswer.value= res.data.answer
  } catch (err) {
    console.error('AI 問題回答失敗', err.response?.data || err.message)
    alert("AI 問題回答失敗")
  }
}

// 載入筆記內容
const showNotes = async () => {
  const token = localStorage.getItem('access_token')
  if (!selectedPhase.value?.map_id) return

  try {
    const res = await axios.get('http://localhost:8000/get_notes', {
      params: { map_id: selectedPhase.value.map_id },
      headers: { Authorization: token }
    })
    noteText.value = res.data.note || ''
  } catch (err) {
    console.error('取得筆記失敗', err)
    noteText.value = ''
  }
}

// 儲存筆記（從 textarea 提交）
const saveNote = async () => {
  const token = localStorage.getItem('access_token')
  if (!selectedPhase.value?.map_id) {
    alert("請先選擇一張學習地圖")
    return
  }

  try {
    await axios.post('http://localhost:8000/add_note', {
      map_id: selectedPhase.value.map_id,
      note: noteText.value
    }, {
      headers: { Authorization: token }
    })
    alert("筆記已儲存")
  } catch (err) {
    console.error("儲存筆記失敗", err)
    alert("儲存筆記失敗")
  }
}

onMounted(() => {
  if (selectedPhase.value?.map_id) {
    showNotes()
  }
})

//使用者點學習地圖內的影片紀錄

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

// 每當使用者點選不同地圖
watch(
  () => selectedPhase.value?.map_id,
  (newId) => {
    if (newId) showNotes()
  }
)

// 打開彈窗（呼叫時帶入當前影片的 id）製作收藏按鈕
const selectCollection = async (videoId) => {
  pendingVideoId.value = videoId
  // 若你已有 fetchFavoriteCollection()，這邊可先刷新一次
  try {
    const token = localStorage.getItem('access_token')
    const res = await axios.get('http://localhost:8000/favorite_video', {
      headers: { Authorization: token },
      params: { order: 'show_collection' }
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
  <div class="mapPage" ref="mapPageRef" :class="{ 'is-collapsed': collapsed }">
    <!-- 側邊欄 -->
    <LeftBar ref="leftbarRef" @selectPhase="handlePhaseSelect" @refreshDelete="handleDeleteRefresh" @openAnalysis="openAnalysis" />

    <div class="layout">
      <!-- 主內容 -->
      <main class="content" ref="rhsRef">

        <!-- 生成地圖框 -->
        <div class="search-wrapper">
          <SearchBox v-model="mapQuery" placeholder="生成學習地圖..." @enter="handleMap" :disabled="isLoading" />
          <div v-if="isLoading">生成學習地圖中...</div>
        </div>
        
        <!-- 學習地圖 -->
        <div v-if="selectedPhase" class="courseContainer">
          <div class="courseLabel">{{ selectedPhase.query }}</div>
          <h1 class="selectedPhaseTitle">{{ selectedPhase.title }}</h1>

          <!-- 影片列表 -->
          <div class="carousel" v-if="selectedPhase.items?.length">
            <div class="videoContainer">
              <div class="videoBox"
                v-for="(video, idx) in flattenVideos(selectedPhase.items)"
                :key="idx"
                v-show="Math.abs(idx - currentIndex) <= 2"
                :class="{
                  active: idx === currentIndex,
                  prev: idx === currentIndex - 1,
                  next: idx === currentIndex + 1
                }"
              >
                <div class="overlay"
                  v-if="idx !== currentIndex"
                  @click="currentIndex = idx"
                ></div>  <!-- 遮罩，iframe會吃掉父層的click效果 -->
                
                <router-link class="link"
                  v-if="video.url && video.video_id"
                  :to="{ name: 'Detail', params: { id: video.video_id }, query: { query: selectedPhase.query } }"
                >
                  <div class="iframe-overlay" @click="onClickVideo(video.video_id)">
                    <iframe
                      :src="video.url"
                      frameborder="0"
                      allowfullscreen
                      style="pointer-events: none;"
                    ></iframe>
                  </div>
                </router-link>
              <!-- <button @click.stop="selectCollection(video.video_id)">收藏影片</button> -->
              <!-- 這裡應該要可以顯示每個影片的收藏按鈕 -->
              <!-- 收藏選擇彈窗 下面是當按鈕可以按時，加進去就行

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
            </div> -->

              </div>
            </div>

            
          </div>

          <!-- 點點導覽器，點點點 -->
          <div class="dots" v-if="flattenVideos(selectedPhase.items).length">
            <button class="arrow-btn left" @click="prevSlide">◀</button>
            <span
              v-for="(video, i) in flattenVideos(selectedPhase.items)"
              :key="i"
              class="dot"
              :class="{ active: i === currentIndex }"
              @click="currentIndex = i"
            ></span>
            <button class="arrow-btn right" @click="nextSlide">▶</button>
          </div>

          <!-- 摘要 -->
          <div class="summary" v-if="selectedPhase.items && selectedPhase.items.length">
            <div v-for="(item, idx) in selectedPhase.items" :key="idx">
              <p><strong>{{ item.title }}</strong></p>
              <p v-for="(step, i) in item.steps" :key="i">• {{ step }}</p>
            </div>

            <!-- 生成測驗按鈕 -->
            <div>
              <button class="generate-btn" @click="generateQuiz" :disabled="generateStatus === 'loading'">
                {{ generateStatus === 'loading' ? '生成中...' : '生成測驗' }}
              </button>
              <div v-if="generateStatus === 'loading'" class="spinner"></div>
            </div>

            <!-- 測驗題目固定面板 -->
            <transition name="quiz-fade" mode="out-in">
              <div v-if="generateStatus === 'done' && !isMinimized" 
                class="quiz-section"
                :key="'panel-' + quizVersion"
              >
                  <div class="quiz-box">
                    <!-- 縮小、關閉 -->
                    <div class="panel-ctl">
                      <img src="@/assets/minus.png" alt="minus" @click="isMinimized = true">
                      <img src="@/assets/close.png" alt="close" role="button" @click="closeQuizPanel"/>
                    </div>
                    <div class="quiz-title">
                      <h1>測驗題目</h1>
                    </div>
  
                    <div v-for="(q, qIdx) in generatedQuestions" :key="q.id" class="question">
                      <div class="question-content">
                        <p><strong>Q{{ qIdx + 1 }}. {{ q.question }}</strong></p>
                        <ul>
                          <li
                            v-for="(opt, i) in q.options"
                            :key="i"
                            :class="{
                              selected: q.user_answer === i,
                              correct: showResult && q.options[i] === q.answer,
                              wrong: showResult && q.user_answer === i && q.options[i] !== q.answer
                            }"
                            @click="onClickAnswer(q, i)"
                          >
                            {{ String.fromCharCode(65 + i) }}. {{ opt }}
                            <span v-if="showResult && q.user_answer === i">
                              <span v-if="q.options[i] === q.answer" style="color:green;">✔ 正確</span>
                              <span v-else style="color:red;">✘ 錯誤</span>
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
  
                    <div class="quiz-button">
                      <button class="generate-btn" @click="submitExam" v-if="!isSubmit" :disabled="submitStatus === 'submitting'">{{ submitStatus === 'submitting' ? '送出中...' : '交卷' }}</button>
                      <h3 v-else>得分：{{ score }}</h3>
                    </div>
                  </div>
              </div>

              <div
                v-else-if="generateStatus === 'done' && isMinimized" 
                class="quiz-minimized" 
                :key="'dot-' + quizVersion" 
                @click="isMinimized = false"
              >
                測驗
              </div>
            </transition>
          </div>

          <!-- 收合按鈕 -->
          <div class="floating-toggle" @click="isHelpPanelOpen = !isHelpPanelOpen">
            ❓
          </div>
          <!-- AI & Note -->
          <AskNote v-if="isHelpPanelOpen" @close="isHelpPanelOpen = false">
            <div class="assistant-notes">
              <h2>學習助手與筆記</h2>

              <!-- 學習助手 -->
              <div class="ask-ai">
                <SearchBox
                  v-model="helperQuery"
                  placeholder="請輸入問題..."
                  @enter="askLearningAssistant(helperQuery)"
                />
                <div v-if="AiAnswer" class="ai-answer">
                  <h3>AI 回答：</h3>
                  <p>{{ AiAnswer }}</p>
                </div>
              </div>

              <!-- 筆記區 -->
              <div class="note-section">
                <textarea
                  v-model="noteText"
                  rows="8"
                  cols="50"
                  placeholder="請輸入筆記..."
                ></textarea>
                <button @click="saveNote" class="generate-btn">儲存筆記</button>
              </div>
            </div>
          </AskNote>
        </div>
      </main>
  
      <!-- <main class="content" v-else></main> -->
    </div>
  </div>
   <!-- 🔽 這裡加上分析彈窗元件 -->
  <LearningAnalysis
     v-if="showAnalysis"
    :map-id="currentMapId"
    :phase-number="currentPhase"
    @close="closeAnalysis"
  />
</template>

<style scoped>
/* .mapPage {
  display: flex;
  align-items: stretch;
  flex-direction: row;
  background-color: #D4F1F9;
  font-family: 'Noto Sans TC', sans-serif;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
} */
.mapPage {
  --sidebar-w: clamp(200px, 13vw, 300px);
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  align-items: stretch;
  min-height: calc(100dvh - var(--navbar-h));
  font-family: 'Noto Sans TC', sans-serif;
  overflow-x: hidden;
  background-color: #D4F1F9;
  position: relative;
}
.mapPage::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-w);
  background-color: rgba(254,224,226,0.5);
  pointer-events: none;
  z-index: 0;
}
.mapPage > * {
  position: relative;
  z-index: 1;
}
.mapPage.is-collapsed {
  grid-template-columns: 0 1fr;
  --sidebar-w: 0px;   /* 背景漸層左欄寬同步為 0 */
}

.layout {
  display: flex;
  flex: 1;
  min-width: 0;
}

main.content {
  flex: 1;
  padding: 2rem;
  min-width: 0;
  /* overflow-y: auto; */
  /* position: relative; */
}

.search-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.courseLabel {
  display: inline-block;
  /* background: #8D99AE; */
  background-color: #91a3c2;
  color: white;
  /* color: #3d5373; */
  padding: 0.4rem 1rem;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  border-radius: 4px;
  /* text-align: center; */
  font-weight: bold;
  font-size: 2rem;
}
.selectedPhaseTitle {
  padding-bottom: 1rem;
}
/* carouse ==========================================  */
.carousel {
  height: 40vh;
  width: 100%;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #a9bfc5;
  /* background: #22223B; */
  /* border: 1px solid; */
  /* box-shadow: #333 ;  */
  /* padding: 1rem; */
  border-radius: 8px;
  margin-bottom: 1rem;
  position: relative;
}

.videoContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: clip;
  transition: transform 0.4s ease-in-out;
  max-width: 100%;
  height: 100%;
  /* gap: 1rem; */
}

.videoBox {
  /* width: 180px; */
  /* height: 120px; */
  flex: 0 0 clamp(2rem, 15vw, 24rem);
  aspect-ratio: 16 / 9;
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  opacity: 0.3;
  transform: scale(0.7);
  transition: all 0.4s ease;
}

.videoBox.active {
  /* width: 240px; */
  /* height: 135px; */
  opacity: 1;
  transform: scale(1);
  z-index: 2;
}
.videoBox.prev,
.videoBox.next {
  opacity: 0.6; 
  transform: scale(0.8);
  z-index: 1;
}
.overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  cursor: pointer;
}
.link {
  display: block;
  cursor: pointer;
  /* width: 100%;
  height: 100%; */
}

.videoBox iframe {
  width: 100%;
  height: 100%;
  border: none;
  /* position: absolute;
  z-index: 2; */
}

/* 點影片的遮罩 */
.iframe-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  cursor: pointer;
  background-color: transparent;
  /* min-height: 800px; */
}

/* 點點=========================== */
.dots {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  overflow-x: clip;
  flex-wrap: wrap;
}
.arrow-btn {
  padding: 0 1rem;
  margin: 0;
  background: transparent;
  color: #3d5373;
  font-size: 1.5rem;
  border: none;
  cursor: pointer;
  transition: transform 0.3s ease;
  /* z-index: 5; */
  /* color: white; */
}
.left:hover {
  transform: scale(1.05) translateX(-5px);
}
.right:hover {
  transform: scale(1.05) translateX(5px);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  transition: background 0.2s;
}

.dot.active {
  background: #3d5373;
}


/* 這是幹嘛 我找步道QQQQQQQQQQ */
.videoBox .tip {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.videoBox:hover .tip {
  transform: translateY(0%);
  opacity: 1;
}
/* QQQQQQQQQQQQQQQQ */
/* carouse結束 ========================================== */


.summary {
  background: white;
  padding: 1.5rem;
  border-radius: 4px;
}

.generate-btn {
  font-weight: bold;
  font-size: 1rem;
}

.generate-btn[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}


.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0,0,0,0.2);
  border-top: 3px solid #2c5a7a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-left: 10px;
  vertical-align: middle;
}

/* 測驗================================================== */ 
.quiz-panel-common {
  position: fixed;
  z-index: 100;
  transform-origin: bottom right;
  transition: background-color .3s ease, color .3s ease;
}

.quiz-section {
  background: #f0f8ff;
  border-radius: 6px;
  width: 70%;
  max-height: 80vh;
  overflow-y: auto;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,.15);
  position: fixed;
  z-index: 100;
  transition: background-color .3s ease, color .3s ease;
}

.quiz-minimized {
  position: fixed;
  z-index: 100;
  bottom: 80px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #3d5373;
  color: #f0f8ff;
  box-shadow: 0 4px 10px rgba(0,0,0,.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  transition: background-color .3s ease, color .3s ease;
}

.quiz-box {
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.panel-ctl {
  position: absolute;
  top: 1.5rem;
  right: 1rem;
  display: flex;
  gap: 1rem;
}

.quiz-box img {
  width: 30px;
  height: 30px;
  padding: 5px;
  border-radius: 50%;
  background-color: transparent;
  cursor: pointer;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.quiz-box img:hover{
  background-color: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
  opacity: 1;
}

.quiz-box img:active {
  transform: scale(0.95);
}

.quiz-title,
.quiz-button {
  display: flex;
  justify-content: center;
}

.question {
  overflow-y: auto;
  background: #fff;
  border-radius: 10px;
  box-sizing: border-box;
  padding: 1.5rem;
  margin-top: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.3s ease;
}

.question:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

.question-content {
  display: flex;
  flex-direction: column;
}

.question-content p {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #333;
}

.question-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.question-content li {
  padding: 12px 16px;
  margin-bottom: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  user-select: none; 
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

/* hover 效果 */
.question-content li:hover {
  background-color: #eef6ff;
}

/* 被選取的選項 */
.question-content li.selected {
  background-color: #d0ebff;
  border-color: #74c0fc;
}

/* 答對的選項 */
.question-content li.correct {
  background-color: #d3f9d8;
  border-color: #69db7c;
  color: #2b8a3e;
}

/* 答錯的選項 */
.question-content li.wrong {
  background-color: #ffe3e3;
  border-color: #ff6b6b;
  color: #c92a2a;
}

/* 顯示 ✔ / ✘ 的提示文字 */
.question-content li span {
  margin-left: 0.5rem;
  font-weight: bold;
}

.quiz-minimized:hover,
.floating-toggle:hover {
  background-color: #e0f0ff;
  color: #3d5373;
}

/* 測試動畫 */
.quiz-fade-enter-active,
.quiz-fade-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.quiz-fade-enter-from {
  opacity: 0;
  transform: scale(0.5);
}
.quiz-fade-enter-to {
  opacity: 1;
  transform: scale(1);
}
.quiz-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
.quiz-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
/* 測驗結束 */
.assistant-notes {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.assistant-notes h2 {
  margin-bottom: 1.2rem;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: bold;
}

.ask-ai {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  width: 100%;
}

.ai-answer {
  background: #f0f8ff;
  margin-top: 1rem;
  padding: 0.8rem;
  border-radius: 4px;
  width: 100%;
}

.note-section {
  margin-top: 2rem;
}

.note-section textarea {
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  resize: vertical;
  font-size: 1rem;
  font-family: inherit;
  box-sizing: border-box;
}

/* 右下角問號按鈕 */
.floating-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #3d5373;
  color: white;
  font-size: 1.8rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}



/* 收藏的CSS 當按鈕可以用時再加進去
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
 */

@keyframes spin {
  to { transform: rotate(360deg); }
}

</style>
