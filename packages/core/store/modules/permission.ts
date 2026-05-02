import { h, type Component } from 'vue'
import { defineStore } from 'pinia'
import { RouteItem } from '@ruoyi/core/types/route'
import { getNormalPath } from '@ruoyi/core/utils/ruoyi'
import { isHttp } from '@ruoyi/core/utils/validate'
import { deepClone } from '@ruoyi/core/utils'
import auth from '@ruoyi/core/plugins/auth'
import { getRouters } from '@/api/login'
import { constantRoutes } from '@ruoyi/core/router/routes/staticRoutes'
import { dynamicRoutes } from '@ruoyi/core/router/routes/asyncRoutes'
import { router } from '@ruoyi/core/router'
import Layout from '@/layout/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'
import ParentView from '@/components/ParentView/index.vue'
import useSettingsStore from './settings'

type ModuleLoader = () => Promise<Component>
const modules: Record<string, ModuleLoader> = import.meta.glob([
  '/src/views/**/*.vue',
  '/modules/**/views/**/*.vue'
])

interface PermissionState {
  routes: RouteItem[]
  menuRouters: RouteItem[]
  activeTopMenuPath: string
}

interface PermissionGetters {
  [typekey: string]: any
  topbarRouters: (state: PermissionState) => RouteItem[]
  sidebarRouters: (state: PermissionState) => RouteItem[]
}

interface PermissionActions {
  setActiveTopMenuPath: (activePath: string) => void
  generateRoutes: () => Promise<RouteItem[]>
}

const usePermissionStore = defineStore<string, PermissionState, PermissionGetters, PermissionActions>('permission', {
  state: () => ({
    routes: [],
    menuRouters: [],
    activeTopMenuPath: ''
  }),
  getters: {
    topbarRouters(state): RouteItem[] {
      if (useSettingsStore().isLeftMenu) return []
      else return buildTopbarMenus(state.menuRouters)
    },
    sidebarRouters(state): RouteItem[] {
      if (useSettingsStore().isTopMenu) return []
      else if (useSettingsStore().isLeftMenu) return state.menuRouters
      else return buildMixSidebarMenus(state.menuRouters, state.activeTopMenuPath)
    }
  },
  actions: {
    setActiveTopMenuPath(activePath: string) {
      this.activeTopMenuPath = activePath
    },
    async generateRoutes() {
      const res = await getRouters()
      const menuRoutes = constantRoutes.concat(filterAsyncRouter(deepClone(res.data)))
      this.menuRouters = deepClone(menuRoutes);

      const rewriteRoutes = filterAsyncRouter(deepClone(res.data), true)
      const asyncRoutes = filterDynamicRoutes(dynamicRoutes)
      asyncRoutes.forEach(route => { router.addRoute(route) })
      this.routes = [...constantRoutes, ...rewriteRoutes];

      this.setActiveTopMenuPath(router.currentRoute.value.path)
      return rewriteRoutes
    }
  }
})

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap: RouteItem[], type = false): RouteItem[] {
  return asyncRouterMap.filter(route => {
    route.hidden = !!route.hidden // 确保hidden属性存在且为布尔值

    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (typeof route.component === 'string') {
      const components: { [key: string]: Component | undefined } = { Layout, ParentView, InnerLink }
      const component = components[route.component]
      if (component) route.component = component
      else route.component = loadView(route.component)
    }
    if (!!route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}
/**
 * 递归过滤并处理路由子项，将所有子路由展平为一个数组，并根据父路由调整路径。
 * 如果遇到组件为 'ParentView' 的路由，会将其子路由的路径拼接父路由路径，并继续递归处理。
 * 
 * @param childrenMap 路由子项数组
 * @param lastRouter 上一级父路由（可选），用于路径拼接
 * @returns 处理后的路由子项数组
 */
function filterChildren(childrenMap: RouteItem[], lastRouter?: RouteItem): RouteItem[] {
  const children: RouteItem[] = []
  childrenMap.forEach((el) => {
    const item = { hidden: false, ...el, } // 确保hidden属性存在
    if (!!el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach((c: RouteItem) => {
          c.path = el.path + '/' + c.path
          if (c.children && c.children.length) {
            children.push(...filterChildren(c.children, c))
            return
          }
          children.push(c)
        })
        return
      }
    }
    if (lastRouter && lastRouter.path) {
      item.path = lastRouter.path + '/' + item.path
    }
    children.push(item)
  })
  return children
}

// 动态路由遍历，验证是否具备权限
function filterDynamicRoutes(routes: readonly RouteItem[]): RouteItem[] {
  const res: RouteItem[] = []
  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
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

const resolveViewKey = (path: string): string => {
  const normalizedPath = path.replace(/^\//, '')
  const moduleViewMatch = normalizedPath.match(/^modules\/([^/]+)\/view[s]?\/(.+)\.vue$/)
  if (moduleViewMatch) return `${moduleViewMatch[1]}/${moduleViewMatch[2]}`
  const hostViewMatch = normalizedPath.match(/^src\/views\/(.+)\.vue$/)
  if (hostViewMatch) return hostViewMatch[1]
  return ''
}

const loadView = (view: string): ModuleLoader => {
  const normalizedView = view.replace(/^\//, '').replace(/\.vue$/, '').replace(/\/$/, '')
  const candidates = new Set([normalizedView, `${normalizedView}/index`])

  for (const path in modules) {
    const resolvedViewKey = resolveViewKey(path)
    if (candidates.has(resolvedViewKey)) return modules[path]
  }

  return () => Promise.resolve(h('div'))
}

export default usePermissionStore
