<script setup lang="ts">
import { onMounted, nextTick } from 'vue';
import useSettingsStore from '@/store/modules/settings'
import { handleThemeStyle } from '@/utils/theme'
const settingsStore = useSettingsStore()
onMounted(() => {
  nextTick(() => {
    settingsStore.initSetting().then(() => {
      // 初始化主题样式
      handleThemeStyle(settingsStore.theme)
    })
  })
})
</script>
<template>
  <div v-loading="!settingsStore.inited" class="app-container">
    <router-view />
  </div>
</template>
<style scoped>
.app-container {
  height: 100%;
  width: 100%;
}
</style>