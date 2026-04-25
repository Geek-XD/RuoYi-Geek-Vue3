export type MenuLayout = 'left' | 'mix' | 'top'

export interface CoreSettingsConfig {
  title: string
  theme: string
  sideTheme: string
  showSettings: boolean
  menuLayout: MenuLayout
  topNav: boolean
  tagsView: boolean
  fixedHeader: boolean
  sidebarLogo: boolean
  dynamicTitle: boolean
  footerVisible: boolean
  footerContent: string
  initDbSetting: () => Promise<Partial<CoreSettingsConfig>>
}

export function resolveMenuLayout(menuLayout?: string | null, topNav?: boolean): MenuLayout {
  if (menuLayout === 'left' || menuLayout === 'mix' || menuLayout === 'top') {
    return menuLayout
  }
  return topNav ? 'mix' : 'left'
}

const defaultSettings: CoreSettingsConfig = {
  title: 'RuoYi-Geek',
  theme: '#409EFF',
  sideTheme: 'theme-dark',
  showSettings: false,
  menuLayout: 'left',
  topNav: false,
  tagsView: true,
  fixedHeader: false,
  sidebarLogo: true,
  dynamicTitle: false,
  footerVisible: true,
  footerContent: 'Copyright © 2018-2026 RuoYi-Geek. All Rights Reserved.',
  initDbSetting: async () => ({})
}

let settingsRuntime: Partial<CoreSettingsConfig> = {}

export function installSettingsRuntime(runtime: Partial<CoreSettingsConfig>) {
  settingsRuntime = {
    ...settingsRuntime,
    ...runtime
  }
}

export function getSettingsRuntime() {
  return settingsRuntime
}

export function getDefaultSettings() {
  return defaultSettings
}