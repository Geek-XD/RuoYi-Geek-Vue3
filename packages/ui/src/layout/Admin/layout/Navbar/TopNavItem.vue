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

  <el-sub-menu v-else :index="getItemIndex(item)">
    <template #title>
      <svg-icon :icon-class="item.meta?.icon || 'dashboard'" />
      <span>{{ item.meta?.title }}</span>
    </template>
    <top-nav-item v-for="child in getChildren(item)" :key="getItemIndex(child)" :item="child" />
  </el-sub-menu>
</template>