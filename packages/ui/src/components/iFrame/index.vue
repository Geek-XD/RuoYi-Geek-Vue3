<template>
  <div v-loading="loading" class="iframe-container">
    <iframe :src="url" frameborder="no" class="iframe-content" scrolling="auto" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  src?: string
}>(), {
  src: ''
})

const loading = ref(true)
const url = computed(() => props.src)

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 300);
})
</script>

<style lang="scss" scoped>
.iframe-container {
  position: relative;
  height: 100%;
  width: 100%;
  flex: 1;
}

.iframe-content {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
