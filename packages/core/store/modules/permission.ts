import auth from '@ruoyi/core/plugins/auth'
import { router } from '../../router'
import Layout from '@/layout/index.vue'
import ParentView from '@/components/ParentView/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'
import { defineStore } from 'pinia'
import type { Component } from 'vue'
import { RouteItem } from '@ruoyi/core/types/route'
import { constantRoutes } from '../../router/routes/staticRoutes'
import { dynamicRoutes } from '../../router/routes/asyncRoutes'
import { deepClone } from '@ruoyi/core/utils'
import { getNormalPath } from '@ruoyi/core/utils/ruoyi'
import { isHttp } from '@ruoyi/core/utils/validate'
import { getRouters } from '@/api/login'

// 从工作区根目录收集宿主页面与业务模块页面。
type ModuleLoader = () => Promise<Component>
const modules: Record<string, ModuleLoader> = import.meta.glob([
  '/src/views/**/*.vue',
  '/modules/**/view/**/*.vue',
  '/modules/**/views/**/*.vue'
])

// 定义 store 状态接口
interface PermissionState {
  routes: RouteItem[]
  addRoutes: RouteItem[]
  defaultRoutes: RouteItem[]
  menuRouters: RouteItem[]
  topbarRouters: RouteItem[]
  sidebarRouters: RouteItem[]
}

/**
 * 权限管理模块
 * 
 * 路由生成说明：
 * 1. generateRoutes方法负责生成所有路由：
 *    - 从后端获取动态路由数据
 *    - 处理动态路由数据（过滤、转换组件等）
 *    - 根据设置决定TopNav菜单的数据来源
 * 
 * 2. TopNav菜单数据生成规则：
 *    - 启用TopNav导入本地路由：constantRoutes + defaultRoutes
 *    - 关闭TopNav导入本地路由：仅使用defaultRoutes
 *    - 通过settingsStore.topNavMixMenu控制
 */

const usePermissionStore = defineStore(
  'permission',
  {
    state: (): PermissionState => ({
      routes: [],
      addRoutes: [],
      defaultRoutes: [],
      menuRouters: [],
      topbarRouters: [],
      sidebarRouters: []
    }),
    actions: {
      setRoutes(routes: RouteItem[]) {
        this.routes = [...constantRoutes, ...routes];
      },
      setDefaultRoutes(routes: RouteItem[]) {
        this.defaultRoutes = deepClone(routes);
      },
      setMenuRouters(routes: RouteItem[]) {
        this.menuRouters = deepClone(routes)
      },
      setTopbarRoutes(routes: RouteItem[]) {
        this.topbarRouters = buildTopbarMenus(routes)
      },
      /** 设置侧边栏路由 */
      setSidebarRouters(routes: RouteItem[]) {
        this.sidebarRouters = deepClone(routes);
      },
      setSidebarRoutersByTopMenu(activePath: string) {
        const routes = buildSidebarMenus(this.menuRouters, activePath)
        this.setSidebarRouters(routes)
        return routes
      },
      generateRoutes(): Promise<RouteItem[]> {
        return new Promise(resolve => {
          // 向后端请求路由数据
          getRouters().then(res => {
            const menuRoutes = constantRoutes.concat(filterAsyncRouter(deepClone(res.data)))
            const rewriteRoutes = filterAsyncRouter(deepClone(res.data), true)
            const asyncRoutes = filterDynamicRoutes(dynamicRoutes)
            asyncRoutes.forEach(route => { router.addRoute(route) })
            this.setRoutes(rewriteRoutes)
            this.setMenuRouters(menuRoutes)
            this.setSidebarRouters(menuRoutes)
            this.setDefaultRoutes(menuRoutes)
            this.setTopbarRoutes(menuRoutes)
            resolve(rewriteRoutes)
          })
        })
      }
    }
  })

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap: RouteItem[], type = false): RouteItem[] {
  return asyncRouterMap.filter(route => {
    // 确保route有hidden属性
    if (route.hidden === undefined) {
      route.hidden = false;
    }

    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (typeof route.component === 'string') {
        if (route.component === 'Layout') {
          route.component = Layout
        } else if (route.component === 'ParentView') {
          route.component = ParentView
        } else if (route.component === 'InnerLink') {
          route.component = InnerLink
        } else {
          route.component = loadView(route.component)
        }
      }
    }
    if (route.children != null && route.children && route.children.length) {
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
    const item = { ...el, hidden: false } // 确保hidden属性存在
    if (el.children && el.children.length) {
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
  } as RouteItem

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
function buildSidebarMenus(routes: RouteItem[], activePath: string): RouteItem[] {
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
    if (candidates.has(resolvedViewKey)) {
      return modules[path]
    }
  }

  return () => Promise.resolve({} as Component)
}

export default usePermissionStore
