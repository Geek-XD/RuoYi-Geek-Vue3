<script setup lang="ts">
import { ref } from "vue";
defineProps({
  src: {
    type: String,
    default: "/"
  },
  iframeId: {
    type: String
  }
});

const height = ref(document.documentElement.clientHeight - 94.5 + "px");
</script>
<template>
  <div :style="'height:' + height">
    <iframe :id="iframeId" style="width: 100%; height: 100%" :src="src" frameborder="no"></iframe>
  </div>
</template>
