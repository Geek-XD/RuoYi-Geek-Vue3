import defaultSettings from '@/settings'
import { useDynamicTitle } from '@/utils/dynamicTitle'
import { init } from 'echarts'
import { defineStore } from 'pinia'

const { theme, sideTheme, showSettings, topNav, tagsView, fixedHeader, sidebarLogo, dynamicTitle, initSetting } = defaultSettings

const storageSetting: typeof defaultSettings = JSON.parse(
  localStorage.getItem('layout-setting') || '{}'
)

const useSettingsStore = defineStore(
  'settings',
  {
    state: () => ({
      title: '',
      theme: undefined,
      sideTheme: undefined,
      showSettings: showSettings,
      topNav: undefined,
      tagsView: undefined,
      fixedHeader: undefined,
      sidebarLogo: undefined,
      dynamicTitle: undefined,
      inited: false
    }),
    actions: {
      async initSetting() {
        if (this.inited) return
        const config = await initSetting()
        this.theme = storageSetting.theme || config.theme || theme
        this.sideTheme = storageSetting.sideTheme || config.sideTheme || sideTheme
        this.topNav = storageSetting.topNav || config.topNav || topNav
        this.tagsView = storageSetting.tagsView || config.tagsView || tagsView
        this.fixedHeader = storageSetting.fixedHeader || config.fixedHeader || fixedHeader
        this.sidebarLogo = storageSetting.sidebarLogo || config.sidebarLogo || sidebarLogo
        this.dynamicTitle = storageSetting.dynamicTitle || config.dynamicTitle || dynamicTitle
        this.inited = true
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
