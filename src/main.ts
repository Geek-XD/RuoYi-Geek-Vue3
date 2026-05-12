import { createApp } from 'vue'

import '@/assets/styles/index.scss' // global css

import App from './App.vue'
const app = createApp(App)

import { setupCoreAuthHandlers } from '@/core/setupAuthHandlers'
setupCoreAuthHandlers()

import CoreAppPlugin from '@ruoyi/core/main'
app.use(CoreAppPlugin)
import compomemts from '@ruoyi/ui/components'   // 引入全局组件
app.use(compomemts)
import { MODULES_APP_PLUGIN } from '@ruoyi/core/constant'
MODULES_APP_PLUGIN && Object.keys(MODULES_APP_PLUGIN).forEach(key => {
  const module = MODULES_APP_PLUGIN[key]
  if (module && module.default) {
    app.use(module.default)
  }
})

app.mount('#app')
