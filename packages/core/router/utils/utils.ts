import { RouteItem } from '@ruoyi/core/types/route'
import Layout from '@/layout/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'
import ParentView from '@/components/ParentView/index.vue'
import NProgress from 'nprogress'
import { h, type Component } from 'vue'
import { VIEWS } from '@ruoyi/core/constant'

/** 顶部进度条配置 */
export const configureNProgress = () => {
  NProgress.configure({
    easing: 'ease',
    speed: 600,
    showSpinner: false,
    trickleSpeed: 200,
    parent: 'body'
  })
}

// 遍历后台传来的路由字符串，转换为组件对象
export function filterAsyncRouter(asyncRouterMap: RouteItem[], type = false): RouteItem[] {
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
    if (!!el.children && el.children.length && !lastRouter) {
      el.children.forEach((c: RouteItem) => {
        c.path = el.path + '/' + c.path
        if (c.children && c.children.length) children.push(...filterChildren(c.children, c))
        else children.push(c)
      })
      return
    }
    if (lastRouter && lastRouter.path) {
      item.path = lastRouter.path + '/' + item.path
    }
    children.push(item)
  })
  return children
}

const loadView = (view: string) => {
  const normalizedView = view.replace(/^\//, '').replace(/\.vue$/, '').replace(/\/$/, '')
  const candidates = new Set([normalizedView, `${normalizedView}/index`])

  for (const path in VIEWS) {
    const resolvedViewKey = resolveViewKey(path)
    if (candidates.has(resolvedViewKey)) return VIEWS[path]
  }

  return () => Promise.resolve(h('div'))
}

const resolveViewKey = (path: string): string => {
  const normalizedPath = path.replace(/^\//, '')
  const moduleViewMatch = normalizedPath.match(/^modules\/([^/]+)\/view[s]?\/(.+)\.vue$/)
  if (moduleViewMatch) return `${moduleViewMatch[1]}/${moduleViewMatch[2]}`
  const hostViewMatch = normalizedPath.match(/^src\/views\/(.+)\.vue$/)
  if (hostViewMatch) return hostViewMatch[1]
  return ''
}
