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

export interface FrontendModuleRuntime {
  routeBase: string
  homeRoute: string
  demoRoute?: string
  standaloneRoutes: RouteItem[]
  resolveRoutePath: (routePath?: string) => string
}

export interface FrontendModule {
  manifest: FrontendModuleManifest
  resolveView?: (view: string) => (() => Promise<Component>) | undefined
  runtime?: FrontendModuleRuntime
}

export type FrontendModuleRuntimeMode = 'local' | 'remote'

export interface FrontendRemoteModuleDefinition {
  entry: string
  name?: string
  props?: Record<string, unknown>
}

export interface RegisteredFrontendModule extends FrontendModule {
  mode: FrontendModuleRuntimeMode
  remote?: FrontendRemoteModuleDefinition
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

export interface DefineAppModuleOptions extends Omit<DefineFrontendModuleOptions, 'version'> {
  version?: string
  homeRoute?: string
  demoRoute?: string
}

export interface CreateModuleRoutesOptions {
  routeBase?: string
}

interface DefineRegisteredFrontendModuleOptions {
  module: FrontendModule
  mode?: FrontendModuleRuntimeMode
  remote?: FrontendRemoteModuleDefinition
}

interface DefineInstalledModulesOptions {
  env?: Record<string, string | undefined>
  remoteNamePrefix?: string
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

function joinRoutePath(basePath: string, routePath: string) {
  return `${basePath.replace(/\/$/, '')}/${routePath.replace(/^\//, '')}`
}

function collectModuleRouteAliases(
  routeBase: string,
  pageRoutes: FrontendModulePageRoute[] = [],
  parentPath?: string
) {
  const aliases: Record<string, string> = {}

  pageRoutes.forEach((route) => {
    const canonicalPath = joinRoutePath(parentPath || routeBase, route.path)
    const legacyPath = `/${route.meta.view.replace(/^\//, '')}`

    if (legacyPath !== canonicalPath) {
      aliases[legacyPath] = canonicalPath
    }

    if (route.children?.length) {
      Object.assign(aliases, collectModuleRouteAliases(routeBase, route.children, canonicalPath))
    }
  })

  return aliases
}

function splitRouteLocation(routePath: string) {
  const queryIndex = routePath.indexOf('?')
  const hashIndex = routePath.indexOf('#')
  let suffixIndex = routePath.length

  if (queryIndex !== -1) {
    suffixIndex = queryIndex
  }

  if (hashIndex !== -1 && hashIndex < suffixIndex) {
    suffixIndex = hashIndex
  }

  return {
    pathname: routePath.slice(0, suffixIndex),
    suffix: routePath.slice(suffixIndex)
  }
}

function createModuleRoutePathResolver(
  routeBase: string,
  pageRoutes: FrontendModulePageRoute[] = [],
  fallbackRoute: string
) {
  const normalizedRouteBase = routeBase.replace(/\/$/, '')
  const routeAliases = collectModuleRouteAliases(normalizedRouteBase, pageRoutes)

  return (routePath?: string) => {
    if (!routePath) {
      return fallbackRoute
    }

    const { pathname, suffix } = splitRouteLocation(routePath)
    const normalizedPath = routeAliases[pathname] || pathname

    if (normalizedPath !== normalizedRouteBase && !normalizedPath.startsWith(`${normalizedRouteBase}/`)) {
      return fallbackRoute
    }

    return `${normalizedPath}${suffix}`
  }
}

function createFrontendModuleRuntime(
  moduleKey: string,
  routeBase: string,
  pageRoutes: FrontendModulePageRoute[] = [],
  resolveView: ((view: string) => (() => Promise<Component>) | undefined) | undefined,
  homeRoute?: string,
  demoRoute?: string
) {
  if (!resolveView) {
    return undefined
  }

  const normalizedRouteBase = routeBase.replace(/\/$/, '')
  const normalizedHomeRoute = homeRoute || normalizedRouteBase
  const fallbackRoute = demoRoute || normalizedHomeRoute

  return {
    routeBase: normalizedRouteBase,
    homeRoute: normalizedHomeRoute,
    demoRoute,
    standaloneRoutes: createModuleRoutesFromPages(moduleKey, pageRoutes, resolveView, {
      routeBase: normalizedRouteBase
    }),
    resolveRoutePath: createModuleRoutePathResolver(normalizedRouteBase, pageRoutes, fallbackRoute)
  }
}

function defineFrontendModule(options: DefineFrontendModuleOptions): FrontendModule {
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

function defineRegisteredFrontendModule(options: DefineRegisteredFrontendModuleOptions): RegisteredFrontendModule {
  return {
    manifest: options.module.manifest,
    resolveView: options.mode === 'remote' ? undefined : options.module.resolveView,
    runtime: options.module.runtime,
    mode: options.mode || 'local',
    remote: options.mode === 'remote' ? options.remote : undefined
  }
}

function defineLocalFrontendModule(module: FrontendModule): RegisteredFrontendModule {
  return defineRegisteredFrontendModule({
    module,
    mode: 'local'
  })
}

function defineRemoteFrontendModule(module: FrontendModule, remote: FrontendRemoteModuleDefinition): RegisteredFrontendModule {
  return defineRegisteredFrontendModule({
    module,
    mode: 'remote',
    remote
  })
}

function readFrontendModuleEnv(
  env: Record<string, string | undefined>,
  moduleKey: string,
  suffix: 'MODE' | 'ENTRY'
) {
  const normalizedModuleKey = moduleKey.replace(/-/g, '_').toUpperCase()
  return env[`VITE_MODULE_${normalizedModuleKey}_${suffix}`]
}

function defineInstalledModule(
  module: FrontendModule,
  options: DefineInstalledModulesOptions = {}
): RegisteredFrontendModule {
  const env = options.env || {}
  const remoteNamePrefix = options.remoteNamePrefix || 'ruoyi-'
  const mode = readFrontendModuleEnv(env, module.manifest.key, 'MODE')
  const entry = readFrontendModuleEnv(env, module.manifest.key, 'ENTRY')

  if (mode === 'remote' && entry) {
    return defineRemoteFrontendModule(module, {
      entry,
      name: `${remoteNamePrefix}${module.manifest.key}`,
      props: {
        routeBase: module.manifest.routeBase
      }
    })
  }

  return defineLocalFrontendModule(module)
}

function resolveAppModuleEnv() {
  return import.meta.env as Record<string, string | undefined>
}

// 应用层唯一需要关心的模块声明入口：本地 / qiankun 的兼容注册由内部统一处理。
export function defineAppModule(options: DefineAppModuleOptions): RegisteredFrontendModule {
  const routeBase = options.routeBase || `/${options.key}`
  const module = defineFrontendModule({
    ...options,
    version: options.version || '1.0.0',
    routeBase
  })

  module.runtime = createFrontendModuleRuntime(
    options.key,
    routeBase,
    options.pageRoutes,
    module.resolveView,
    options.homeRoute,
    options.demoRoute
  )

  return defineInstalledModule(module, {
    env: resolveAppModuleEnv()
  })
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