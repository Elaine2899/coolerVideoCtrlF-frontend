<script setup>
import { defineProps, defineEmits } from 'vue'

const { modelValue, placeholder } = defineProps({
  modelValue: String,
  placeholder: {
    type: String,
    default: '請輸入關鍵字...'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

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
      :placeholder="placeholder"
      :disabled="disabled"
    />

    <span class="icon" @click="!disabled && onIconClick()" :class="{ disabled }">🔍</span>
  </div>
</template>

<style scoped>
.searchWrapper {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 40%;
  max-width: 700px;
  min-width: 170px;
  margin: 1rem auto; /* 使搜尋框不會貼滿左右邊 */
}

.searchBox {
  width: 100%;
  /* background-color: #85b1c5; */
  background-color: rgba(34, 34, 59, 0.2);
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
  color: rgb(77, 76, 76);
}

.icon {
  position: absolute;
  right: 1rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.icon:hover {
  transform: scale(1.3);
}

.icon.disabled {
  opacity: 0.4;
  cursor: wait;
  transform: none !important;
}

</style>

