import { ref, computed } from 'vue'

const _collapsed = ref(false)

export function useLeftbar() {
  const collapsed = computed(() => _collapsed.value)
  const toggle = () => { _collapsed.value = !_collapsed.value }
  const open   = () => { _collapsed.value = false }
  const close  = () => { _collapsed.value = true }
  return { collapsed, toggle, open, close }
}
