import { deepClone } from '@ruoyi/core/utils'
import { hasAnyPermission, hasAnyRole } from '@ruoyi/core/utils/permission'
import useUserStore from '@ruoyi/core/store/modules/user'
import type { RouteItem } from '@ruoyi/core/types/route'
import { getRouters } from '@ruoyi/core/api/routes'
import { transformAsyncRoutes } from './routeTransformers'
import { ROUTES } from '@ruoyi/core/constant'
import { router } from './index'

export interface ResolvedRouteData {
  routeTree: RouteItem[]
  accessRoutes: RouteItem[]
}

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
 * 收集所有本地路由定义
 * 不区分 static 和 dynamic，统一收集后再根据权限过滤
 */
function collectLocalRoutes(): RouteItem[] {
  return Object.values(ROUTES).reduce(
    (acc: RouteItem[], mod: any) => {
      if (Array.isArray(mod?.default)) acc.push(...mod.default)
      return acc
    },
    []
  )
}

/**
 * 根据权限过滤路由
 * 没有 permissions 和 roles 的路由视为公共路由，直接通过
 */
function filterAuthorizedRoutes(routes: RouteItem[]): RouteItem[] {
  return routes.filter(route => {
    // 没有权限要求的路由，直接通过
    if (!route.permissions && !route.roles) return true
    
    // 有权限要求的路由，检查权限
    const userStore = useUserStore()
    let hasPermission = false
    if (route.permissions) hasPermission = hasPermission || hasAnyPermission(userStore.permissions, route.permissions)
    if (route.roles) hasPermission = hasPermission || hasAnyRole(userStore.roles, route.roles)
    return hasPermission
  })
}

/**
 * 获取初始路由（应用启动时注册）
 * 只包含无权限要求的公共路由
 */
export function getInitialRoutes(): RouteItem[] {
  const localRoutes = collectLocalRoutes()
  return localRoutes.filter(route => !route.permissions && !route.roles)
}

/**
 * 解析授权路由（登录后调用）
 * 包含：本地路由（权限过滤后） + 后端路由
 */
export async function resolveAuthorizedRoutes(): Promise<ResolvedRouteData> {
  const localRoutes = collectLocalRoutes()
  const backendRouteTree = deepClone((await getRouters()).data || [])
  
  // 过滤本地路由（有权限要求的需要验证）
  const authorizedLocalRoutes = filterAuthorizedRoutes(localRoutes)
  
  const routeTree = [
    ...deepClone(authorizedLocalRoutes),
    ...backendRouteTree
  ]

  return {
    routeTree: deepClone(routeTree),
    accessRoutes: [
      ...transformAsyncRoutes(deepClone(backendRouteTree), true),
      ...deepClone(authorizedLocalRoutes).filter(route => route.permissions || route.roles)
    ]
  }
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
