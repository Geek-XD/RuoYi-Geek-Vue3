import defaultSettings, { resolveMenuLayout } from '@/settings'
import { defineStore } from 'pinia'
import { fetchDbSettings } from '@ruoyi/core/api/settings'
import { useLocalStorage } from '@vueuse/core';

type SettingsConfig = typeof defaultSettings
type ChangeSettingPayload = {
  [K in keyof SettingsConfig]: { key: K, value: SettingsConfig[K] }
}[keyof SettingsConfig]
const storageSettings = useLocalStorage<Partial<SettingsConfig>>('layout-setting', {})
const useSettingsStore = defineStore('settings', {
  state: () => ({
    ...defaultSettings,
    title: '',
    inited: false
  }),
  actions: {
    async initSetting() {
      if (this.inited) return
      try {
        const remoteConfig = await fetchDbSettings()

        const settings = {
          ...defaultSettings,
          ...remoteConfig,
          ...storageSettings.value,
        }
        settings.menuLayout = resolveMenuLayout(settings.menuLayout, settings.topNav)
        settings.topNav = settings.menuLayout !== 'left'
        Object.assign(this, settings)
      } finally {
        this.inited = true
      }
    },
    saveSetting() {
      storageSettings.value = {
        "menuLayout": this.menuLayout,
        "topNav": this.topNav,
        "tagsView": this.tagsView,
        "fixedHeader": this.fixedHeader,
        "sidebarLogo": this.sidebarLogo,
        "dynamicTitle": this.dynamicTitle,
        "sideTheme": this.sideTheme,
        "theme": this.theme
      }
    },
    changeSetting(data: ChangeSettingPayload) {
      Object.assign(this, { [data.key]: data.value })

      if (data.key === 'menuLayout') {
        this.menuLayout = resolveMenuLayout(data.value)
      } else if (data.key === 'topNav') {
        this.menuLayout = data.value ? 'mix' : 'left'
      }

      this.topNav = this.menuLayout !== 'left'
    },
    setTitle(title: string) {
      this.title = title
      this.refreshDynamicTitle()
    },
    refreshDynamicTitle() {
      document.title = this.dynamicTitle && this.title.trim()
        ? `${this.title} - ${defaultSettings.title}`
        : defaultSettings.title
    }
  },
  getters: {
    isLeftMenu: state => state.menuLayout === 'left',
    isMixMenu: state => state.menuLayout === 'mix',
    isTopMenu: state => state.menuLayout === 'top'
  }
})

export default useSettingsStore
