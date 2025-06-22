<script setup>
import { defineProps, defineEmits } from 'vue'

const { modelValue } = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue', 'enter'])
const onInput = (e) => emit('update:modelValue', e.target.value)
const onKeyDown = (e) => {
  if (e.key === 'Enter') emit('enter')
}
const onIconClick = () => {
  emit('enter')
}
</script>

<template>
  <div class="searchWrapper">
    <input
      class="searchBox"
      type="text"
      :value="modelValue"
      @input="onInput"
      @keydown="onKeyDown"
      placeholder="請輸入搜尋關鍵字..."
    />
    <span class="icon" @click="onIconClick">🔍</span>
  </div>
</template>

<style scoped>
.searchWrapper {
  position: relative;
  width: 40%;
  max-width: 700px;
  margin: 1rem auto; /* 使搜尋框不會貼滿左右邊 */
}

.searchBox {
  width: 100%;
  background-color: #85b1c5;
  color: black;
  padding: 0.8rem 3rem 0.8rem 1.5rem;
  border-radius: 999px;
  border: 2px solid black;
  font-size: 1rem;
  outline: none;
  text-align: left;
  font-family: 'Noto Sans TC', sans-serif;
}

.searchBox::placeholder {
  color: black;
}

.icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
  cursor: pointer;
}
</style>

