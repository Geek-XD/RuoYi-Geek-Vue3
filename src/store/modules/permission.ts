import auth from '@/plugins/auth'
import router, { constantRoutes, dynamicRoutes } from '@/router/index'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index.vue'
import ParentView from '@/components/ParentView/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import type { Component } from 'vue'
import { RouteItem } from '@/types/route'

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../../views/**/*.vue')



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
        this.addRoutes = routes
        this.routes = [...constantRoutes, ...routes] as RouteItem[]
      },
      setDefaultRoutes(routes: RouteItem[]) {
        this.defaultRoutes = [...constantRoutes, ...routes] as RouteItem[]
      },
      setTopbarRoutes(routes: RouteItem[]) {
        this.topbarRouters = routes
      },
      setSidebarRouters(routes: RouteItem[]) {
        this.sidebarRouters = routes
      },
      generateRoutes(): Promise<RouteItem[]> {
        return new Promise(resolve => {
          // 向后端请求路由数据
          getRouters().then(res => {
            const sdata = JSON.parse(JSON.stringify(res.data))
            const rdata = JSON.parse(JSON.stringify(res.data))
            const defaultData = JSON.parse(JSON.stringify(res.data))
            const sidebarRoutes = filterAsyncRouter(sdata)
            const rewriteRoutes = filterAsyncRouter(rdata, false, true)
            const defaultRoutes = filterAsyncRouter(defaultData)
            const asyncRoutes = filterDynamicRoutes(dynamicRoutes as unknown as RouteItem[])
            asyncRoutes.forEach(route => { router.addRoute(route as unknown as RouteRecordRaw) })
            this.setRoutes(rewriteRoutes)
            this.setSidebarRouters([...constantRoutes, ...sidebarRoutes] as RouteItem[])
            this.setDefaultRoutes(sidebarRoutes)
            this.setTopbarRoutes([...constantRoutes, ...defaultRoutes] as RouteItem[])
            resolve(rewriteRoutes)
          })
        })
      }
    }
  })

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap: RouteItem[], lastRouter: RouteItem | false = false, type = false): RouteItem[] {
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
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap: RouteItem[], lastRouter: RouteItem | false = false): RouteItem[] {
  const children: RouteItem[] = []
  childrenMap.forEach((el) => {
    const item = { ...el, hidden: false } as RouteItem // 确保hidden属性存在
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
export function filterDynamicRoutes(routes: RouteItem[]): RouteItem[] {
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

export const loadView = (view: string): (() => Promise<Component>) => {
  let res: (() => Promise<Component>) | undefined
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0]
    if (dir === view) {
      res = modules[path] as () => Promise<Component>
    }
  }
  return res || (() => Promise.resolve({} as Component))
}

export default usePermissionStore
