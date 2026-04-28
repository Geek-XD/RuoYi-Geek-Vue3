import type { FrontendModuleManifest, FrontendRemoteModuleDefinition, RegisteredFrontendModule, ResolvedModuleView } from '@ruoyi/core/types/module'
import { parseModuleView } from '@ruoyi/core/types/module'
import { installedModules } from './catalog'

function getInstalledModule(moduleKey: string): RegisteredFrontendModule | undefined {
  return installedModules.find(module => module.manifest.key === moduleKey)
}

export function getInstalledModuleManifest(moduleKey: string): FrontendModuleManifest | undefined {
  return getInstalledModule(moduleKey)?.manifest
}

export function hasInstalledModule(moduleKey: string): boolean {
  return Boolean(getInstalledModule(moduleKey))
}

export function isRemoteModule(moduleKey: string): boolean {
  return getInstalledModule(moduleKey)?.mode === 'remote'
}

export function getInstalledRemoteModule(moduleKey: string): FrontendRemoteModuleDefinition | undefined {
  return getInstalledModule(moduleKey)?.remote
}

export function resolveRegisteredModulePage(view: string): ResolvedModuleView | undefined {
  const parsedView = parseModuleView(view)
  if (!parsedView) {
    return undefined
  }

  const installedModule = getInstalledModule(parsedView.moduleKey)
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
    if (module.mode === 'remote') {
      continue
    }
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
