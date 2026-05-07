import { deepClone } from '@ruoyi/core/utils'
import auth from '@ruoyi/core/plugins/auth'
import type { RouteItem } from '@ruoyi/core/types/route'
import { getRouters } from '@/api/login'
import { transformAsyncRoutes } from './routeTransformers'
import { ROUTES } from '@ruoyi/core/constant'
import { router } from './index'

export interface ResolvedRouteData {
  routeTree: RouteItem[]
  accessRoutes: RouteItem[]
}

const registeredDynamicRouteNames = new Set<string>()

export function getInitialRoutes(): RouteItem[] {
  const { staticRoutes, legacyDefaultRoutes } = collectRouteDefinitions()
  return [...staticRoutes, ...legacyDefaultRoutes]
}

export async function resolveAuthorizedRoutes(): Promise<ResolvedRouteData> {
  const constantRoutes = getInitialRoutes()
  const backendRouteTree = deepClone((await getRouters()).data || [])
  const accessDynamicRoutes = filterAuthorizedDynamicRoutes(collectRouteDefinitions().dynamicRoutes)
  const routeTree = [
    ...deepClone(constantRoutes),
    ...backendRouteTree,
    ...deepClone(accessDynamicRoutes)
  ]

  return {
    routeTree: deepClone(routeTree),
    accessRoutes: [
      ...transformAsyncRoutes(deepClone(backendRouteTree), true),
      ...deepClone(accessDynamicRoutes)
    ]
  }
}

export function registerAccessRoutes(routes: RouteItem[]) {
  routes.forEach(route => {
    if (typeof route.name === 'string' && routerHasRoute(route.name)) return
    if (!route.path.startsWith('http')) {
      routerAddRoute(route)
      if (typeof route.name === 'string') registeredDynamicRouteNames.add(route.name)
    }
  })
}

export function resetAccessRoutes() {
  registeredDynamicRouteNames.forEach(name => {
    if (routerHasRoute(name)) routerRemoveRoute(name)
  })
  registeredDynamicRouteNames.clear()
}

function collectRouteDefinitions() {
  return Object.values(ROUTES).reduce(
    (acc: { staticRoutes: RouteItem[]; dynamicRoutes: RouteItem[]; legacyDefaultRoutes: RouteItem[] }, mod: any) => {
      if (Array.isArray(mod?.staticRoutes)) acc.staticRoutes.push(...mod.staticRoutes)
      if (Array.isArray(mod?.dynamicRoutes)) acc.dynamicRoutes.push(...mod.dynamicRoutes)
      if (Array.isArray(mod?.default)) acc.legacyDefaultRoutes.push(...mod.default)
      return acc
    },
    { staticRoutes: [], dynamicRoutes: [], legacyDefaultRoutes: [] }
  )
}

function filterAuthorizedDynamicRoutes(routes: readonly RouteItem[]): RouteItem[] {
  const res: RouteItem[] = []
  routes.forEach(route => {
    let flag = false
    if (route.permissions) flag = flag || auth.hasPermiOr(route.permissions)
    if (route.roles) flag = flag || auth.hasRoleOr(route.roles)
    if (flag) res.push(route)
  })
  return res
}

function routerHasRoute(name: string) {
  return router.hasRoute(name)
}

function routerAddRoute(route: RouteItem) {
  router.addRoute(route)
}

function routerRemoveRoute(name: string) {
  router.removeRoute(name)
}
