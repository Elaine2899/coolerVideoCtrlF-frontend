<script setup>
import { ref, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  }
})

const floatingPanel = ref(null)

let isResizing = false
let currentDirection = ''
let startX = 0
let startY = 0
let startWidth = 0
let startHeight = 0
let startLeft = 0
let startTop = 0

function startResize(direction, e) {
  isResizing = true
  currentDirection = direction
  startX = e.clientX
  startY = e.clientY

  const rect = floatingPanel.value.getBoundingClientRect()
  startWidth = rect.width
  startHeight = rect.height
  startLeft = rect.left
  startTop = rect.top

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(e) {
  if (!isResizing || !floatingPanel.value) return

  const dx = e.clientX - startX
  const dy = e.clientY - startY
  const el = floatingPanel.value

  const minWidth = 200
  const minHeight = 200

  if (currentDirection === 'left') {
    const newWidth = startWidth - dx
    const newLeft = startLeft + dx
    if (newWidth > minWidth) {
      el.style.width = `${newWidth}px`
      el.style.left = `${newLeft}px`
    }
  }

  if (currentDirection === 'top') {
    const newHeight = startHeight - dy
    const newTop = startTop + dy
    if (newHeight > minHeight) {
      el.style.height = `${newHeight}px`
      el.style.top = `${newTop}px`
    }
  }

  if (currentDirection === 'topleft') {
    const newWidth = startWidth - dx
    const newLeft = startLeft + dx
    const newHeight = startHeight - dy
    const newTop = startTop + dy
    if (newWidth > minWidth) {
      el.style.width = `${newWidth}px`
      el.style.left = `${newLeft}px`
    }
    if (newHeight > minHeight) {
      el.style.height = `${newHeight}px`
      el.style.top = `${newTop}px`
    }
  }
}

function stopResize() {
  isResizing = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  stopResize()
})
</script>

<template>
  <div class="floating-panel" v-if="visible" ref="floatingPanel">
    <button class="close-btn" @click="$emit('close')">✕</button>
    <slot /> <!-- 🔁 用 slot 插入外部內容 -->

    <!-- Resize handles -->
    <div class="resize-handle left" @mousedown.stop="(e) => startResize('left', e)"></div>
    <div class="resize-handle top" @mousedown.stop="(e) => startResize('top', e)"></div>
    <div class="resize-handle topleft" @mousedown.stop="(e) => startResize('topleft', e)"></div>
  </div>
</template>

<style scoped>
.floating-panel {
  position: fixed;
  bottom: 30px;
  right: 100px;
  width: 35rem;
  height: 45rem;
  background: #ffffff;
  border: 1px solid #ccc;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 999;
  overflow: auto;
  resize: none;
}

.resize-handle {
  position: absolute;
  background: transparent;
  z-index: 1000;
}

.resize-handle.left {
  width: 6px;
  left: -3px;
  top: 0;
  bottom: 0;
  cursor: ew-resize;
}

.resize-handle.top {
  height: 6px;
  top: -3px;
  left: 0;
  right: 0;
  cursor: ns-resize;
}

.resize-handle.topleft {
  width: 10px;
  height: 10px;
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

.close-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  background: transparent;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #e00;
}
</style>