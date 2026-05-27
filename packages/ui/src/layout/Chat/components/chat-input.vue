<script lang="ts" setup>
import { computed } from 'vue';
import { VideoPause } from '@element-plus/icons-vue';

const message = defineModel<string>({ default: '' });

const props = withDefaults(defineProps<{
  placeholder?: string;
  rows?: number;
  autosize?: boolean | { minRows?: number; maxRows?: number };
  loading?: boolean;
  disabled?: boolean;
  submitOnEnter?: boolean;
  clearAfterSend?: boolean;
  sendButtonText?: string;
  showStopButton?: boolean;
  stopButtonText?: string;
}>(), {
  placeholder: '请输入内容...',
  rows: 5,
  autosize: false,
  loading: false,
  disabled: false,
  submitOnEnter: true,
  clearAfterSend: true,
  sendButtonText: '发送',
  showStopButton: false,
  stopButtonText: '停止',
});

const emit = defineEmits<{
  send: [message: string];
  stop: [];
}>();

const resolvedDisabled = computed(() => props.disabled || (props.loading && props.showStopButton));

function send(e?: KeyboardEvent) {
  if (e?.isComposing || props.disabled || props.loading) {
    return;
  }

  const value = message.value.trim();
  if (!value) {
    return;
  }

  emit('send', value);

  if (props.clearAfterSend) {
    message.value = '';
  }
}

function stop() {
  if (props.disabled || !props.loading) {
    return;
  }
  emit('stop');
}

function onKeydown(e: KeyboardEvent) {
  if (!props.submitOnEnter || e.key !== 'Enter' || e.shiftKey) {
    return;
  }

  e.preventDefault();
  send(e);
}
</script>

<template>
  <div class="chat-input-area">
    <el-input
      v-model="message"
      type="textarea"
      :rows="rows"
      :autosize="autosize"
      :placeholder="placeholder"
      :disabled="resolvedDisabled"
      resize="none"
      @keydown="onKeydown"
    />
    <slot name="actions" :send="send" :stop="stop" :disabled="disabled || loading || !message.trim()">
      <el-button
        v-if="showStopButton && loading"
        type="danger"
        @click="stop"
        style="height: 30px;"
      >
        <el-icon><VideoPause /></el-icon>
        {{ stopButtonText }}
      </el-button>
      <el-button
        v-else
        type="primary"
        :loading="loading"
        :disabled="disabled || !message.trim()"
        @click="send"
        style="height: 30px;"
      >
        {{ sendButtonText }}
      </el-button>
    </slot>
  </div>
</template>

<style scoped lang="scss">
.chat-input-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 18px 24px;
  background: #fff;
  border-top: 1px solid #e6e6e6;
  gap: 10px;
  min-height: 128px;

  :deep(.el-textarea__inner) {
    box-shadow: none;
    resize: none;
  }
}
</style>
