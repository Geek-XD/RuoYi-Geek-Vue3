import { h, type Component } from 'vue'
import { VIEWS } from '@ruoyi/core/constant'
import { RouteItem } from '@ruoyi/core/types/route'
import Layout from '@/layout/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'
import ParentView from '@/components/ParentView/index.vue'

/**
 * 遍历将路由的组件属性转换为真实组件
 */
export function transformAsyncRoutes(asyncRouterMap: RouteItem[], type = false): RouteItem[] {
  return asyncRouterMap.filter(route => {
    route.hidden = !!route.hidden

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
      route.children = transformAsyncRoutes(route.children, type)
    } else {
      delete route.children
      delete route.redirect
    }
    return true
  })
}

function filterChildren(childrenMap: RouteItem[], lastRouter?: RouteItem): RouteItem[] {
  const children: RouteItem[] = []
  childrenMap.forEach((el) => {
    const item = { hidden: false, ...el }
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
