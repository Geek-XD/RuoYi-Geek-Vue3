import { defineStore } from 'pinia'
import type { RouteItem } from '@ruoyi/core/types/route'
import { deepClone } from '@ruoyi/core/utils'
import useSettingsStore from './settings'
import useUserStore from './user'
import { buildMenuRoutes, buildPageRoutes, buildTopbarMenus, buildMixSidebarMenus } from '../helpers/permission'
import { getRouters } from '@ruoyi/core/api/routes'
import { transformAsyncRoutes } from '@ruoyi/core/router/routeTransformers'
import { ROUTES } from '@ruoyi/core/constant'
import { registerAccessRoutes } from '@ruoyi/core/router/routeManager'

const ALL_PERMISSION = '*:*:*'
const SUPER_ADMIN = 'admin'

export interface ResolvedRouteData {
  routeTree: RouteItem[]
  accessRoutes: RouteItem[]
}

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
  roles: () => string[]
  permissions: () => string[]
}

interface PermissionActions {
  setActiveTopMenuPath: (activePath: string) => void
  setRouteData: (routeTree: RouteItem[]) => void
  resetRouteData: () => void
  hasAnyPermission: (requiredPermissions: string[]) => boolean
  hasAllPermissions: (requiredPermissions: string[]) => boolean
  hasAnyRole: (requiredRoles: string[]) => boolean
  hasAllRoles: (requiredRoles: string[]) => boolean
  checkPermi: (value: string[]) => boolean
  checkRole: (value: string[]) => boolean
  resolveAndRegisterRoutes: (activePath: string) => Promise<void>
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
    },
    roles: () => useUserStore().roles,
    permissions: () => useUserStore().permissions
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
    },
    hasAnyPermission(requiredPermissions: string[]): boolean {
      if (this.permissions.includes(ALL_PERMISSION)) return true
      return requiredPermissions.some(permission => this.permissions.includes(permission))
    },
    hasAllPermissions(requiredPermissions: string[]): boolean {
      if (this.permissions.includes(ALL_PERMISSION)) return true
      return requiredPermissions.every(permission => this.permissions.includes(permission))
    },
    hasAnyRole(requiredRoles: string[]): boolean {
      if (this.roles.includes(SUPER_ADMIN)) return true
      return requiredRoles.some(role => this.roles.includes(role))
    },
    hasAllRoles(requiredRoles: string[]): boolean {
      if (this.roles.includes(SUPER_ADMIN)) return true
      return requiredRoles.every(role => this.roles.includes(role))
    },
    checkPermi(value: string[]): boolean {
      if (value && value instanceof Array && value.length > 0) {
        return this.hasAnyPermission(value)
      } else {
        console.error(`need permissions! Like checkPermi="['system:user:add','system:user:edit']"`)
        return false
      }
    },
    checkRole(value: string[]): boolean {
      if (value && value instanceof Array && value.length > 0) {
        return this.hasAnyRole(value)
      } else {
        console.error(`need roles! Like checkRole="['admin','editor']"`)
        return false
      }
    },
    /**
     * 解析并注册授权路由
     * 从后端获取路由 + 本地路由权限过滤 + 注册到 vue-router
     */
    async resolveAndRegisterRoutes(activePath: string): Promise<void> {
      // 收集本地路由
      const localRoutes = Object.values(ROUTES).reduce(
        (acc: RouteItem[], mod: any) => {
          if (Array.isArray(mod?.default)) acc.push(...mod.default)
          return acc
        },
        []
      )

      // 获取后端路由
      const backendRouteTree = (await getRouters()).data || []

      // 过滤本地路由（有权限要求的需要验证）
      const authorizedLocalRoutes = localRoutes.filter(route => {
        if (!route.permissions && !route.roles) return true

        let authorized = false
        if (route.permissions) {
          authorized = authorized || this.hasAnyPermission(route.permissions)
        }
        if (route.roles) {
          authorized = authorized || this.hasAnyRole(route.roles)
        }
        return authorized
      })

      // 合并路由树
      const routeTree = [
        ...deepClone(authorizedLocalRoutes),
        ...backendRouteTree
      ]

      // 准备需要注册的路由
      const accessRoutes = [
        ...transformAsyncRoutes(deepClone(backendRouteTree), true),
        ...deepClone(authorizedLocalRoutes).filter(route => route.permissions || route.roles)
      ]

      // 保存路由树到 store
      this.setRouteData(routeTree)
      this.setActiveTopMenuPath(activePath)

      // 注册到 vue-router
      registerAccessRoutes(accessRoutes)
    }
  }
})

export default usePermissionStore
