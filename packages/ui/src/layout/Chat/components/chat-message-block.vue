<script lang="ts" setup>
import type { ChatMessageBlock } from '../types';

const props = defineProps<{
  block: ChatMessageBlock;
}>();

function formatSize(size?: unknown) {
  const bytes = Number(size || 0);
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
</script>

<template>
  <div class="chat-message-block" :class="`block-${block.type || 'text'}`">
    <div v-if="block.type === 'html'" class="block-html" v-html="block.html || block.content"></div>
    <div v-else-if="block.type === 'image'" class="block-media">
      <img :src="String(block.props?.url || '')" :alt="String(block.props?.alt || '')" />
    </div>
    <div v-else-if="block.type === 'video'" class="block-media">
      <video :src="String(block.props?.url || '')" :poster="String(block.props?.poster || '')" controls />
      <div v-if="block.props?.title" class="media-title">{{ block.props.title }}</div>
    </div>
    <div v-else-if="block.type === 'audio'" class="block-audio">
      <div v-if="block.props?.title" class="media-title">{{ block.props.title }}</div>
      <audio :src="String(block.props?.url || '')" controls />
    </div>
    <a v-else-if="block.type === 'file'" class="block-file" :href="String(block.props?.url || '')" target="_blank">
      <span class="file-icon">📄</span>
      <span class="file-info">
        <span class="file-name">{{ block.props?.filename || '文件' }}</span>
        <span v-if="block.props?.size" class="file-size">{{ formatSize(block.props.size) }}</span>
      </span>
    </a>
    <div v-else-if="block.type === 'report' || block.type === 'component' || block.type === 'preview'" class="block-card">
      <div class="card-title">{{ block.props?.title || (block.type === 'report' ? '报表卡片' : block.type === 'component' ? '组件卡片' : '预览卡片') }}</div>
      <div class="card-code">{{ block.props?.reportCode || block.props?.metaCode || block.props?.filename || 'AI 扩展块' }}</div>
    </div>
    <div v-else class="block-text">{{ block.content }}</div>
  </div>
</template>

<style lang="scss" scoped>
.chat-message-block + .chat-message-block {
  margin-top: 10px;
}

.block-html {
  color: #303133;

  :deep(pre) {
    background: #f6f8fa;
    border-radius: 8px;
    padding: 12px;
    overflow-x: auto;
    margin: 8px 0;
  }

  :deep(code) {
    font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
    font-size: 13px;
  }

  :deep(p) {
    margin: 4px 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
  }
}

.block-media img,
.block-media video {
  max-width: 100%;
  border-radius: 8px;
  display: block;
}

.block-audio {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;

  audio {
    width: 100%;
  }
}

.media-title {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
}

.block-file,
.block-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #f8fafc;
  color: inherit;
  text-decoration: none;
}

.file-icon {
  font-size: 26px;
}

.file-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-name,
.card-title {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.file-size,
.card-code {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.block-card {
  flex-direction: column;
  align-items: flex-start;
  border-color: #d7e3f7;
  background: linear-gradient(180deg, #f9fcff 0%, #edf7ff 100%);
}

.block-text {
  white-space: pre-wrap;
  line-height: 1.7;
}
</style>
