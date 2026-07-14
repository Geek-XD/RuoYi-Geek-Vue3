import type { RouteItem } from '@ruoyi/core/types/route'
import { getNormalPath } from '@ruoyi/core/utils/ruoyi'
import { isHttp } from '@ruoyi/core/utils/validate'
import { deepClone } from '@ruoyi/core/utils'

/** 构建菜单路由 */
export function buildMenuRoutes(routes: RouteItem[]): RouteItem[] {
  return routes.map(route => {
    const currentRoute: RouteItem = { ...route, hidden: !!route.hidden }
    if (route.children?.length) currentRoute.children = buildMenuRoutes(route.children)
    else {
      delete currentRoute.children
      delete currentRoute.redirect
    }
    return currentRoute
  })
}

/** 构建页面路由（扁平化） */
export function buildPageRoutes(routes: RouteItem[]): RouteItem[] {
  return routes.map(route => {
    const currentRoute: RouteItem = { ...route, hidden: !!route.hidden }
    if (route.children?.length) currentRoute.children = buildPageRoutes(flattenChildren(route.children))
    else {
      delete currentRoute.children
      delete currentRoute.redirect
    }
    return currentRoute
  })
}

/** 构建混合侧边栏菜单 */
export function buildMixSidebarMenus(routes: RouteItem[], activePath: string): RouteItem[] {
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

/** 构建顶部菜单 */
export function buildTopbarMenus(routes: RouteItem[]): RouteItem[] {
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

function flattenChildren(childrenMap: RouteItem[], lastRoute?: RouteItem): RouteItem[] {
  const children: RouteItem[] = []
  childrenMap.forEach((el) => {
    const item: RouteItem = { hidden: false, ...el }
    if (el.children?.length && !lastRoute) {
      el.children.forEach((child: RouteItem) => {
        const currentChild: RouteItem = { ...child, path: `${el.path}/${child.path}` }
        if (currentChild.children?.length) children.push(...flattenChildren(currentChild.children, currentChild))
        else children.push(currentChild)
      })
      return
    }
    if (lastRoute?.path) item.path = `${lastRoute.path}/${item.path}`
    children.push(item)
  })
  return children
}

const getVisibleChildren = (route: RouteItem) => (route.children || []).filter((item): item is RouteItem => item.hidden !== true)

function resolveMenuPath(path: string, parentPath?: string): string {
  if (isHttp(path)) return path
  if (!parentPath || path.startsWith('/')) return getNormalPath(path)
  return getNormalPath(`${parentPath}/${path}`)
}

function normalizeTopbarRoute(route: RouteItem, parentPath?: string): RouteItem {
  const currentPath = resolveMenuPath(route.path, parentPath)
  const currentRoute: RouteItem = {
    ...route,
    path: currentPath,
    parentPath,
    meta: {
      ...route.meta,
      icon: route.meta?.icon || 'dashboard'
    }
  }
  const children = getVisibleChildren(route)
  if (children.length) currentRoute.children = children.map(child => normalizeTopbarRoute(child, currentPath))
  else delete currentRoute.children
  return currentRoute
}

const matchesMenuPath = (activePath: string, topPath: string) => activePath === topPath || activePath.startsWith(`${topPath}/`)