import { createApp, defineComponent, h, onMounted } from 'vue'
import type { Component, Plugin } from 'vue'
import { RouterView, createRouter, createWebHashHistory, createWebHistory, useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw, RouteRecordRaw, Router, RouterHistory, RouterScrollBehavior } from 'vue-router'
import directive from './directive'
import plugins from './plugins'
import store from './store'
import { installAuthRuntime, installRequestRuntime, installTabRuntime } from './runtime'
import type { RouteItem } from './types/route'
import { useDict } from './utils/dict'
import { download } from './utils/request'
import { addDateRange, handleTree, parseTime, resetForm, selectDictLabel, selectDictLabels } from './utils/ruoyi'

const StandaloneRoot = defineComponent({
  name: 'CoreStandaloneRoot',
  setup() {
    return () => h(RouterView)
  }
})

const StandaloneRedirect = defineComponent({
  name: 'CoreStandaloneRedirect',
  setup() {
    const route = useRoute()
    const router = useRouter()

    onMounted(() => {
      const pathMatch = route.params.pathMatch
      const redirectPath = Array.isArray(pathMatch) ? pathMatch.join('/') : pathMatch
      router.replace({ path: `/${redirectPath || ''}`, query: route.query })
    })

    return () => null
  }
})

function installGlobalMethods(app: ReturnType<typeof createApp>) {
  app.config.globalProperties.useDict = useDict
  app.config.globalProperties.download = download
  app.config.globalProperties.parseTime = parseTime
  app.config.globalProperties.resetForm = resetForm
  app.config.globalProperties.handleTree = handleTree
  app.config.globalProperties.addDateRange = addDateRange
  app.config.globalProperties.selectDictLabel = selectDictLabel
  app.config.globalProperties.selectDictLabels = selectDictLabels
}

function installStandaloneRuntime(router: Router, homeRoute: RouteLocationRaw, permissions: string[], roles: string[], onUnauthorized?: () => Promise<void> | void) {
  installAuthRuntime({
    getPermissions: () => permissions,
    getRoles: () => roles
  })

  installRequestRuntime({ onUnauthorized })

  // 独立模式默认不依赖宿主 TagsView，保留最小 tab 能力即可。
  installTabRuntime({
    getCurrentRoute: () => router.currentRoute.value,
    push: (to) => router.push(to),
    replace: (to) => router.replace(to),
    resolveHomeRoute: () => homeRoute,
    delCachedView: async () => undefined,
    delView: async () => ({ lastPath: typeof homeRoute === 'string' ? homeRoute : undefined }),
    delAllViews: async () => undefined,
    delLeftTags: async () => undefined,
    delRightTags: async () => undefined,
    delOthersViews: async () => undefined,
    updateVisitedView: () => undefined
  })
}

export interface CreateStandaloneRouterOptions {
  routes: RouteItem[]
  history?: RouterHistory
  base?: string
  useHash?: boolean
  includeRedirectRoute?: boolean
  beforeRoutes?: RouteRecordRaw[]
  afterRoutes?: RouteRecordRaw[]
  scrollBehavior?: RouterScrollBehavior
}

export interface CreateStandaloneAppOptions {
  routes: RouteItem[]
  rootComponent?: Component
  mount?: string | Element
  history?: RouterHistory
  base?: string
  useHash?: boolean
  homeRoute?: RouteLocationRaw
  permissions?: string[]
  roles?: string[]
  onUnauthorized?: () => Promise<void> | void
  installStore?: boolean
  installPlugins?: boolean
  installDirective?: boolean
  installGlobals?: boolean
  additionalPlugins?: Plugin[]
  setup?: (context: { app: ReturnType<typeof createApp>; router: Router }) => void
}

export type CreateModuleStandaloneAppOptions = Omit<CreateStandaloneAppOptions, 'routes'>

export interface DefineStandaloneModuleAppOptions {
  routes: RouteItem[]
  homeRoute?: RouteLocationRaw
}

export function createStandaloneRouter(options: CreateStandaloneRouterOptions) {
  const history = options.history ?? (options.useHash ? createWebHashHistory(options.base) : createWebHistory(options.base))
  const routes: RouteRecordRaw[] = [
    ...(options.beforeRoutes || []),
    ...(options.includeRedirectRoute === false ? [] : [{
      path: '/redirect/:pathMatch(.*)*',
      component: StandaloneRedirect,
      meta: { hidden: true }
    }]),
    ...(options.routes as RouteRecordRaw[]),
    ...(options.afterRoutes || [])
  ]

  return createRouter({
    history,
    routes,
    scrollBehavior: options.scrollBehavior || (() => ({ left: 0, top: 0 }))
  })
}

export function createStandaloneApp(options: CreateStandaloneAppOptions) {
  const router = createStandaloneRouter({
    routes: options.routes,
    history: options.history,
    base: options.base,
    useHash: options.useHash
  })
  const app = createApp(options.rootComponent || StandaloneRoot)
  const homeRoute = options.homeRoute || '/'

  installStandaloneRuntime(
    router,
    homeRoute,
    options.permissions || [],
    options.roles || [],
    options.onUnauthorized
  )

  if (options.installGlobals !== false) installGlobalMethods(app)
  if (options.installStore !== false) app.use(store)
  app.use(router)
  if (options.installPlugins !== false) app.use(plugins)
  if (options.installDirective !== false) app.use(directive)
  options.additionalPlugins?.forEach((plugin) => app.use(plugin))
  options.setup?.({ app, router })
  if (options.mount) app.mount(options.mount)
  return { app, router }
}

export function defineStandaloneModuleApp(definition: DefineStandaloneModuleAppOptions) {
  return (options: CreateModuleStandaloneAppOptions = {}) => createStandaloneApp({
    ...options,
    routes: definition.routes,
    homeRoute: options.homeRoute || definition.homeRoute
  })
}