import { defineStore } from 'pinia'
import { RouteItem } from '@ruoyi/core/types/route'
import { getNormalPath } from '@ruoyi/core/utils/ruoyi'
import { isHttp } from '@ruoyi/core/utils/validate'
import { deepClone } from '@ruoyi/core/utils'
import auth from '@ruoyi/core/plugins/auth'
import { getRouters } from '@/api/login'
import { filterAsyncRouter } from '@ruoyi/core/router/utils/utils'
import { constantRoutes } from '@ruoyi/core/router/routes/staticRoutes'
import { dynamicRoutes } from '@ruoyi/core/router/routes/asyncRoutes'
import useSettingsStore from './settings'

interface PermissionState {
  routeTree: RouteItem[]
  activeTopMenuPath: string
}

interface PermissionGetters {
  [key: string]: any
  pageRoutes: (state: PermissionState) => RouteItem[]
  menuRoutes: (state: PermissionState) => RouteItem[]
  topbarRoutes: () => RouteItem[]
  sidebarRoutes: () => RouteItem[]
}

interface PermissionActions {
  setActiveTopMenuPath: (activePath: string) => void
  generateRoutes: () => Promise<RouteItem[]>
}

const usePermissionStore = defineStore<string, PermissionState, PermissionGetters, PermissionActions>('permission', {
  state: () => ({
    routeTree: deepClone(constantRoutes),
    activeTopMenuPath: ''
  }),
  getters: {
    pageRoutes: (state) => filterAsyncRouter(deepClone(state.routeTree), true),
    menuRoutes: (state) => filterAsyncRouter(deepClone(state.routeTree)),
    topbarRoutes() {
      if (useSettingsStore().isLeftMenu) return []
      else return buildTopbarMenus(this.menuRoutes)
    },
    sidebarRoutes() {
      if (useSettingsStore().isTopMenu) return []
      else if (useSettingsStore().isLeftMenu) return this.menuRoutes
      else return buildMixSidebarMenus(this.menuRoutes, this.activeTopMenuPath)
    }
  },
  actions: {
    setActiveTopMenuPath(activePath: string) { this.activeTopMenuPath = activePath },
    async generateRoutes() {
      const res = await getRouters()
      const backendRouteTree = deepClone(res.data)
      const accessDynamicRoutes = filterDynamicRoutes(deepClone(dynamicRoutes))
      this.routeTree = [...deepClone(constantRoutes), ...backendRouteTree, ...deepClone(accessDynamicRoutes)]
      const rewriteRoutes = filterAsyncRouter(deepClone(backendRouteTree), true)
      return [...rewriteRoutes, ...accessDynamicRoutes]
    }
  }
})


/** 动态路由遍历，验证是否具备权限 */
function filterDynamicRoutes(routes: readonly RouteItem[]): RouteItem[] {
  const res: RouteItem[] = []
  routes.forEach(route => {
    let flag = false
    if (route.permissions) flag = flag || auth.hasPermiOr(route.permissions)
    if (route.roles) flag = flag || auth.hasRoleOr(route.roles)
    if (flag) res.push(route)
  })
  return res
}

const getVisibleChildren = (route: RouteItem) => (route.children || []).filter((item): item is RouteItem => item.hidden !== true)

function resolveMenuPath(path: string, parentPath?: string): string {
  if (isHttp(path)) return path
  if (!parentPath || path.startsWith('/')) return getNormalPath(path)
  return getNormalPath(`${parentPath}/${path}`)
}

function normalizeTopbarRoute(route: RouteItem, parentPath?: string): RouteItem {
  const currentPath = resolveMenuPath(route.path, parentPath)
  const currentRoute = {
    ...route,
    path: currentPath,
    parentPath,
    meta: {
      ...route.meta,
      icon: route.meta?.icon || 'dashboard'
    }
  }

  const children = getVisibleChildren(route)
  if (children.length) {
    currentRoute.children = children.map(child => normalizeTopbarRoute(child, currentPath))
  } else {
    delete currentRoute.children
  }

  return currentRoute
}

function buildTopbarMenus(routes: RouteItem[]): RouteItem[] {
  const menus: RouteItem[] = []

  routes.forEach(menu => {
    if (menu.hidden === true) return
    const children = getVisibleChildren(menu)
    if ((menu.path === '' || menu.path === '/') && children[0]) {
      const child = children[0]
      menus.push(normalizeTopbarRoute({
        ...child,
        path: resolveMenuPath(child.path, menu.path || '/'),
        meta: {
          ...child.meta,
          icon: child.meta?.icon || 'dashboard'
        }
      }))
      return
    }

    if (menu.meta?.isTopMenu && children[0]) {
      menus.push(normalizeTopbarRoute({
        ...children[0],
        path: menu.path,
        meta: {
          ...children[0].meta,
          icon: children[0].meta?.icon || menu.meta?.icon || 'dashboard'
        }
      }))
      return
    }

    menus.push(normalizeTopbarRoute(menu))
  })

  return menus
}

const matchesMenuPath = (activePath: string, topPath: string) => activePath === topPath || activePath.startsWith(`${topPath}/`)
function buildMixSidebarMenus(routes: RouteItem[], activePath: string): RouteItem[] {
  if (!activePath) return []

  for (const route of routes) {
    if (route.hidden === true) continue
    const children = getVisibleChildren(route)
    if (!children.length) continue
    if (route.path === '' || route.path === '/') continue
    const topPath = resolveMenuPath(route.path)
    if (!matchesMenuPath(activePath, topPath)) continue
    const sidebarRoutes = deepClone(children)
    sidebarRoutes.forEach(item => item.path = resolveMenuPath(item.path, route.path))
    return sidebarRoutes
  }

  return []
}

export default usePermissionStore
