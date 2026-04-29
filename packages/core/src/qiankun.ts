import type { App } from 'vue'
import { qiankunWindow, renderWithQiankun } from 'vite-plugin-qiankun/dist/helper'
import { createWebHistory, type Router, type RouterHistory } from 'vue-router'
import { defineStandaloneModuleApp } from './standalone'
import type { RegisteredFrontendModule } from './types/module'

export interface QiankunModuleProps {
  container?: Element | ShadowRoot
  routePath?: string
  onNavigate?: (path: string) => void
}

export interface AccessControlledQiankunModuleProps extends QiankunModuleProps {
  permissions?: string[]
  roles?: string[]
}

type QiankunMountTarget = string | Element

export interface DefineQiankunModuleEntryOptions<TApp, TProps extends QiankunModuleProps = QiankunModuleProps> {
  createApp: (context: { mountTarget: QiankunMountTarget; props: TProps }) => TApp
  getRouter: (app: TApp) => Router
  syncRoute?: (router: Router, props: TProps) => Promise<unknown> | void
  unmountApp: (app: TApp, props: TProps) => void
  getDemoProps?: () => TProps
  resolveMountTarget?: (container?: Element | ShadowRoot) => QiankunMountTarget
}

type StandaloneQiankunModuleApp = { app: App, router: Router }
export interface DefineAppModuleQiankunEntryOptions<TProps extends AccessControlledQiankunModuleProps = AccessControlledQiankunModuleProps> {
  module: Pick<RegisteredFrontendModule, 'manifest' | 'runtime'>
  createHistory?: () => RouterHistory
  resolvePermissions?: (props: TProps) => string[]
  resolveRoles?: (props: TProps) => string[]
  setup?: (context: { app: App; router: Router; props: TProps }) => void
  unmountApp?: (context: { app: StandaloneQiankunModuleApp; props: TProps }) => void
}

function defaultResolveMountTarget(container?: Element | ShadowRoot): QiankunMountTarget {
  const mountTarget = container?.querySelector('#app')
  return mountTarget instanceof Element ? mountTarget : '#app'
}

export function defineQiankunModuleEntry<TApp, TProps extends QiankunModuleProps = QiankunModuleProps>(
  options: DefineQiankunModuleEntryOptions<TApp, TProps>
) {
  let moduleApp: TApp | undefined
  let removeRouteSyncGuard: (() => void) | undefined
  const resolveMountTarget = (container?: Element | ShadowRoot) => (options.resolveMountTarget || defaultResolveMountTarget)(container)

  function render(props: TProps = {} as TProps) {
    const mountTarget = (options.resolveMountTarget || defaultResolveMountTarget)(props.container)
    if (!moduleApp) moduleApp = options.createApp({ mountTarget, props })
    const router = options.getRouter(moduleApp)
    removeRouteSyncGuard?.()
    removeRouteSyncGuard = router.afterEach((to) => {
      props.onNavigate?.(to.fullPath)
    })
    void options.syncRoute?.(router, props)
    return moduleApp
  }

  renderWithQiankun({
    bootstrap() {
      return Promise.resolve()
    },
    mount(props: unknown) {
      render((props || {}) as TProps)
    },
    update(props: unknown) {
      render((props || {}) as TProps)
    },
    unmount(props: unknown) {
      if (!moduleApp) return
      const nextProps = (props || {}) as TProps
      removeRouteSyncGuard?.()
      removeRouteSyncGuard = undefined
      options.unmountApp(moduleApp, nextProps)
      const mountTarget = resolveMountTarget(nextProps.container)
      if (mountTarget instanceof Element) {
        mountTarget.innerHTML = ''
      }
      moduleApp = undefined
    }
  })

  if (!qiankunWindow.__POWERED_BY_QIANKUN__ && options.getDemoProps) render(options.getDemoProps())
  return { render }
}

export function defineAppModuleQiankunEntry<TProps extends AccessControlledQiankunModuleProps>(
  options: DefineAppModuleQiankunEntryOptions<TProps>
) {
  const runtime = options.module.runtime
  if (!runtime) throw new Error(`App module runtime is not available for ${options.module.manifest.key}`)
  const moduleRuntime = runtime
  const createModuleStandaloneApp = defineStandaloneModuleApp({
    routes: moduleRuntime.standaloneRoutes,
    homeRoute: moduleRuntime.homeRoute
  })

  function resolveStandaloneRoutePath() {
    if (typeof window === 'undefined') return moduleRuntime.demoRoute || moduleRuntime.homeRoute
    return moduleRuntime.resolveRoutePath(`${window.location.pathname}${window.location.search}${window.location.hash}`)
  }

  return defineQiankunModuleEntry<StandaloneQiankunModuleApp, TProps>({
    createApp: ({ mountTarget, props }) => createModuleStandaloneApp({
      mount: mountTarget,
      permissions: options.resolvePermissions ? options.resolvePermissions(props) : props.permissions || [],
      roles: options.resolveRoles ? options.resolveRoles(props) : props.roles || [],
      history: (options.createHistory || createWebHistory)(),
      setup: ({ app, router }) => {
        options.setup?.({ app, router, props })
      }
    }),
    getRouter: (app) => app.router,
    syncRoute: (router, props) => {
      const targetRoute = runtime.resolveRoutePath(props.routePath)
      if (router.currentRoute.value.fullPath === targetRoute) return Promise.resolve()
      return router.replace(targetRoute)
    },
    unmountApp: (app, props) => {
      options.unmountApp?.({ app, props })
      app.app.unmount()
    },
    getDemoProps: () => ({
      routePath: resolveStandaloneRoutePath()
    }) as TProps
  })
}