import auth from '@ruoyi/core/plugins/auth'
import { router } from '@/router'
import ParentView from '@/components/ParentView/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'
import { defineStore } from 'pinia'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { RouteItem } from '@ruoyi/core/types/route'
import { constantRoutes } from '@/router/routes/staticRoutes'
import { dynamicRoutes } from '@/router/routes/asyncRoutes'
import { getInstalledModuleManifest, hasInstalledModule, isRemoteModule, resolveRegisteredModulePage, resolveRegisteredModuleView } from '@/modules/registry'
import { deepClone } from '@/utils'
import { getRouters } from '@/api/login'

const Layout = () => import('@/layout/index.vue')
const ModuleUnavailablePage = () => import('@/views/error/module-unavailable.vue')
const RemoteModulePage = () => import('@/modules/RemoteModulePage.vue')

// 兼容壳应用内的传统 views 页面
const appViewModules = import.meta.glob(['/src/views/**/*.vue', '/src/view/**/*.vue'])
const hostViewPrefixes = new Set(
  Object.keys(appViewModules)
    .map((path) => {
      if (path.includes('views/')) {
        return path.split('views/')[1].split('/')[0]
      }
      if (path.includes('view/')) {
        return path.split('view/')[1].split('/')[0]
      }
      return ''
    })
    .filter(Boolean)
)

// 定义 store 状态接口
interface PermissionState {
  routes: RouteItem[]
  addRoutes: RouteItem[]
  defaultRoutes: RouteItem[]
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
      setTopbarRoutes(routes: RouteItem[]) {
        this.topbarRouters = deepClone(routes);
      },
      /** 设置侧边栏路由 */
      setSidebarRouters(routes: RouteItem[]) {
        this.sidebarRouters = deepClone(routes);
      },
      generateRoutes(): Promise<RouteItem[]> {
        return new Promise(resolve => {
          // 向后端请求路由数据
          getRouters().then(res => {
            const sidebarRoutes = constantRoutes.concat(filterAsyncRouter(deepClone(res.data)))
            const rewriteRoutes = filterAsyncRouter(deepClone(res.data), true)
            const asyncRoutes = filterDynamicRoutes(dynamicRoutes)
            asyncRoutes.forEach(route => { router.addRoute(route as RouteRecordRaw) })
            this.setRoutes(rewriteRoutes)
            this.setSidebarRouters(sidebarRoutes)
            this.setDefaultRoutes(sidebarRoutes)
            this.setTopbarRoutes(sidebarRoutes)
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
          route.component = loadView(route.component, route)
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

const loadView = (view: string, route?: RouteItem): Component | (() => Promise<Component>) => {
  const appView = resolveAppView(view)
  if (appView) {
    return appView
  }

  if (isHostViewNamespace(view)) {
    return () => Promise.resolve({} as Component)
  }

  const resolvedModulePage = resolveRegisteredModulePage(view)
  if (resolvedModulePage) {
    const manifest = getInstalledModuleManifest(resolvedModulePage.moduleKey)
    if (route?.meta) {
      route.meta.moduleKey = resolvedModulePage.moduleKey
      route.meta.routeKey = resolvedModulePage.routeKey
      route.meta.moduleName = manifest?.name || resolvedModulePage.moduleKey
    } else if (route) {
      route.meta = {
        moduleKey: resolvedModulePage.moduleKey,
        routeKey: resolvedModulePage.routeKey,
        moduleName: manifest?.name || resolvedModulePage.moduleKey
      }
    }
    if (!hasInstalledModule(resolvedModulePage.moduleKey)) {
      return ModuleUnavailablePage
    }
    if (isRemoteModule(resolvedModulePage.moduleKey)) {
      return RemoteModulePage
    }
  }

  const registeredModuleView = resolveRegisteredModuleView(view)
  if (registeredModuleView) {
    return registeredModuleView
  }

  if (resolvedModulePage && !registeredModuleView) {
    if (isRemoteModule(resolvedModulePage.moduleKey)) {
      return RemoteModulePage
    }
    return ModuleUnavailablePage
  }

  return () => Promise.resolve({} as Component)
}

function resolveAppView(view: string) {
  for (const path in appViewModules) {
    let dir = ''
    if (path.includes('views/')) {
      dir += path.split('views/')[1].split('.vue')[0]
    } else if (path.includes('view/')) {
      dir += path.split('view/')[1].split('.vue')[0]
    }
    if (dir === view) {
      return appViewModules[path] as () => Promise<Component>
    }
  }
  return undefined
}

function isHostViewNamespace(view: string) {
  const [prefix] = view.split('/')
  return Boolean(prefix) && hostViewPrefixes.has(prefix)
}

export default usePermissionStore
