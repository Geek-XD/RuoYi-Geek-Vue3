import { deepClone } from '@ruoyi/core/utils'
import type { RouteItem } from '@ruoyi/core/types/route'
import { ROUTES } from '@ruoyi/core/constant'
import { router } from './index'

function createDynamicRouteName(routeKey: string) {
  return `__dynamic__${routeKey.replace(/[^a-zA-Z0-9]/g, '_')}`
}

function ensureDynamicRouteNames(routes: RouteItem[], parentKey = '') {
  routes.forEach((route, index) => {
    const currentKey = `${parentKey}/${route.path || index}`
    if (!route.name) route.name = createDynamicRouteName(currentKey)
    if (route.children?.length) ensureDynamicRouteNames(route.children, currentKey)
  })
}

/**
 * 获取初始路由（应用启动时注册）
 * 只包含无权限要求的公共路由
 */
export function getInitialRoutes(): RouteItem[] {
  const localRoutes = Object.values(ROUTES).reduce(
    (acc: RouteItem[], mod: any) => {
      if (Array.isArray(mod?.default)) acc.push(...mod.default)
      return acc
    },
    []
  )
  return localRoutes.filter(route => !route.permissions && !route.roles)
}

/**
 * 注册动态路由
 * 打上 isDynamic 标记，用于后续重置
 */
export function registerAccessRoutes(routes: RouteItem[]) {
  ensureDynamicRouteNames(routes)
  routes.forEach(route => {
    if (typeof route.name === 'string' && router.hasRoute(route.name)) return
    if (!route.path.startsWith('http')) {
      route.meta = { ...route.meta, isDynamic: true }
      router.addRoute(route)
    }
  })
}

/**
 * 重置动态路由
 * 通过 isDynamic 标记过滤并移除
 */
export function resetAccessRoutes() {
  router.getRoutes()
    .filter(route => route.meta?.isDynamic)
    .forEach(route => {
      if (route.name && router.hasRoute(route.name)) router.removeRoute(route.name)
    })
}
