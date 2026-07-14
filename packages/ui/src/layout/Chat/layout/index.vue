<script lang="ts" setup>
import { computed, useSlots } from 'vue';
import type { ChatLayoutMode } from '../types';

const slots = useSlots();

const props = withDefaults(defineProps<{
  mode?: ChatLayoutMode;
  width?: string;
  height?: string;
  headerHeight?: string;
  windowSidebarWidth?: string;
  appSidebarWidth?: string;
  appSidebarCollapsed?: boolean;
  showWindowSidebar?: boolean;
  showAppSidebar?: boolean;
  floatRight?: string;
  floatBottom?: string;
  surfaceColor?: string;
}>(), {
  mode: 'window',
  width: '80vw',
  height: '80vh',
  headerHeight: '64px',
  windowSidebarWidth: '68px',
  appSidebarWidth: '320px',
  appSidebarCollapsed: false,
  showWindowSidebar: true,
  showAppSidebar: true,
  floatRight: '24px',
  floatBottom: '24px',
  surfaceColor: '#f5f6fa',
});

const hasHeader = computed(() => Boolean(slots['window-header']));
const layoutStyle = computed(() => ({
  '--chat-layout-width': props.width,
  '--chat-layout-height': props.height,
  '--chat-layout-header-height': hasHeader.value ? props.headerHeight : '0px',
  '--chat-layout-window-sidebar-width': props.showWindowSidebar ? props.windowSidebarWidth : '0px',
  '--chat-layout-app-sidebar-width': props.showAppSidebar ? props.appSidebarWidth : '0px',
  '--chat-layout-float-right': props.floatRight,
  '--chat-layout-float-bottom': props.floatBottom,
  '--chat-layout-surface': props.surfaceColor,
}));
</script>

<template>
  <div class="chat-layout"
    :class="[`is-${mode}`,
      { 'app-sidebar-collapsed': appSidebarCollapsed, 'no-window-sidebar': !showWindowSidebar, 'no-app-sidebar': !showAppSidebar }]"
    :style="layoutStyle">
    <div v-if="hasHeader" class="window-header">
      <slot name="window-header" />
    </div>
    <div class="window-main">
      <div v-if="showWindowSidebar" class="window-sidebar">
        <slot name="window-sidebar" />
      </div>
      <div v-if="showAppSidebar" class="app-sidebar">
        <slot name="app-sidebar" />
      </div>
      <div class="app-main">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--chat-layout-width);
  height: var(--chat-layout-height);
  min-width: 0;
  min-height: 0;
  background: var(--chat-layout-surface);
  overflow: hidden;
}

.chat-layout.is-window,
.chat-layout.is-float {
  border: 1px solid #e6e8ef;
  border-radius: 18px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.chat-layout.is-page {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.chat-layout.is-float {
  position: absolute;
  right: var(--chat-layout-float-right);
  bottom: var(--chat-layout-float-bottom);
  z-index: 20;
  backdrop-filter: blur(12px);
}

.window-header {
  flex-shrink: 0;
  height: var(--chat-layout-header-height);
  background: linear-gradient(135deg, var(--el-color-primary-light-2) 0%, var(--el-color-primary) 100%);
}

.is-page .window-header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.window-main {
  display: flex;
  flex: 1;
  min-height: 0;
}

.window-sidebar {
  width: var(--chat-layout-window-sidebar-width);
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  border-right: 1px solid rgba(228, 231, 237, 0.72);
  background: rgba(248, 250, 255, 0.92);
  transition: width 0.25s ease;
}

.is-page .window-sidebar {
  background: #fff;
}

.app-sidebar {
  width: var(--chat-layout-app-sidebar-width);
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  border-right: 1px solid rgba(228, 231, 237, 0.9);
  transition: width 0.25s ease, border-color 0.25s ease;
}

.app-sidebar-collapsed .app-sidebar {
  width: 0;
  border-right-color: transparent;
}

.app-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.is-page .app-main {
  background: #fff;
}

@media (max-width: 768px) {
  .chat-layout:not(.is-float) .window-sidebar {
    width: 56px;
  }

  .chat-layout:not(.is-float) .app-sidebar {
    width: min(280px, 72vw);
  }
}
</style>
