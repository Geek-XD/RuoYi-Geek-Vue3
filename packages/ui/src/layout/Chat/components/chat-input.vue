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
  canSend?: boolean;
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
  canSend: undefined,
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
const canSend = computed(() => props.canSend ?? Boolean(message.value.trim()));

function send(e?: KeyboardEvent) {
  if (e?.isComposing || props.disabled || props.loading) {
    return;
  }

  const value = message.value.trim();
  if (!canSend.value) {
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
    <div v-if="$slots.toolbar" class="chat-input-toolbar">
      <slot name="toolbar" :send="send" :stop="stop" :disabled="resolvedDisabled" :message="message" />
    </div>
    <div class="chat-input-shell" :class="{ disabled: resolvedDisabled }">
      <el-input v-model="message" type="textarea" :rows="rows" :autosize="autosize" :placeholder="placeholder"
        :disabled="resolvedDisabled" resize="none" @keydown="onKeydown" />
      <div class="chat-input-footer">
        <div v-if="$slots['footer-prefix']" class="chat-footer-prefix">
          <slot name="footer-prefix" :send="send" :stop="stop" :disabled="resolvedDisabled" :message="message" />
        </div>
        <div class="chat-footer-actions">
          <slot name="actions" :send="send" :stop="stop" :disabled="disabled || loading || !canSend">
            <el-button v-if="showStopButton && loading" type="danger" @click="stop" style="height: 34px;">
              <el-icon>
                <VideoPause />
              </el-icon>
              {{ stopButtonText }}
            </el-button>
            <el-button v-else type="primary" :loading="loading" :disabled="disabled || !canSend" @click="send"
              style="height: 34px;">
              {{ sendButtonText }}
            </el-button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-input-area {
  display: flex;
  flex-direction: column;
  padding: 18px 24px;
  background: #fff;
  border-top: 1px solid #e6e6e6;
  gap: 12px;
  min-height: 148px;
}

.chat-input-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-input-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e5eaf3;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);

  &.disabled {
    opacity: 0.9;
  }
}

.chat-input-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.chat-footer-prefix {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chat-footer-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-textarea__inner) {
  box-shadow: none;
  resize: none;
  border: none;
  padding: 0;
  background: transparent;
  min-height: 88px !important;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: none;
}
</style>
