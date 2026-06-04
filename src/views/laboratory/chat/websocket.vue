<script setup lang="ts">
import profile from '@/assets/images/profile.jpg';
import { ref } from 'vue';
import socketclient from '@ruoyi/core/plugins/socketclient';
import { parseTime } from '@ruoyi/core/utils/ruoyi';
import { createAsyncMessage, createEventMessage } from '@ruoyi/core/types/Message';
import {
  ChatLayout,
  ContactList,
  ContactItem,
  ChatApp,
  appendChatMessageChunk,
  completeChatMessage,
  createChatMessage,
  type ChatMessage,
} from '@ruoyi/ui/layout/Chat';
import { ChatDotSquare, ChatRound } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const _contacts = [
  { id: 1, name: '梅洛迪·梅西', email: 'melody@altbox.com', avatar: profile, online: true, lastMsg: '20小时前' },
  { id: 2, name: '马克·史密斯', email: 'max@kt.com', avatar: profile, online: true, lastMsg: '2小时前' },
  { id: 3, name: '肖恩·宾', email: 'sean@dellito.com', avatar: profile, online: false, lastMsg: '5小时前' },
  { id: 4, name: 'Ricky', email: 'ricky@domain.com', avatar: profile, online: true, lastMsg: '刚刚' }
];

const contacts = _contacts.concat(...Array(10).fill(_contacts)).map((c, id) => ({ ...c, name: c.name + id, id: c.id + id * 100 }));
const currentContact = ref(_contacts[0]);
const url = ref('ws://127.0.0.1:8080/websocket/message');
const wsDialogVisible = ref(false);
const activeStreamMessage = ref<ChatMessage | null>(null);
const eventTestDialogVisible = ref(false);
const testEventName = ref('test-event');
const testEventData = ref('{"message": "Hello from event test"}');
const subscribedEvents = ref<string[]>([]);

const chatMessages = ref<ChatMessage[]>([
  createChatMessage({ role: 'assistant', from: 'Art Bot', avatar: profile, content: '不客气，有任何问题随时联系我。', time: '10:11' }),
  createChatMessage({ role: 'user', from: 'Ricky', avatar: profile, content: '明白了，谢谢你的帮助!', time: '10:10' })
]);

function ensureAssistantStreamMessage() {
  if (activeStreamMessage.value) {
    return activeStreamMessage.value;
  }

  const message = createChatMessage({
    role: 'assistant',
    from: 'Art Bot',
    avatar: currentContact.value.avatar,
    content: '',
    time: parseTime(new Date(), '{h}:{m}'),
    status: 'streaming',
    streaming: true,
  });
  chatMessages.value.push(message);
  activeStreamMessage.value = chatMessages.value[chatMessages.value.length - 1];
  return activeStreamMessage.value;
}

function finishAssistantStreamMessage() {
  if (!activeStreamMessage.value) {
    return;
  }
  completeChatMessage(activeStreamMessage.value);
  activeStreamMessage.value = null;
}

function handleIncomingMessage(msg: any) {
  const content = String(msg?.content ?? '');
  if (!content && !msg?.done) {
    return;
  }

  const isStreaming = Boolean(msg?.streaming || msg?.stream || msg?.done === false || msg?.chunk);
  if (isStreaming) {
    appendChatMessageChunk(ensureAssistantStreamMessage(), content);
    if (msg?.done || msg?.finishReason) {
      finishAssistantStreamMessage();
    }
    return;
  }

  finishAssistantStreamMessage();
  chatMessages.value.push(createChatMessage({
    role: 'assistant',
    from: 'Art Bot',
    avatar: currentContact.value.avatar,
    content,
    time: parseTime(new Date(), '{h}:{m}')
  }));
}

function join() {
  socketclient.connect({ url: url.value }).then(() => {
    ElMessage.success('WebSocket 连接成功');
    socketclient.asyncSend(createAsyncMessage('admin', {
      content: '你好，我是Ricky，很高兴见到你！'
    })).then((response: any) => {
      chatMessages.value.push(createChatMessage({
        role: 'assistant',
        from: 'System',
        avatar: currentContact.value.avatar,
        content: `[回显] ${response.content}`,
        time: parseTime(new Date(), '{h}:{i}')
      }));
      ElMessage.success('收到服务器回显');
    });
  });

  socketclient.onMessage(handleIncomingMessage);
}

function close() {
  // 清理所有订阅
  subscribedEvents.value.forEach(event => {
    socketclient.off(event);
  });
  subscribedEvents.value = [];
  
  socketclient.close();
  finishAssistantStreamMessage();
}

function handleSend(content: string) {
  const msg = createAsyncMessage('admin', { content });
  
  // 显示发送的消息
  chatMessages.value.push(createChatMessage({
    role: 'user',
    from: 'Ricky',
    avatar: profile,
    content: content,
    time: parseTime(new Date(), '{h}:{i}')
  }));
  
  // 发送并等待回显
  socketclient.asyncSend(msg).then((response: any) => {
    chatMessages.value.push(createChatMessage({
      role: 'assistant',
      from: 'System',
      avatar: currentContact.value.avatar,
      content: `[回显] ${response.content}`,
      time: parseTime(new Date(), '{h}:{i}')
    }));
  });
}

// 事件订阅
function subscribeEvent() {
  if (subscribedEvents.value.includes(testEventName.value)) {
    ElMessage.warning('已订阅该事件');
    return;
  }

  socketclient.on(testEventName.value, (data) => {
    chatMessages.value.push(createChatMessage({
      role: 'assistant',
      from: '事件系统',
      avatar: currentContact.value.avatar,
      content: `[事件: ${testEventName.value}] ${JSON.stringify(data.payload || data)}`,
      time: parseTime(new Date(), '{h}:{i}')
    }));
    ElMessage.success(`收到事件: ${testEventName.value}`);
  });

  subscribedEvents.value.push(testEventName.value);
  ElMessage.success(`订阅成功: ${testEventName.value}`);
}

function unsubscribeEvent() {
  if (!subscribedEvents.value.includes(testEventName.value)) {
    ElMessage.warning('未订阅该事件');
    return;
  }

  socketclient.off(testEventName.value);
  subscribedEvents.value = subscribedEvents.value.filter(e => e !== testEventName.value);
  ElMessage.info(`取消订阅: ${testEventName.value}`);
}

function sendTestEvent() {
  try {
    const data = JSON.parse(testEventData.value);
    socketclient.send(createEventMessage(testEventName.value, { payload: data }));
    chatMessages.value.push(createChatMessage({
      role: 'user',
      from: 'Ricky',
      avatar: profile,
      content: `[广播事件: ${testEventName.value}] ${testEventData.value}`,
      time: parseTime(new Date(), '{h}:{i}')
    }));
    ElMessage.success('事件已广播');
  } catch (error) {
    ElMessage.error('JSON 格式错误: ' + error);
  }
}
</script>

<template>
  <div class="app-container">
    <chat-layout>
      <template #window-header>
        <div style="display: flex; justify-content: space-between;">
          <div class="profile-section">
            <el-avatar :src="profile" size="small" />
            <div class="profile-info">
              <div class="profile-name">伊桑·李特</div>
              <div class="profile-email">ethan@domain.com</div>
            </div>
          </div>
        </div>
      </template>
      <template #window-sidebar>
        <div><el-button :icon="ChatDotSquare" @click="wsDialogVisible = true" title="WebSocket设置" /></div>
        <div><el-button :icon="ChatRound" @click="eventTestDialogVisible = true" title="事件测试" /></div>
      </template>
      <template #app-sidebar>
        <div class="search-section">
          <el-input placeholder="搜索联系人..."></el-input>
        </div>
        <ContactList :list="contacts" v-model="currentContact">
          <template #default="{ item }">
            <ContactItem :contact="item" />
          </template>
        </ContactList>
      </template>
      <ChatApp :currentContact="currentContact" :chatMessages="chatMessages" selfName="Ricky" :selfAvatar="profile"
        @send="handleSend" />
    </chat-layout>
    <el-dialog v-model="wsDialogVisible" title="设置ws" width="800">
      <el-input v-model="url" class="mr20" placeholder="请输入内容..." />
      <template #footer>
        <el-button type="warning" @click="join">连接</el-button>
        <el-button type="danger" @click="close">断开连接</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="eventTestDialogVisible" title="事件测试" width="600">
      <el-form label-width="100px">
        <el-form-item label="事件名称">
          <el-input v-model="testEventName" placeholder="输入事件名称，如: test-event" />
        </el-form-item>
        <el-form-item label="已订阅">
          <el-tag v-for="event in subscribedEvents" :key="event" closable
            @close="testEventName = event; unsubscribeEvent()" style="margin-right: 8px">
            {{ event }}
          </el-tag>
          <span v-if="subscribedEvents.length === 0" style="color: #999">暂无订阅</span>
        </el-form-item>
        <el-form-item label="订阅操作">
          <el-space>
            <el-button type="success" @click="subscribeEvent" :disabled="subscribedEvents.includes(testEventName)">
              订阅事件
            </el-button>
            <el-button type="warning" @click="unsubscribeEvent" :disabled="!subscribedEvents.includes(testEventName)">
              取消订阅
            </el-button>
          </el-space>
        </el-form-item>
        <el-divider />
        <el-form-item label="广播数据">
          <el-input v-model="testEventData" type="textarea" :rows="4"
            placeholder='输入 JSON 数据，如: {"message": "Hello"}' />
        </el-form-item>
        <el-form-item label="广播操作">
          <el-button type="primary" @click="sendTestEvent">广播事件</el-button>
        </el-form-item>
        <el-alert title="说明" type="info" :closable="false" description="1. 订阅事件：监听特定事件名称的消息
2. 广播事件：向所有订阅者发送消息
3. 收到的事件会显示在聊天窗口中" />
      </el-form>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-section {
  display: flex;
  align-items: center;
  padding: 10px 16px 10px 16px;

  .profile-info {
    display: flex;
    align-items: end;
    gap: 10px;
    margin-left: 12px;
    color: white;

    .profile-name {
      font-weight: bold;
      font-size: 16px;
    }

    .profile-email {
      font-size: 12px;
    }
  }
}

.search-section {
  height: 53px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 16px;
}
</style>
