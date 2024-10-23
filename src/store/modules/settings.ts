import defaultSettings from '@/settings'
import { useDynamicTitle } from '@/utils/dynamicTitle'
import { init } from 'echarts'
import { defineStore } from 'pinia'
import { handleThemeStyle } from '@/utils/theme'
const { theme, sideTheme, showSettings, topNav, tagsView, fixedHeader, sidebarLogo, dynamicTitle, initDbSetting } = defaultSettings

const storageSetting: typeof defaultSettings = JSON.parse(
  localStorage.getItem('layout-setting') || '{}'
)

const useSettingsStore = defineStore('settings', {
  state: () => ({
    title: '',
    theme: '#11A983',
    sideTheme: 'theme-light',
    showSettings: showSettings,
    topNav: false,
    tagsView: true,
    fixedHeader: true,
    sidebarLogo: true,
    dynamicTitle: true,
    inited: false
  }),
  actions: {
    async initSetting() {
      if (this.inited) return
      const config = await initDbSetting()
      this.theme = storageSetting.theme || config.theme || theme
      this.sideTheme = storageSetting.sideTheme || config.sideTheme || sideTheme
      // 顶部导航
      if (storageSetting.topNav == undefined) {
        this.topNav = config.topNav == undefined ? topNav : config.topNav
      } else {
        this.topNav = storageSetting.topNav
      }
      // tab栏
      if (storageSetting.tagsView == undefined) {
        this.tagsView = config.tagsView == undefined ? tagsView : config.tagsView
      } else {
        this.tagsView = storageSetting.tagsView
      }
      // 固定顶部栏
      if (storageSetting.fixedHeader == undefined) {
        this.fixedHeader = config.fixedHeader == undefined ? fixedHeader : config.fixedHeader
      } else {
        this.fixedHeader = storageSetting.fixedHeader
      }
      // 显示logo
      if (storageSetting.sidebarLogo == undefined) {
        this.sidebarLogo = config.sidebarLogo == undefined ? sidebarLogo : config.sidebarLogo
      } else {
        this.sidebarLogo = storageSetting.sidebarLogo
      }
      // 动态标题
      if (storageSetting.dynamicTitle == undefined) {
        this.dynamicTitle = config.dynamicTitle == undefined ? dynamicTitle : config.dynamicTitle
      } else {
        this.dynamicTitle = storageSetting.dynamicTitle
      }
      this.inited = true
      handleThemeStyle(this.theme)
      console.log('initSetting', storageSetting, config, this.fixedHeader)
    },
    // 修改布局设置
    changeSetting(data: { key: keyof typeof storageSetting, value: any }) {
      const { key, value } = data
      if (this.hasOwnProperty(key)) {
        //@ts-ignore
        this[key] = value
      }
    },
    // 设置网页标题
    setTitle(title: string) {
      this.title = title
      useDynamicTitle();
    }
  }
})

export default useSettingsStore
