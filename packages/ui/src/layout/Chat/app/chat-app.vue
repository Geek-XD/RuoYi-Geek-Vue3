<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import ChatInput from '../components/chat-input.vue';
import ChatMessageRow from '../components/chat-message-row.vue';
import {
  createChatMessage,
  formatChatMessageTime,
  normalizeChatMessage,
} from '../utils';
import type {
  ChatContact,
  ChatMessageLike,
  ChatMessageParser,
} from '../types';

const inputValue = defineModel<string>('inputValue', { default: '' });
const chatContainer = ref<HTMLElement>();

const props = withDefaults(defineProps<{
  currentContact?: ChatContact;
  chatMessages?: Array<ChatMessageLike>;
  selfName?: string;
  selfAvatar?: string;
  fallbackAvatar?: string;
  loading?: boolean;
  showHeader?: boolean;
  showInput?: boolean;
  appendOnSend?: boolean;
  inputPlaceholder?: string;
  inputRows?: number;
  inputAutosize?: boolean | { minRows?: number; maxRows?: number };
  inputDisabled?: boolean;
  inputShowStopButton?: boolean;
  messageParser?: ChatMessageParser;
}>(), {
  currentContact: () => ({ name: '会话' }),
  chatMessages: () => [],
  selfName: '我',
  fallbackAvatar: '',
  loading: false,
  showHeader: true,
  showInput: true,
  appendOnSend: true,
  inputPlaceholder: '请输入内容...',
  inputRows: 5,
  inputAutosize: () => ({ minRows: 3, maxRows: 6 }),
  inputDisabled: false,
  inputShowStopButton: false,
});

const emit = defineEmits<{
  send: [message: string];
  stop: [];
}>();

const normalizedMessages = computed(() => props.chatMessages.map((message, index) => normalizeChatMessage(message, {
  selfName: props.selfName,
  selfAvatar: props.selfAvatar,
  fallbackAvatar: props.fallbackAvatar,
  contact: props.currentContact,
  fallbackId: message.id ?? `legacy-${index}`,
  messageParser: props.messageParser,
})));

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

function handleSend(message: string) {
  const content = message.trim();
  if (!content) {
    return;
  }

  if (props.appendOnSend) {
    props.chatMessages.push(createChatMessage({
      role: 'user',
      direction: 'outgoing',
      from: props.selfName,
      name: props.selfName,
      avatar: props.selfAvatar,
      content,
      time: formatChatMessageTime(),
    }));
  }

  emit('send', content);
}

watch(normalizedMessages, scrollToBottom, { deep: true, flush: 'post' });

defineExpose({
  scrollToBottom,
});
</script>

<template>
  <div class="chat-main">
    <div v-if="showHeader" class="chat-header">
      <slot name="header" :contact="currentContact">
        <div class="chat-title">
          <el-avatar :src="currentContact.avatar" size="small">
            {{ currentContact.name?.slice(0, 1) || '?' }}
          </el-avatar>
          <span class="chat-name">{{ currentContact.name }}</span>
          <span v-if="currentContact.online" class="chat-status">在线</span>
        </div>
      </slot>
    </div>

    <div ref="chatContainer" class="chat-content">
      <slot v-if="normalizedMessages.length === 0" name="empty" :contact="currentContact">
        <div class="chat-empty">开始对话吧</div>
      </slot>

      <ChatMessageRow
        v-for="message in normalizedMessages"
        :key="message.id"
        :message="message"
      >
        <template v-if="$slots['message-avatar']" #message-avatar="slotProps">
          <slot name="message-avatar" v-bind="slotProps" />
        </template>

        <template v-if="$slots['message-header']" #message-header="slotProps">
          <slot name="message-header" v-bind="slotProps" />
        </template>

        <template v-if="$slots['message-content']" #message-content="slotProps">
          <slot name="message-content" v-bind="slotProps" />
        </template>

        <template v-if="$slots['message-block']" #message-block="slotProps">
          <slot name="message-block" v-bind="slotProps" />
        </template>
      </ChatMessageRow>
    </div>

    <slot name="footer" :send="handleSend" :loading="loading" :inputValue="inputValue">
      <ChatInput
        v-if="showInput"
        v-model="inputValue"
        :loading="loading"
        :disabled="inputDisabled"
        :placeholder="inputPlaceholder"
        :rows="inputRows"
        :autosize="inputAutosize"
        :show-stop-button="inputShowStopButton"
        @send="handleSend"
        @stop="emit('stop')"
      >
        <template v-if="$slots['input-actions']" #actions="slotProps">
          <slot name="input-actions" v-bind="slotProps" />
        </template>
      </ChatInput>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    background: #fff;
    border-bottom: 1px solid #e6e6e6;
    height: 53px;
    flex-shrink: 0;

    .chat-title {
      display: flex;
      align-items: center;

      .chat-name {
        font-weight: 600;
        margin-left: 10px;
      }

      .chat-status {
        color: #67c23a;
        font-size: 12px;
        margin-left: 8px;
      }
    }
  }

  .chat-content {
    overflow-y: auto;
    padding: 30px 20px 20px 20px;
    flex: 1;
    min-height: 0;
  }

  .chat-empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    font-size: 14px;
  }
}
</style>
