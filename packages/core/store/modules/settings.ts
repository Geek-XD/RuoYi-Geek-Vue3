import defaultSettings, { type MenuLayout } from '@/settings'
import { defineStore } from 'pinia'
import { applySettingChange, resolveDocumentTitle, resolveInitialSettings, storageSetting } from '../helpers/settings'

const useSettingsStore = defineStore('settings', {
  state: () => ({
    title: '',
    theme: '#11A983',
    sideTheme: 'theme-light',
    showSettings: defaultSettings.showSettings,
    menuLayout: 'left' as MenuLayout,
    topNav: false,
    tagsView: true,
    fixedHeader: true,
    sidebarLogo: true,
    dynamicTitle: true,
    footerVisible: defaultSettings.footerVisible,
    footerContent: defaultSettings.footerContent,
    inited: false
  }),
  actions: {
    async initSetting() {
      if (this.inited) return
      try {
        const { initDbSetting } = defaultSettings as typeof defaultSettings & { initDbSetting: () => Promise<any> }
        const config = await initDbSetting()
        Object.assign(this, resolveInitialSettings({ ...defaultSettings, ...config }))
      } finally {
        this.inited = true
      }
    },
    /** 修改布局设置 */
    changeSetting(data: { key: keyof typeof storageSetting, value: any }) {
      applySettingChange(this, data.key, data.value)
    },
    /** 设置网页标题 */
    setTitle(title: string) {
      this.title = title
      this.refreshDynamicTitle();
    },
    refreshDynamicTitle() {
      document.title = resolveDocumentTitle(this.title, this.dynamicTitle)
    }
  },
  getters: {
    isLeftMenu: state => state.menuLayout === 'left',
    isMixMenu: state => state.menuLayout === 'mix',
    isTopMenu: state => state.menuLayout === 'top'
  }
})

export default useSettingsStore
