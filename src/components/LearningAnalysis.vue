<!-- src/components/LearningAnalysis.vue -->
<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="dialog">
      <!-- 標題列 -->
      <div class="dialog-header">
        <h3>學習成效分析<span v-if="props.query">｜{{ props.query }}</span></h3>
        <button class="close-btn" @click="$emit('close')" aria-label="關閉">✖</button>
      </div>

      <!-- 提示 / 錯誤訊息 -->
      <p v-if="uiMessage" class="warn">{{ uiMessage }}</p>

      <!-- 1) 觀看進度（各階段） -->
      <section class="card">
        <h4>觀看進度（各階段）</h4>
        <Bar v-if="barData" :data="barData" :options="barOpts" />
        <p v-else class="muted">沒有可顯示的影片資料</p>
      </section>

      <!-- 2) 主題心智圖（中心：query；外圈：各階段標題） -->
      <section class="card">
        <div class="row">
          <h4>主題心智圖</h4>
        </div>

        <div v-if="mindPositions.length" class="mindmap-wrap" role="img" aria-label="主題心智圖">
          <svg :viewBox="`0 0 ${W} ${H}`" class="mindmap-svg">
            <defs>
              <linearGradient id="grad-center" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"  stop-color="#7C4DFF"/>
                <stop offset="100%" stop-color="#00D4FF"/>
              </linearGradient>
            </defs>

            <!-- 背景裝飾：同心圓 -->
            <circle :cx="cx" :cy="cy" :r="radius+18" class="ring ring-1"/>
            <circle :cx="cx" :cy="cy" :r="radius" class="ring ring-2"/>

            <!-- 連線 -->
            <line
              v-for="n in mindPositions" :key="'l'+n.id"
              :x1="cx" :y1="cy" :x2="n.x" :y2="n.y"
              class="link" :stroke="n.color"
            />

            <!-- 外圈節點（圓圈 + 圓圈下方多行完整標題） -->
            <g
              v-for="n in mindPositions" :key="'n'+n.id"
              class="node"
              :transform="`translate(${n.x},${n.y})`"
              @click="onMindNodeSelect(n)"
            >
              <!-- 圓圈（已縮小） -->
              <circle :r="nodeR" :fill="n.color"></circle>

              <!-- 多行完整標題：放在圓圈下方 -->
              <g :transform="`translate(0, ${nodeR + 14})`" class="node-label-wrap">
                <text class="node-label-multi" text-anchor="middle">
                  <tspan
                    v-for="(line, i) in n.lines"
                    :key="i"
                    x="0"
                    :dy="i === 0 ? 0 : lineHeight"
                  >
                    {{ line }}
                  </tspan>
                </text>
              </g>
            </g>

            <!-- 中心節點（已縮小） -->
            <g class="center" :transform="`translate(${cx},${cy})`">
              <circle :r="centerR" fill="url(#grad-center)"></circle>
              <text class="center-label">{{ props.query || '主題' }}</text>
            </g>
          </svg>
        </div>
        <p v-else class="muted">沒有可顯示的階段資料</p>
      </section>

      <!-- 3) 最高正確率 KPI -->
      <section class="card kpi">
        <div class="kpi-box">
          <div class="kpi-title">最高正確率</div>
          <div class="kpi-value">
            {{ maxAccuracyPercent }}<span class="unit">%</span>
          </div>
          <div class="kpi-target" :class="{ hit: maxAccuracyPercent === 100 }">
            目標：100%（{{ maxAccuracyPercent === 100 ? '已達標 🎉' : '尚未達標' }}）
          </div>
        </div>
      </section>

      <!-- 4) 錯題複習（分階段） -->
      <section class="card">
        <div class="row">
          <h4>錯題複習</h4>
          <select v-model="wrongPhase" class="select">
            <option value="">全部階段</option>
            <option v-for="p in phases" :key="'w-'+p.phase_number" :value="p.phase_number">
              {{ phaseLabel(p) }}
            </option>
          </select>
        </div>

        <div v-if="filteredWrong.length" class="wrong-blocks">
          <details
            v-for="block in filteredWrong"
            :key="'wb-'+block.phase_number"
            open
            class="wrong-group"
          >
            <summary class="phase-summary">
              <span class="badge">Phase {{ block.phase_number }}</span>
              <span class="summary-title">共 {{ block.items.length }} 題</span>
            </summary>

            <ul class="wrong-list">
              <li v-for="(q, i) in block.items" :key="i" class="wrong-item">
                <!-- 題目列 -->
                <div class="q-head">
                  <span class="q-badge">Q{{ q.question_number ?? (i + 1) }}</span>
                  <span class="q-title">{{ q.question }}</span>
                </div>

                <!-- 答案列（兩個膠囊） -->
                <div class="ans-row">
                  <div class="chip correct-chip">
                    <i class="chip-icon">✔</i>
                    <span class="chip-label">正確答案</span>
                    <span class="chip-value">{{ displayAns(q.answer) }}</span>
                  </div>

                  <div
                    class="chip your-chip"
                    :class="{
                      'is-correct': isSame(q.user_answer, q.answer),
                      'is-wrong': !isSame(q.user_answer, q.answer)
                    }"
                  >
                    <i class="chip-icon">◎</i>
                    <span class="chip-label">你的答案</span>
                    <span class="chip-value">{{ displayAns(q.user_answer) }}</span>
                  </div>
                </div>

                <!-- 小提醒（非必填，當答錯顯示） -->
                <div v-if="!isSame(q.user_answer, q.answer)" class="hint">
                  {{ q.explanation ? ('詳解：' + q.explanation) : '建議再練習一次這題喔！' }}
                </div>
              </li>
            </ul>
          </details>
        </div>
        <p v-else class="muted">目前沒有錯題可以複習</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  mapId: { type: [Number, String], required: true },
  phaseNumber: { type: [String, Number], default: '' },
  query: { type: String, default: '' }
})

const uiMessage = ref('')
const phases = ref([])
const wrongPhase = ref('')

/** 1) 觀看進度 長條圖 */
const barData = ref(null)
const barOpts = {
  responsive: true,
  plugins: { legend: { display: false }, title: { display: false } },
  scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } }
}

/** 3) 最高正確率 KPI */
const maxAccuracyPercent = computed(() => {
  const arr = phases.value
    .map(p => p.accuracy)
    .filter(a => a !== null && a !== undefined)
    .map(a => (a <= 1 ? Math.round(a * 100) : Math.round(a)))
  return arr.length ? Math.max(...arr) : 0
})

/** 錯題清單（依階段） */
const wrongBlocks = computed(() => {
  return phases.value.map(p => ({
    phase_number: p.phase_number,
    items: Array.isArray(p.wrong_questions) ? p.wrong_questions : []
  })).filter(b => b.items.length > 0)
})
const filteredWrong = computed(() => {
  if (!wrongPhase.value) return wrongBlocks.value
  const pn = Number(wrongPhase.value)
  return wrongBlocks.value.filter(b => Number(b.phase_number) === pn)
})

/** Phase 顯示輔助 */
const phaseName = (pn) => `Phase ${Number(pn)}`
const phaseLabel = (p) => `${phaseName(p.phase_number)}｜${p.phase_title || '未命名'}`
const displayAns = (a) => (a === null || a === undefined) ? '（未作答）' : String(a)
const isSame = (a, b) => String(a ?? '') === String(b ?? '')

/** 讀取 study_schedule */
const loadStudySchedule = async () => {
  uiMessage.value = ''
  let token = localStorage.getItem('access_token') || ''
  if (token && !/^Bearer\s+/i.test(token)) token = `Bearer ${token}`
  if (!token) { uiMessage.value = '找不到 access_token，請重新登入'; phases.value = []; barData.value = null; return }

  try {
    const res = await axios.get('http://localhost:8000/study_schedule', {
      headers: { Authorization: token }
    })
    const list = Array.isArray(res.data) ? res.data : []
    const targetMap = list.find(m => Number(m.map_id) === Number(props.mapId))
    if (!targetMap) { uiMessage.value = `找不到 map_id=${props.mapId} 的學習地圖`; phases.value = []; barData.value = null; return }

    phases.value = targetMap.phases || []
    if (!phases.value.length) uiMessage.value = '這張學習地圖目前沒有任何階段資料'

    // 長條圖資料
    const labels = phases.value.map(p => phaseName(p.phase_number))
    const percents = phases.value.map(p => {
      const vids = Array.isArray(p.videos) ? p.videos : []
      if (!vids.length) return 0
      const watched = vids.filter(v => v.watched).length
      return Math.round((watched / vids.length) * 100)
    })
    barData.value = labels.length
      ? {
          labels,
          datasets: [{
            label: '觀看完成度',
            data: percents,
            borderColor: '#42a5f5',
            backgroundColor: 'rgba(66,165,245,0.45)'
          }]
        }
      : null
  } catch (err) {
    console.error('[LA] study_schedule error:', err?.response?.status, err?.response?.data || err?.message)
    uiMessage.value = '讀取學習進度失敗（請檢查後端 /study_schedule 或權限）'
    phases.value = []; barData.value = null
  }
}

onMounted(async () => {
  await loadStudySchedule()
})

/* ================== 心智圖（純前端） ================== */
const W = 720
const H = 420
const cx = W / 2
const cy = H / 2
const radius = Math.min(W, H) * 0.33

/* ✅ 縮小圓圈 */
const centerR = 40   // 中心節點半徑（縮小）
const nodeR   = 24   // 分支節點半徑（縮小）

/* 多行文字的行高（對應 CSS font-size） */
const lineHeight = 14

/* 繽紛配色 */
const palette = [
  '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2',
  '#B28DFF', '#F4A261', '#2EC4B6', '#EF476F'
]

/** 將長字串按每行字數切成多行 */
function chunkLabel(label, perLine = 12) {
  const s = String(label ?? '')
  const lines = []
  for (let i = 0; i < s.length; i += perLine) {
    lines.push(s.slice(i, i + perLine))
  }
  return lines
}

/** 計算節點位置與多行標籤 */
const mindPositions = computed(() => {
  const nodes = (phases.value || []).map(p => ({
    id: String(p.phase_number),
    label: p.phase_title || `Phase ${p.phase_number}`
  }))
  const n = nodes.length || 1
  return nodes.map((node, i) => {
    const angle = (-90 + (360 / n) * i) * Math.PI / 180
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    const color = palette[i % palette.length]
    const lines = chunkLabel(node.label, 12) // ✅ 完整顯示：多行（每行 12 字）
    return { ...node, x, y, color, lines }
  })
})

/** 點擊節點：切換錯題篩選到該 Phase */
const onMindNodeSelect = (node) => {
  wrongPhase.value = node.id
}
</script>

<style scoped>
/* === 遮罩鋪滿視窗；彈窗維持向下 70px 的視覺（不改你彈窗定位） === */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 20px;
}
.overlay::before {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  pointer-events: none; /* 不阻擋 @click.self */
}

/* 對話框 */
.dialog {
  position: relative;
  z-index: 1;
  margin-top: 70px;        /* 保持向下距離 */
  background: #fff;
  width: 840px;
  max-width: 92%;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: 0 10px 30px rgba(0,0,0,.2);
}

/* 標題列 + 關閉按鈕 */
.dialog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px; }
.close-btn {
  background: #ff6b6b;
  border: none;
  color: white;
  font-size: 20px;
  border-radius: 50%;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background .2s;
  line-height: 1;
}
.close-btn:hover { background: #ff3b3b; }

/* 提示訊息 */
.warn {
  color: #b0432d; background: #fdecea; border: 1px solid #f5c2c0;
  padding: 8px 10px; border-radius: 6px; margin-bottom: 10px;
}

/* 卡片與排版 */
.card {
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  border: 1px solid #d6dbe4;
  border-radius: 12px;
  padding: 12px 14px;
  margin: 10px 0;
  box-shadow: 0 3px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1); }
.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.select { padding: 6px 8px; border-radius: 8px; border: 2px solid #7aa6ff; background: #fff; transition: border-color 0.2s; }
.select:focus { outline: none; border-color: #ff8cc8; }

/* KPI */
.kpi { display: flex; }
.kpi-box { width: 100%; text-align: center; padding: 14px 8px; }
.kpi-title { color: #445; margin-bottom: 6px; }
.kpi-value { font-size: 42px; font-weight: 900; color: #ff8c42; line-height: 1; }
.kpi-value .unit { font-size: 18px; margin-left: 4px; font-weight: 600; color: #557; }
.kpi-target { margin-top: 6px; font-size: 14px; color: #777; }
.kpi-target.hit { color: #28a745; font-weight: 800; }

/* ====== 錯題區塊 ====== */
.wrong-blocks { display: grid; gap: 12px; }
.wrong-group { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 10px; }
.phase-summary {
  cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 10px;
  background: linear-gradient(to right, #84fab0, #8fd3f4);
  padding: 6px 10px; border-radius: 8px; color: #234;
}
.badge {
  background: #eef2ff; color: #3730a3; border: 1px solid #e0e7ff;
  padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 800;
}
.summary-title { color: #1f2937; font-weight: 800; }

.wrong-list { list-style: none; padding: 8px 6px 10px 6px; margin: 0; display: grid; gap: 12px; }
.wrong-item { background: #ffffff; border: 1px solid #e6e8f0; border-radius: 12px; padding: 10px 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }

/* 題目列 */
.q-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
.q-badge { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 800; flex: 0 0 auto; }
.q-title { font-weight: 700; color: #111827; line-height: 1.5; }

/* 答案膠囊列 */
.ans-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font-weight: 700; font-size: 13px; border: 1px solid transparent; }
.chip-icon { font-style: normal; font-weight: 900; opacity: .9; }
.correct-chip { background: #ecfdf5; color: #065f46; border-color: #bbf7d0; }
.your-chip { background: #fff7ed; color: #7c2d12; border-color: #fed7aa; }
.your-chip.is-wrong { background: #fde2e2; color: #7f1d1d; border-color: #fecaca; }
.your-chip.is-correct { background: #dcfce7; color: #14532d; border-color: #86efac; }
.chip-label { opacity: .85; }
.chip-value { background: rgba(255,255,255,.6); padding: 2px 6px; border-radius: 8px; border: 1px dashed rgba(0,0,0,.08); }

.hint { margin-top: 8px; font-size: 12px; color: #334155; background: #f1f5f9; border: 1px dashed #cbd5e1; padding: 6px 8px; border-radius: 8px; }

/* ====== MindMap ====== */
.mindmap-wrap { width: 100%; overflow: hidden; }
.mindmap-svg { width: 100%; height: 420px; display: block; }

/* 裝飾同心圓 */
.ring { fill: none; stroke: rgba(99, 102, 241, .15); }
.ring-1 { stroke-width: 1.5; }
.ring-2 { stroke-width: 1; stroke-dasharray: 6 6; }

/* 連線（使用節點顏色） */
.link { stroke-width: 2; opacity: 0.7; }

/* 外圈節點 */
.node circle {
  stroke: rgba(255,255,255,.72);
  stroke-width: 1.4;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,.15));
  transition: transform .15s ease, filter .2s ease;
  cursor: pointer;
}
.node:hover circle {
  transform: scale(1.06);
  filter: drop-shadow(0 6px 16px rgba(0,0,0,.25));
}

/* 多行標籤（放在圓圈下方） */
.node-label-wrap { pointer-events: none; } /* 避免文字阻擋點擊事件 */
.node-label-multi {
  font-size: 12px;
  font-weight: 800;
  fill: #334155;        /* 深灰藍：可讀性佳 */
  dominant-baseline: hanging;
}

/* 中心節點 */
.center circle {
  stroke: rgba(255,255,255,.75);
  stroke-width: 1.8;
  filter: drop-shadow(0 6px 20px rgba(124,77,255,.35));
}
.center-label {
  font-size: 14px;
  font-weight: 900;
  fill: #fff;
  text-anchor: middle;
  dominant-baseline: middle;
}

.muted { color: #999; }
</style>