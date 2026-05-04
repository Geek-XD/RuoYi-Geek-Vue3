/**
* TopNav组件
*
* 功能说明：
* 1. 顶部导航栏组件，支持显示一级菜单和更多菜单折叠
* 2. 支持两种菜单来源：
* - 仅显示后端动态路由（关闭TopNav导入本地路由时）
* - 混合显示本地路由和后端动态路由（开启TopNav导入本地路由时）
* 3. 特殊处理：
* - 空路径("")或根路径("/")：显示其第一个子路由为顶级菜单
* - isTopMenu: 将该路由的第一个子路由显示为顶级菜单
*
* 配置说明：
* 1. 在系统设置中可配置：
* - 开启/关闭TopNav
* - 开启/关闭TopNav导入本地路由
* 2. 路由配置中可使用meta.isTopMenu控制菜单行为
*/
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isHttp } from '@ruoyi/core/utils/validate'
import useAppStore from '@ruoyi/core/store/modules/app'
import useSettingsStore from '@ruoyi/core/store/modules/settings'
import usePermissionStore from '@ruoyi/core/store/modules/permission'
import { RoutesAlias } from '@ruoyi/core/router/routesAlias'
import { useEventListener } from "@vueuse/core"
import type { RouteItem } from '@ruoyi/core/types/route'
import TopNavItem from './TopNavItem.vue'


// 隐藏侧边栏路由
const hideList = [RoutesAlias.Home, '/user/profile'];

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const route = useRoute();
const router = useRouter();

// 主题颜色
const theme = computed(() => settingsStore.theme);
// 所有的路由信息
const topbarRoutes = computed(() => permissionStore.topbarRoutes);
const isMixMenu = computed(() => settingsStore.isMixMenu)
const isTopMenu = computed(() => settingsStore.isTopMenu)

function getMenuChildren(route: RouteItem) {
  return (route.children || []).filter((item): item is RouteItem => item.hidden !== true)
}

function findTopMenuByPath(path: string, menus: RouteItem[] = topbarRoutes.value): RouteItem | undefined {
  for (const item of menus) {
    if (item.path === path) {
      return item
    }
    const found = findTopMenuByPath(path, getMenuChildren(item))
    if (found) {
      return found
    }
  }
  return undefined
}

function syncSidebarMenus(activePath: string) {
  permissionStore.setActiveTopMenuPath(activePath)
  const sidebarRoutes = permissionStore.sidebarRoutes
  if (sidebarRoutes.length === 0) {
    appStore.toggleSideBarHide(true)
  }
  return sidebarRoutes
}

// 默认激活的菜单
const activeMenu = computed(() => {
  const path = route.path;
  if (isTopMenu.value) {
    const matchedTopMenu = topbarRoutes.value.find(item => path === item.path || path.startsWith(`${item.path}/`))
    if (matchedTopMenu) {
      return path === matchedTopMenu.path ? matchedTopMenu.path : path
    }
    return path
  }
  if (path !== undefined && path.lastIndexOf("/") > 0 && hideList.indexOf(path) === -1) {
    const tmpPath = path.substring(1, path.length);
    const splitIndex = tmpPath.indexOf("/")
    if (splitIndex > -1) {
      return "/" + tmpPath.substring(0, splitIndex);
    }
  }
  return path;
})

watch([activeMenu, isTopMenu, () => route.path, () => route.meta.link], ([menuPath, topMenuEnabled, currentPath, currentLink]) => {
  if (topMenuEnabled) {
    appStore.toggleSideBarHide(true)
    return
  }

  if (hideList.includes(currentPath)) {
    appStore.toggleSideBarHide(true)
    return
  }

  const routes = syncSidebarMenus(menuPath)
  if (routes.length > 0 && !currentLink) {
    appStore.toggleSideBarHide(false)
  }
}, { immediate: true })

function handleSelect(key: string) {
  const topRoute = findTopMenuByPath(key)
  if (isHttp(key)) {
    window.open(key, "_blank");
    return
  }

  if (isTopMenu.value) {
    router.push({ path: key });
    appStore.toggleSideBarHide(true);
    return
  }

  if (!topRoute || !topRoute.children?.length) {
    router.push({ path: key });
    appStore.toggleSideBarHide(true);
    return
  }

  const routes = syncSidebarMenus(key)
  if (routes.length > 0) {
    appStore.toggleSideBarHide(false)
  }
}

/** 顶部栏初始数 */
const visibleNumber = ref(0);
const setVisibleNumber = () => {
  const width = document.body.getBoundingClientRect().width / 3;
  visibleNumber.value = Math.floor(width / 85);
}
useEventListener("resize", setVisibleNumber);
onMounted(() => { setVisibleNumber() })
</script>
<template>
  <el-menu :default-active="activeMenu" mode="horizontal" @select="handleSelect" :ellipsis="false"
    class="topmenu-container">
    <template v-for="(item, index) in topMenus" :key="item.path">
      <el-menu-item v-if="index < visibleNumber && isMixMenu" :style="{ '--theme': theme }" :index="item.path">
        <svg-icon :icon-class="item.meta?.icon || 'dashboard'" />
        <span>{{ item.meta?.title }}</span>
      </el-menu-item>

      <top-nav-item v-else-if="index < visibleNumber" :item="item" :style="{ '--theme': theme }" />
    </template>

    <!-- 顶部菜单超出数量折叠 -->
    <el-sub-menu :style="{ '--theme': theme }" index="more" v-if="topMenus.length > visibleNumber">
      <template #title>更多菜单</template>
      <template v-for="(item, index) in topMenus" :key="`${item.path}-more`">
        <el-menu-item v-if="index >= visibleNumber && isMixMenu" :index="item.path">
          <svg-icon :icon-class="item.meta?.icon || 'dashboard'" />
          <span>{{ item.meta?.title }}</span>
        </el-menu-item>
        <top-nav-item v-else-if="index >= visibleNumber" :item="item" />
      </template>
    </el-sub-menu>
  </el-menu>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/variables.module.scss";

.topmenu-container {
  --el-menu-bg-color: variables.$navbar-color;

  &.el-menu--horizontal>:deep(.el-menu-item) {
    float: left;
    height: variables.$navbar-height;
    line-height: variables.$navbar-height;
    color: #999093;
    padding: 0 5px;
    margin: 0 10px;
    background-color: transparent;


    &:hover {
      color: var(--el-menu-active-color);
    }
  }

  &.el-menu--horizontal>:deep(.el-menu-item.is-active),
  &.el-menu--horizontal>.el-sub-menu.is-active :deep(.el-sub-menu__title) {
    border-bottom: 2px solid transparent;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 6px;
      left: 25%;
      width: 50%;
      height: 2px;
      background-color: var(--el-menu-active-color);
    }

    &>.el-sub-menu__icon-arrow {
      position: absolute;
      right: -8px;
    }
  }

  &.el-menu--horizontal>.el-sub-menu :deep(.el-sub-menu__title) {
    float: left;
    height: variables.$navbar-height;
    line-height: variables.$navbar-height;
    color: #999093;
    padding: 0 5px;
    margin: 0 10px;
  }

}
</style>
