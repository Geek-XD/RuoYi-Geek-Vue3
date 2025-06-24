<template>
  <div>
    <el-input v-model="url" type="text" style="width: 20%" />
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

<script setup lang="ts">
import { ref } from "vue";
import socketclient from "@/plugins/socketclient";
const message = ref("");
const text_content = ref("");
const url = ref("ws://127.0.0.1:8080/websocket/message");
function join() {
  socketclient.connect({ url: url.value }).then((client) => {
    text_content.value += "连接成功!" + "\n";
  }).catch((error) => {
    text_content.value += "连接失败: " + error.message + "\n";
  });
  socketclient.onClose(() => {
    text_content.value += "已经关闭连接!" + "\n";
  })
  socketclient.onMessage((event) => {
    text_content.value = event.data + "\n";
  })
}
function exit() {
  socketclient.close().then(() => {
    text_content.value += "已断开连接!" + "\n";
  }).catch((error) => {
    text_content.value += "断开连接失败: " + error.message + "\n";
  });
}
function send() {
  socketclient.send(message.value);
}
</script>
