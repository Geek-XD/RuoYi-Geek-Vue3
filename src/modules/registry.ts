import type { FrontendModule, FrontendModuleManifest, ResolvedModuleView } from '@ruoyi/core/types/module'
import { parseModuleView } from '@ruoyi/core/types/module'
import flowableModule from '@ruoyi/module-flowable'
import formModule from '@ruoyi/module-form'
import messageModule from '@ruoyi/module-message'
import onlineModule from '@ruoyi/module-online'
import payModule from '@ruoyi/module-pay'

const installedModules: FrontendModule[] = [
  flowableModule,
  formModule,
  messageModule,
  onlineModule,
  payModule
]

export function getInstalledModuleManifest(moduleKey: string): FrontendModuleManifest | undefined {
  return installedModules.find(module => module.manifest.key === moduleKey)?.manifest
}

export function hasInstalledModule(moduleKey: string): boolean {
  return installedModules.some(module => module.manifest.key === moduleKey)
}

export function resolveRegisteredModulePage(view: string): ResolvedModuleView | undefined {
  const parsedView = parseModuleView(view)
  if (!parsedView) {
    return undefined
  }

  const installedModule = installedModules.find(module => module.manifest.key === parsedView.moduleKey)
  if (!installedModule) {
    return parsedView
  }

  const matchedPage = installedModule.manifest.pages.find(page => {
    return page.routeKey === parsedView.routeKey || page.view === view
  })

  if (!matchedPage) {
    return parsedView
  }

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

  for (const module of installedModules) {
    const resolver = module.resolveView
    if (!resolver) {
      continue
    }
    const matchedView = resolver(view)
    if (matchedView) {
      return matchedView
    }
  }
  return undefined
}
