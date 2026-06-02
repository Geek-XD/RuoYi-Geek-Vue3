<script lang="ts" setup>
import { computed } from 'vue';
import { getChatAvatarFallbackText } from '../utils';
import type { ChatMessageBlock, NormalizedChatMessage } from '../types';
import ChatMessageBlockRenderer from './chat-message-block.vue';

const props = defineProps<{
  message: NormalizedChatMessage;
}>();

const hasHeader = computed(() => Boolean(props.message.name || props.message.time));
const rowClasses = computed(() => [
  'chat-bubble-row',
  `is-${props.message.direction}`,
  {
    streaming: props.message.status === 'streaming',
    error: props.message.status === 'error',
  },
]);

function blockKey(block: ChatMessageBlock, index: number) {
  return block.key ?? `${props.message.id}-${index}`;
}
</script>

<template>
  <div :class="rowClasses">
    <template v-if="message.direction === 'center'">
      <slot name="message-content" :message="message" :blocks="message.blocks">
        <div class="system-bubble">
          <template v-for="(block, index) in message.blocks" :key="blockKey(block, index)">
            <slot name="message-block" :message="message" :block="block" :index="index">
              <ChatMessageBlockRenderer :block="block" />
            </slot>
          </template>
          <span v-if="message.status === 'streaming'" class="typing-cursor">▌</span>
        </div>
      </slot>
    </template>

    <template v-else>
      <div class="bubble-avatar">
        <slot name="message-avatar" :message="message">
          <el-avatar :src="message.avatar" size="small">
            {{ getChatAvatarFallbackText(message.name) }}
          </el-avatar>
        </slot>
      </div>

      <div class="chat-bubble">
        <div v-if="hasHeader" class="bubble-header">
          <slot name="message-header" :message="message">
            <span class="bubble-name">{{ message.name }}</span>
            <span class="bubble-time">{{ message.time }}</span>
          </slot>
        </div>

        <slot name="message-content" :message="message" :blocks="message.blocks">
          <template v-for="(block, index) in message.blocks" :key="blockKey(block, index)">
            <slot name="message-block" :message="message" :block="block" :index="index">
              <ChatMessageBlockRenderer :block="block" />
            </slot>
          </template>
        </slot>

        <span v-if="message.status === 'streaming'" class="typing-cursor">▌</span>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.chat-bubble-row {
  display: flex;
  align-items: flex-end;
  margin-bottom: 18px;

  &.is-outgoing {
    flex-direction: row-reverse;

    .chat-bubble {
      background: #e6f7ff;
    }
  }

  &.is-center {
    justify-content: center;
    align-items: center;
  }

  &.error .chat-bubble,
  &.error .system-bubble {
    border-color: #f56c6c;
  }
}

.bubble-avatar {
  margin: 0 10px;
}

.chat-bubble {
  max-width: min(780px, calc(100% - 72px));
  background: #fff;
  border-radius: 8px;
  padding: 12px 18px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid transparent;
}

.system-bubble {
  max-width: min(560px, 100%);
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid transparent;
  color: #606266;
}

.bubble-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.bubble-name {
  font-size: 13px;
  font-weight: 500;
  color: #409eff;
}

.bubble-time {
  font-size: 11px;
  color: #bbb;
}

.typing-cursor {
  display: inline-block;
  margin-top: 6px;
  color: var(--el-color-primary);
  animation: cursor-blink 1s steps(1) infinite;
}

@keyframes cursor-blink {
  50% {
    opacity: 0;
  }
}
</style>

