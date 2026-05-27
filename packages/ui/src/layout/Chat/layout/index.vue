<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  width?: string;
  height?: string;
  headerHeight?: string;
  windowSidebarWidth?: string;
  appSidebarWidth?: string;
  appSidebarCollapsed?: boolean;
  showWindowSidebar?: boolean;
  showAppSidebar?: boolean;
}>(), {
  width: '80vw',
  height: '80vh',
  headerHeight: '45px',
  windowSidebarWidth: '60px',
  appSidebarWidth: '300px',
  appSidebarCollapsed: false,
  showWindowSidebar: true,
  showAppSidebar: true,
});

const layoutStyle = computed(() => ({
  '--chat-window-width': props.width,
  '--chat-window-height': props.height,
  '--chat-window-header-height': props.headerHeight,
  '--chat-window-sidebar-width': props.showWindowSidebar ? props.windowSidebarWidth : '0px',
  '--chat-app-sidebar-width': props.showAppSidebar ? props.appSidebarWidth : '0px',
}));
</script>

<template>
  <div class="window" :class="{ 'app-sidebar-collapsed': appSidebarCollapsed, 'no-window-sidebar': !showWindowSidebar, 'no-app-sidebar': !showAppSidebar }" :style="layoutStyle">
    <div class="window-header">
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
.window {
  height: var(--chat-window-height);
  width: var(--chat-window-width);
  background: #f5f6fa;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  overflow: hidden;
  min-height: 0;

  .window-header {
    background-color: var(--el-color-primary-light-2);
    height: var(--chat-window-header-height);
  }

  .window-main {
    display: flex;
    height: calc(var(--chat-window-height) - var(--chat-window-header-height));
    min-height: 0;
  }

  .window-sidebar {
    width: var(--chat-window-sidebar-width);
    height: calc(var(--chat-window-height) - var(--chat-window-header-height));
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0;
    gap: 10px;
    transition: width 0.25s ease;
    min-height: 0;
  }
}

.app-sidebar {
  width: var(--chat-app-sidebar-width);
  height: calc(var(--chat-window-height) - var(--chat-window-header-height));
  background: #fff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  overflow: hidden;
  min-height: 0;
}

.app-sidebar-collapsed .app-sidebar {
  width: 0;
  border-right: none;
}

.app-main {
  flex: 1;
  min-width: 0;
  height: calc(var(--chat-window-height) - var(--chat-window-header-height));
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
