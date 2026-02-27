<template>
  <div>
    <div v-html="output"></div>
    <el-input v-model="input" placeholder="" />
    <el-button @click="send">Send</el-button>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const input = ref('')
const output = ref('')
function send() {
  if (input.value.trim() === '') return
  const eventSource = new EventSource(`/dev-api/saallm/streamv2?sessionId=1&msg=${input.value}`);
  eventSource.onmessage = function (event) {
    output.value += event.data;
  };
  eventSource.onerror = function (error) {
    console.error("EventSource failed:", error);
    eventSource.close();
  }
}
</script>