import defaultSettings, { resolveMenuLayout } from '@/settings'

const { theme, sideTheme, showSettings, menuLayout, topNav, tagsView, fixedHeader, sidebarLogo, dynamicTitle, footerVisible, footerContent } = defaultSettings

export const storageSetting: typeof defaultSettings = JSON.parse(localStorage.getItem('layout-setting') || '{}')

export function resolveInitialSettings(config: typeof defaultSettings) {
  const resolvedMenuLayout = resolveMenuLayout(storageSetting.menuLayout, storageSetting.topNav)
  const menuLayoutValue = !storageSetting.menuLayout && !storageSetting.topNav
    ? (config.menuLayout ?? resolveMenuLayout(undefined, config.topNav ?? topNav))
    : resolvedMenuLayout

  return {
    theme: storageSetting.theme ?? config.theme ?? theme,
    sideTheme: storageSetting.sideTheme ?? config.sideTheme ?? sideTheme,
    menuLayout: menuLayoutValue,
    topNav: menuLayoutValue !== 'left',
    tagsView: storageSetting.tagsView ?? config.tagsView ?? tagsView,
    fixedHeader: storageSetting.fixedHeader ?? config.fixedHeader ?? fixedHeader,
    sidebarLogo: storageSetting.sidebarLogo ?? config.sidebarLogo ?? sidebarLogo,
    dynamicTitle: storageSetting.dynamicTitle ?? config.dynamicTitle ?? dynamicTitle,
    showSettings,
    footerVisible,
    footerContent
  }
}

export function applySettingChange(state: Record<string, any>, key: keyof typeof storageSetting, value: any) {
  if (key === 'menuLayout') {
    state.menuLayout = resolveMenuLayout(value)
    state.topNav = state.menuLayout !== 'left'
    return
  }
  state[key] = value
  if (key === 'topNav') {
    state.menuLayout = value ? 'mix' : 'left'
  }
}

export function resolveDocumentTitle(title: string, dynamicTitle: boolean) {
  if (dynamicTitle && title.trim()) return `${title} - ${defaultSettings.title}`
  return defaultSettings.title
}
