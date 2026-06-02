<script lang="ts" setup>
import { computed } from 'vue';
import type { ChatRailItem } from '../types';

const activeKey = defineModel<string | number>();

const props = withDefaults(defineProps<{
  items?: ChatRailItem[];
}>(), {
  items: () => [],
});

const emit = defineEmits<{
  select: [item: ChatRailItem];
}>();

const railItems = computed(() => props.items ?? []);

function handleSelect(item: ChatRailItem) {
  if (item.disabled) {
    return;
  }

  if (item.kind !== 'action') {
    activeKey.value = item.key;
  }

  emit('select', item);
}
</script>

<template>
  <div class="chat-nav-rail">
    <el-tooltip v-for="item in railItems" :key="item.key" :content="item.label" placement="right">
      <el-badge :value="item.badge" :is-dot="item.dot" :hidden="item.badge === undefined && !item.dot">
        <button type="button" class="rail-item" :class="{
          active: item.kind !== 'action' && activeKey === item.key,
          action: item.kind === 'action',
          disabled: item.disabled,
        }" :disabled="item.disabled" @click="handleSelect(item)">
          <el-icon v-if="item.icon" :size="20">
            <component :is="item.icon" />
          </el-icon>
          <span class="rail-label">{{ item.label }}</span>
        </button>
      </el-badge>
    </el-tooltip>
  </div>
</template>

<style lang="scss" scoped>
.chat-nav-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.rail-item {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(.disabled) {
    color: var(--el-color-primary);
    background: rgba(64, 158, 255, 0.1);
  }

  &.active {
    color: var(--el-color-primary);
    background: linear-gradient(180deg, rgba(64, 158, 255, 0.18) 0%, rgba(64, 158, 255, 0.1) 100%);
    box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.2);
  }

  &.action {
    color: #4b5563;
    background: rgba(148, 163, 184, 0.08);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.rail-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
}
</style>
