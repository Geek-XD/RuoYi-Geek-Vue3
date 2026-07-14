<script setup lang="ts">
withDefaults(defineProps<{
  leftWidth?: string
  rightWidth?: string
}>(), {
  leftWidth: '260px',
  rightWidth: '320px'
})
</script>

<template>
  <div class="graph-designer-layout">
    <el-container>
      <el-header class="graph-designer-layout__header">
        <div class="graph-designer-layout__header-main">
          <div class="graph-designer-layout__title">
            <slot name="title" />
          </div>
          <div v-if="$slots.description" class="graph-designer-layout__description">
            <slot name="description" />
          </div>
        </div>
        <div v-if="$slots.actions" class="graph-designer-layout__actions">
          <slot name="actions" />
        </div>
      </el-header>

      <el-container class="graph-designer-layout__body">
        <el-aside v-if="$slots.sidebar" :width="leftWidth" class="graph-designer-layout__aside">
          <slot name="sidebar" />
        </el-aside>

        <el-main class="graph-designer-layout__main">
          <div v-if="$slots.toolbar" class="graph-designer-layout__toolbar">
            <slot name="toolbar" />
          </div>
          <div class="graph-designer-layout__canvas">
            <slot />
          </div>
          <div v-if="$slots.footer" class="graph-designer-layout__footer">
            <slot name="footer" />
          </div>
        </el-main>

        <el-aside v-if="$slots.inspector" :width="rightWidth" class="graph-designer-layout__aside">
          <slot name="inspector" />
        </el-aside>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.graph-designer-layout {
  height: 100%;

  :deep(.el-container) {
    height: 100%;
  }
}

.graph-designer-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: auto;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.graph-designer-layout__header-main {
  min-width: 0;
}

.graph-designer-layout__title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.graph-designer-layout__description {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.graph-designer-layout__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.graph-designer-layout__body {
  gap: 16px;
  padding-top: 16px;
}

.graph-designer-layout__aside,
.graph-designer-layout__main {
  min-width: 0;
}

.graph-designer-layout__toolbar {
  margin-bottom: 12px;
}

.graph-designer-layout__footer {
  margin-top: 16px;
}
</style>
