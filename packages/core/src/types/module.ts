import type { Component } from 'vue'
import type { RouteItem } from './route'

export interface FrontendModulePageDefinition {
  routeKey: string
  title: string
  view: string
}

export interface FrontendModuleManifest {
  key: string
  name: string
  description?: string
  version: string
  routeBase?: string
  capabilities?: string[]
  pages: FrontendModulePageDefinition[]
}

export interface FrontendModule {
  manifest: FrontendModuleManifest
  resolveView?: (view: string) => (() => Promise<Component>) | undefined
}

export type FrontendModulePageRoute = RouteItem & {
  meta: NonNullable<RouteItem['meta']> & {
    routeKey: string
    view: string
    capability?: string
    title: string
  }
  children?: FrontendModulePageRoute[]
}

export interface DefineFrontendModuleOptions {
  key: string
  name: string
  description?: string
  version: string
  routeBase?: string
  pageRoutes?: FrontendModulePageRoute[]
  viewModules?: Record<string, unknown>
  resolveView?: (view: string) => (() => Promise<Component>) | undefined
}

export interface CreateModuleRoutesOptions {
  routeBase?: string
}

export interface ResolvedModuleView {
  moduleKey: string
  routeKey: string
  view: string
}

export function parseModuleView(view: string): ResolvedModuleView | undefined {
  if (!view) {
    return undefined
  }

  if (view.includes(':')) {
    const [moduleKey, routeKey] = view.split(':')
    if (!moduleKey || !routeKey) {
      return undefined
    }
    return {
      moduleKey,
      routeKey,
      view
    }
  }

  const segments = view.split('/')
  if (segments.length < 2) {
    return undefined
  }

  const [moduleKey, ...pathSegments] = segments
  return {
    moduleKey,
    routeKey: pathSegments.join('.'),
    view
  }
}

export function createModuleViewResolver<T extends Record<string, unknown>>(moduleKey: string, viewModules: T) {
  return (view: string) => {
    if (view !== moduleKey && !view.startsWith(`${moduleKey}/`)) {
      return undefined
    }
    const matchedPath = Object.keys(viewModules).find((path) => {
      const normalizedPath = `${moduleKey}/${path.split('./view/')[1].split('.vue')[0]}`
      return normalizedPath === view
    })
    return matchedPath ? viewModules[matchedPath] as (() => Promise<Component>) : undefined
  }
}

function collectModulePages(pageRoutes: FrontendModulePageRoute[] = []): FrontendModulePageDefinition[] {
  const pages: FrontendModulePageDefinition[] = []
  const walk = (routes: FrontendModulePageRoute[]) => {
    routes.forEach((route) => {
      const routeKey = route.meta?.routeKey
      const view = route.meta?.view
      const title = typeof route.meta?.title === 'string' ? route.meta.title : undefined
      if (routeKey && view && title) {
        pages.push({ routeKey, view, title })
      }
      if (route.children?.length) {
        walk(route.children)
      }
    })
  }
  walk(pageRoutes)
  return pages
}

function collectModuleCapabilities(pageRoutes: FrontendModulePageRoute[] = []) {
  return collectModulePages(pageRoutes).map((page) => `${page.view.split('/')[0]}.${page.routeKey}`)
}

export function defineFrontendModule(options: DefineFrontendModuleOptions): FrontendModule {
  const pageRoutes = options.pageRoutes || []
  const pages = collectModulePages(pageRoutes)
  const capabilities = collectModuleCapabilities(pageRoutes)
  return {
    manifest: {
      key: options.key,
      name: options.name,
      description: options.description,
      version: options.version,
      routeBase: options.routeBase,
      capabilities,
      pages
    },
    resolveView: options.resolveView || (options.viewModules ? createModuleViewResolver(options.key, options.viewModules) : undefined)
  }
}

function resolvePageRouteComponent(
  moduleKey: string,
  route: FrontendModulePageRoute,
  resolveView: (view: string) => (() => Promise<Component>) | undefined
): RouteItem {
  const component = resolveView(route.meta.view)
  if (!component) {
    throw new Error(`Cannot resolve module view for ${moduleKey}:${route.meta.routeKey}`)
  }
  const { children, ...routeItem } = route
  const pageChildren = children as FrontendModulePageRoute[] | undefined
  return {
    ...routeItem,
    component,
    children: pageChildren?.map((child) => resolvePageRouteComponent(moduleKey, child, resolveView))
  }
}

export function createModuleRoutesFromPages(
  moduleKey: string,
  pageRoutes: FrontendModulePageRoute[],
  resolveView: (view: string) => (() => Promise<Component>) | undefined,
  options: CreateModuleRoutesOptions = {}
): RouteItem[] {
  const routeBase = options.routeBase ?? `/${moduleKey}`
  const childRoutes = pageRoutes.map((route) => resolvePageRouteComponent(moduleKey, route, resolveView))

  return childRoutes.map((route) => ({
    ...route,
    path: `${routeBase.replace(/\/$/, '')}/${route.path.replace(/^\//, '')}`
  }))
}