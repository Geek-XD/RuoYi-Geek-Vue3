import type { RegisteredFrontendModule, ResolvedModuleView } from '@ruoyi/core/types/module'
import { parseModuleView } from '@ruoyi/core/types/module'
type RegisteredFrontendModuleFile = { default?: RegisteredFrontendModule }
const discoveredModuleFiles: Record<string, RegisteredFrontendModuleFile> = import.meta.glob('/packages/modules/*/src/index.ts', { eager: true })
const discoveredModules = Object.values(discoveredModuleFiles)
  .map((moduleFile) => moduleFile.default)
  .filter((module): module is RegisteredFrontendModule => Boolean(module?.manifest?.key))
  .sort((left, right) => left.manifest.key.localeCompare(right.manifest.key))

const getInstalledModule = (moduleKey: string) => discoveredModules.find(module => module.manifest.key === moduleKey)
export const getInstalledModuleManifest = (moduleKey: string) => getInstalledModule(moduleKey)?.manifest
export const hasInstalledModule = (moduleKey: string) => Boolean(getInstalledModule(moduleKey))
export const isRemoteModule = (moduleKey: string): boolean => getInstalledModule(moduleKey)?.mode === 'remote'
export const getInstalledRemoteModule = (moduleKey: string) => getInstalledModule(moduleKey)?.remote

export function getInstalledModulePageRoutes() {
  return discoveredModules.flatMap((module) => {
    const runtime = module.runtime
    if (!runtime) return []
    return module.manifest.pages.map((page) => ({
      moduleKey: module.manifest.key,
      moduleName: module.manifest.name,
      routeKey: page.routeKey,
      title: page.title,
      view: page.view,
      path: runtime.resolveRoutePath(`/${page.view}`),
      remote: module.mode === 'remote'
    }))
  })
}

export function resolveRegisteredModulePage(view: string): ResolvedModuleView | undefined {
  const parsedView = parseModuleView(view)
  if (!parsedView) return undefined

  const installedModule = getInstalledModule(parsedView.moduleKey)
  if (!installedModule) return parsedView

  const matchedPage = installedModule.manifest.pages.find(page => page.routeKey === parsedView.routeKey || page.view === view)
  if (!matchedPage) return parsedView

  return {
    moduleKey: installedModule.manifest.key,
    routeKey: matchedPage.routeKey,
    view: matchedPage.view
  }
}

export function resolveRegisteredModuleView(view: string) {
  const resolvedPage = resolveRegisteredModulePage(view)
  if (resolvedPage) {
    view = resolvedPage.view
  }

  for (const module of discoveredModules) {
    if (module.mode === 'remote') continue
    const resolver = module.resolveView
    if (!resolver) continue
    const matchedView = resolver(view)
    if (matchedView) return matchedView
  }
  return undefined
}
