<script lang="ts" setup>
withDefaults(defineProps<{
  title?: string;
  description?: string;
  iconColor?: string;
}>(), {
  title: '',
  description: '',
  iconColor: '#409eff',
});
</script>

<template>
  <div class="chat-toolbar">
    <div class="toolbar-left">
      <slot name="icon">
        <span class="toolbar-icon" :style="{ color: iconColor }">●</span>
      </slot>
      <div class="toolbar-meta">
        <slot name="title">
          <div class="toolbar-title">{{ title }}</div>
        </slot>
        <slot name="description">
          <div v-if="description" class="toolbar-desc">{{ description }}</div>
        </slot>
      </div>
    </div>
    <div v-if="$slots.default" class="toolbar-center">
      <slot />
    </div>
    <div v-if="$slots.actions" class="toolbar-right">
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.toolbar-icon {
  font-size: 18px;
  line-height: 1;
}

.toolbar-meta {
  min-width: 0;
}

.toolbar-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.toolbar-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  flex-shrink: 0;
}
</style>
