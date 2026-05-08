import { defineStore } from 'pinia'
import type { RouteItem } from '@ruoyi/core/types/route'
import { deepClone } from '@ruoyi/core/utils'
import useSettingsStore from './settings'
import { buildMenuRoutes, buildPageRoutes, buildTopbarMenus, buildMixSidebarMenus } from '../helpers/permission'

interface PermissionState {
  routeTree: RouteItem[]
  activeTopMenuPath: string
}

interface PermissionGetters {
  [key: string]: any
  menuRoutes: (state: PermissionState) => RouteItem[]
  pageRoutes: (state: PermissionState) => RouteItem[]
  topbarRoutes: () => RouteItem[]
  sidebarRoutes: () => RouteItem[]
}

interface PermissionActions {
  setActiveTopMenuPath: (activePath: string) => void
  setRouteData: (routeTree: RouteItem[]) => void
  resetRouteData: () => void
}

const usePermissionStore = defineStore<string, PermissionState, PermissionGetters, PermissionActions>('permission', {
  state: () => ({
    routeTree: [],
    activeTopMenuPath: ''
  }),
  getters: {
    menuRoutes: (state) => buildMenuRoutes(deepClone(state.routeTree)),
    pageRoutes: (state) => buildPageRoutes(deepClone(state.routeTree)),
    topbarRoutes() {
      if (useSettingsStore().isLeftMenu) return []
      return buildTopbarMenus(this.menuRoutes)
    },
    sidebarRoutes() {
      if (useSettingsStore().isTopMenu) return []
      if (useSettingsStore().isLeftMenu) return this.menuRoutes
      return buildMixSidebarMenus(this.menuRoutes, this.activeTopMenuPath)
    }
  },
  actions: {
    setActiveTopMenuPath(activePath: string) {
      this.activeTopMenuPath = activePath
    },
    setRouteData(routeTree) {
      this.routeTree = deepClone(routeTree)
    },
    resetRouteData() {
      this.routeTree = []
      this.activeTopMenuPath = ''
    }
  }
})

export default usePermissionStore
