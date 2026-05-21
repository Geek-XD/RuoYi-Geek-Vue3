import { createApp } from 'vue'
import CoreAppPlugin from '@ruoyi/core/main'
import { MODULES_APP_PLUGIN } from '@ruoyi/core/constant'
import compomemts from '@ruoyi/ui/components'
import { setupCoreAuthHandlers } from '@/core/setupAuthHandlers'
import App from './App.vue'
import '@/assets/styles/index.scss' // global css

setupCoreAuthHandlers()

const app = createApp(App)
  .use(CoreAppPlugin)
  .use(compomemts)

MODULES_APP_PLUGIN && Object.keys(MODULES_APP_PLUGIN).forEach(key => {
  const module = MODULES_APP_PLUGIN[key]
  if (module && module.default) {
    app.use(module.default)
  }
})

app.mount('#app')
