<script setup lang="ts">
import type { RouteItem } from '@ruoyi/core/types/route'

defineOptions({ name: 'TopNavItem' })

const props = defineProps<{ item: RouteItem }>()

function getItemIndex(route: RouteItem) {
  return route.path
}

function getChildren(route: RouteItem) {
  return (route.children || []).filter((item): item is RouteItem => item.hidden !== true)
}
</script>

<template>
  <el-menu-item v-if="!getChildren(item).length" :index="getItemIndex(item)">
    <svg-icon :icon-class="item.meta?.icon || 'dashboard'" />
    <span>{{ item.meta?.title }}</span>
  </el-menu-item>

  <el-sub-menu v-else :index="getItemIndex(item)" popper-class="topnav-submenu-popper" :popper-offset="6">
    <template #title>
      <svg-icon :icon-class="item.meta?.icon || 'dashboard'" />
      <span>{{ item.meta?.title }}</span>
    </template>
    <top-nav-item v-for="child in getChildren(item)" :key="getItemIndex(child)" :item="child" />
  </el-sub-menu>
</template>
<style lang="scss">
.topnav-submenu-popper {
  --el-menu-text-color: #999093;
  background: #fff !important;
  border-radius: 8px !important;
  padding: 4px !important;


  .el-menu {
    border-right: none;
    background: transparent;
  }

  .el-menu--popup {
    min-width: 156px;
    border: none;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    background: transparent;
  }

  .el-menu-item,
  .el-sub-menu__title {
    height: 36px;
    line-height: 36px;
    border-radius: 6px;
    margin: 1px 0;
    padding: 0 10px;

    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .el-menu-item:hover,
  .el-sub-menu__title:hover {
    background: #f5f8ff;
    color: var(--theme, #409eff);
  }

  .el-menu-item.is-active {
    background: rgba(64, 158, 255, 0.1);
    color: var(--theme, #409eff);
  }

  .svg-icon {
    margin-right: 8px;
  }
}
</style>