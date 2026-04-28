import type { RegisteredFrontendModule } from '@ruoyi/core/types/module'

type RegisteredFrontendModuleFile = {
  default?: RegisteredFrontendModule
}

function isRegisteredFrontendModule(module: RegisteredFrontendModule | undefined): module is RegisteredFrontendModule {
  return Boolean(module?.manifest?.key)
}

// 自动发现 packages/modules 下的模块包；本地 / qiankun 兼容注册已经封装在模块自己的 defineAppModule 内部。
const discoveredModuleFiles = import.meta.glob('/packages/modules/*/src/index.ts', { eager: true })

const discoveredModules = Object.values(discoveredModuleFiles)
  .map((moduleFile) => (moduleFile as RegisteredFrontendModuleFile).default)
  .filter(isRegisteredFrontendModule)
  .sort((left, right) => left.manifest.key.localeCompare(right.manifest.key))

export const installedModules = discoveredModules