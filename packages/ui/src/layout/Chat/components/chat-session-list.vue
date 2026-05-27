<script lang="ts" setup generic="T extends { id: string | number }">
import ContactList from './contact-list.vue';

const model = defineModel<T>();

withDefaults(defineProps<{
  list: T[];
  loading?: boolean;
  title?: string;
  description?: string;
  count?: number;
  emptyText?: string;
  getTitle?: (item: T) => string;
  getDescription?: (item: T) => string;
}>(), {
  list: () => [],
  loading: false,
  title: '对话记录',
  description: '',
  emptyText: '暂无对话记录',
});
</script>

<template>
  <div class="chat-session-list" v-loading="loading">
    <div class="session-list-header">
      <div>
        <div class="session-list-title">{{ title }}</div>
        <div v-if="description" class="session-list-desc">{{ description }}</div>
      </div>
      <slot name="header-extra">
        <el-tag v-if="count !== undefined" size="small" type="info">{{ count }}</el-tag>
      </slot>
    </div>

    <div v-if="list.length === 0 && !loading" class="session-empty">{{ emptyText }}</div>

    <ContactList v-else v-model="model" :list="list">
      <template #default="{ item }">
        <slot name="item" :item="item">
          <div class="session-row">
            <div class="session-main">
              <div class="session-name">{{ getTitle ? getTitle(item) : (item as any).title || '新对话' }}</div>
              <div class="session-desc">{{ getDescription ? getDescription(item) : (item as any).description || '' }}</div>
            </div>
            <slot name="item-actions" :item="item" />
          </div>
        </slot>
      </template>
    </ContactList>
  </div>
</template>

<style lang="scss" scoped>
.chat-session-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.session-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f0f2f5;
}

.session-list-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.session-list-desc,
.session-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.session-empty {
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
  padding: 30px 0;
}

.session-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.session-main {
  min-width: 0;
  flex: 1;
}

.session-name {
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
