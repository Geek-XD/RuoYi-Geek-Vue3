import { createApp } from 'vue'

import 'element-plus/dist/index.css'
import '@/assets/styles/index.scss' // global css

import App from './App.vue'
const app = createApp(App)

import { download } from '@ruoyi/core/utils/request'
import defaultSettings from './settings'
import profileAvatar from '@/assets/images/profile.jpg'
import { login, logout, getInfo, register, verifyPhoneCode, verifyEmailCode } from '@/api/login'
import { installAuthRuntime, installRequestRuntime, installTabRuntime, installUserRuntime } from '@ruoyi/core/runtime'
import { installSettingsRuntime } from '@ruoyi/core/settings'
import { useDict } from '@/utils/dict'
import { parseTime, resetForm, addDateRange, handleTree, selectDictLabel, selectDictLabels } from '@/utils/ruoyi'
// 全局方法挂载
app.config.globalProperties.useDict = useDict
app.config.globalProperties.download = download
app.config.globalProperties.parseTime = parseTime
app.config.globalProperties.resetForm = resetForm
app.config.globalProperties.handleTree = handleTree
app.config.globalProperties.addDateRange = addDateRange
app.config.globalProperties.selectDictLabel = selectDictLabel
app.config.globalProperties.selectDictLabels = selectDictLabels


import router from './router'           // 引入路由
import { router as appRouter } from './router'
import store from '@ruoyi/core/store'             // 引入状态管理
import plugins from '@ruoyi/core/plugins'         // 引入插件
import directive from '@ruoyi/core/directive'     // 引入指令
import compomemts from './components'   // 引入全局组件
import useUserStore from '@/store/modules/user'
import useTagsViewStore from '@/store/modules/tagsView'
import { RoutesAlias } from '@/router/routesAlias'

installAuthRuntime({
  getPermissions: () => useUserStore().permissions,
  getRoles: () => useUserStore().roles
})

installUserRuntime({
  login,
  logout,
  getInfo,
  register,
  verifyPhoneCode,
  verifyEmailCode,
  resolveAvatar: (avatar) => {
    if (!avatar) {
      return profileAvatar
    }
    return avatar.startsWith('http') ? avatar : import.meta.env.VITE_APP_BASE_API + avatar
  },
  openResetPassword: () => {
    appRouter.push({ name: 'Profile', params: { activeTab: 'resetPwd' } })
  }
})

installSettingsRuntime({
  title: defaultSettings.title,
  initDbSetting: defaultSettings.initDbSetting
})

installRequestRuntime({
  onUnauthorized: async () => {
    await useUserStore().logOut()
    location.href = appRouter.resolve(RoutesAlias.Home).href
  }
})

installTabRuntime({
  getCurrentRoute: () => appRouter.currentRoute.value,
  push: (to) => appRouter.push(to),
  replace: (to) => appRouter.replace(to),
  resolveHomeRoute: () => RoutesAlias.Home,
  delCachedView: (view) => useTagsViewStore().delCachedView(view as any),
  delView: (view) => useTagsViewStore().delView(view as any),
  delAllViews: () => useTagsViewStore().delAllViews(),
  delLeftTags: (view) => useTagsViewStore().delLeftTags(view as any),
  delRightTags: (view) => useTagsViewStore().delRightTags(view as any),
  delOthersViews: (view) => useTagsViewStore().delOthersViews(view as any),
  updateVisitedView: (view) => useTagsViewStore().updateVisitedView(view as any)
})

app.use(router).use(store).use(plugins).use(directive).use(compomemts)

import VForm3 from '@lib/vform/designer.js'  //引入VForm 3库
import '@lib/vform/designer.style.css'  //引入VForm3样式
app.use(VForm3)

app.mount('#app')