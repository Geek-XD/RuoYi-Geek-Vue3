<template>
  <div>
    <el-input v-model="url" type="text" style="width: 20%" /> &nbsp; &nbsp;
    <el-button @click="join" type="primary">连接</el-button>
    <el-button @click="exit" type="danger">断开</el-button>
    <br />
    <el-input type="textarea" v-model="message" :rows="9" />
    <el-button type="info" @click="send">发送消息</el-button>
    <br />
    <br />
    <el-input type="textarea" v-model="text_content" :rows="9" /> 返回内容
    <br />
    <br />
  </div>
</template>

<script setup>
import { ref } from "vue";
const url = ref("ws://127.0.0.1:8080/websocket/message");
const message = ref("");
const text_content = ref("");
const ws = ref(null);
function join() {
  const wsuri = url.value;
  ws.value = new WebSocket(wsuri);
  ws.value.onopen = function () {
    text_content.value += "已经打开连接!" + "\n";
  };
  ws.value.onmessage = function (event) {
    text_content.value = event.data + "\n";
  };
  ws.value.onclose = function () {
    text_content.value += "已经关闭连接!" + "\n";
  };
}
function exit() {
  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }
}
function send() {
  if (ws.value) {
    ws.value.send(message.value);
  } else {
    alert("未连接到服务器");
  }
}
</script>
