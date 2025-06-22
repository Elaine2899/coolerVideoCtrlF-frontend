<script setup>
import { ref, watch } from 'vue'
import LeftBar from '@/components/LeftBar.vue'

// 儲存目前被選到的 phase
const selectedPhase = ref(null)

const handlePhaseSelect = (phase) => {
  selectedPhase.value = phase
}

const currentIndex = ref(0)
// 每次跳 phase 都會回到第一部
watch(() => selectedPhase.value, () => {
  currentIndex.value = 0
})

const prevSlide = () => {
  if (!selectedPhase.value?.items?.length) return
  const total = selectedPhase.value.items.length
  currentIndex.value = (currentIndex.value - 1 + total) % total
}

const nextSlide = () => {
  if (!selectedPhase.value?.items?.length) return
  const total = selectedPhase.value.items.length
  currentIndex.value = (currentIndex.value + 1) % total
}

</script>

<template>
  <div class="mapPage">
    <!-- 側邊欄 -->
    <LeftBar @selectPhase="handlePhaseSelect" />

    <div class="layout">
      <!-- 主內容 -->
      <main class="content" v-if="selectedPhase">
        <div class="courseLabel">{{ selectedPhase.query }}</div>

        <h1>{{ selectedPhase.title }}</h1>

        <!-- 影片列表 -->
        <div class="carousel" v-if="selectedPhase.items?.length">
          <button class="arrow-btn" @click="prevSlide">◀</button>

          <div class="videoSlider">
            <div class="videoContainer">
              <div
                v-for="(item, idx) in selectedPhase.items"
                :key="idx"
                class="videoBox"
                v-show="Math.abs(idx - currentIndex) <= 2"
                :class="{ active: idx === currentIndex, prev: idx === currentIndex - 1, next: idx === currentIndex + 1 }"
              >
                <div
                  v-if="idx !== currentIndex"
                  class="overlay"
                  @click="currentIndex = idx"
                ></div>  <!-- 新增遮罩，iframe會吃掉父層的click效果 -->

                <iframe
                  v-if="item.video?.length"
                  :src="item.video[4]"
                  frameborder="0"
                  allowfullscreen
                ></iframe>   <!-- 接收的陣列中第五個才是網址 -->
              </div>
            </div>
          </div>

          <button class="arrow-btn" @click="nextSlide">▶</button>
        </div>

        <!-- 點點導覽器 -->
        <div class="dots" v-if="selectedPhase.items?.length">
          <span
            v-for="(item, i) in selectedPhase.items"
            :key="i"
            class="dot"
            :class="{ active: i === currentIndex }"
            @click="currentIndex = i"
          ></span>
        </div>

        <!-- 摘要 -->
        <div class="summary" v-if="selectedPhase.items && selectedPhase.items.length">
          <div v-for="(item, idx) in selectedPhase.items" :key="idx">
            <p><strong>{{ item.title }}</strong></p>
            <p v-for="(step, i) in item.steps" :key="i">• {{ step }}</p>
          </div>
        </div>
      </main>

      <main class="content" v-else></main>
    </div>
  </div>
</template>

<style scoped>
.mapPage {
  min-height: 100vh;
  background-color: #85b1c5;
  font-family: 'Noto Sans TC', sans-serif;
  display: flex;
  flex-direction: column;
}

.layout {
  display: flex;
  flex: 1;
  margin-left: 250px; /* 避開固定的側邊欄寬度 */
}

main.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.courseLabel {
  display: inline-block;
  background: #5a2c2c;
  color: white;
  padding: 0.4rem 1rem;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  border-radius: 4px;
}

.carousel {
  display: flex;
  align-items: center;
  background: #4e3a3a;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
}

.arrow-btn {
  background: transparent;
  font-size: 1.5rem;
  border: none;
  color: white;
  cursor: pointer;
  z-index: 3;
}

.dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 0.2s;
}

.dot.active {
  background: rgba(255, 255, 255, 0.9);
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  cursor: pointer;
}

.videoSlider {
  flex: 1;
  overflow: hidden;
}

.videoContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.4s ease-in-out;
  width: 100%;
  gap: 1rem;
}

.videoBox {
  width: 180px;
  height: 120px;
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  opacity: 0.3;
  transform: scale(0.85);
  transition: all 0.4s ease;
}

.videoBox.active {
  width: 240px;
  height: 135px;
  opacity: 1;
  transform: scale(1);
  z-index: 2;
}

.videoBox.prev,
.videoBox.next {
  opacity: 0.6;
  transform: scale(0.9);
  z-index: 1;
}


.videoBox iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.summary {
  background: white;
  padding: 1rem;
  border-radius: 4px;
}
</style>
