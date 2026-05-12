import type { App } from "vue"
import { download } from '@ruoyi/core/utils/request'
import { useDict } from '@ruoyi/core/composables/dict'
import { parseTime, resetForm, addDateRange, handleTree, selectDictLabel, selectDictLabels } from '@ruoyi/core/utils/ruoyi'
import router from '@ruoyi/core/router'           // 引入路由
import store from '@ruoyi/core/store'             // 引入状态管理
import plugins from '@ruoyi/core/plugins'         // 引入插件
import directive from '@ruoyi/core/directive'     // 引入指令

export default function AppPlugin(app: App<Element>): void {
  // 全局方法挂载
  app.config.globalProperties.useDict = useDict
  app.config.globalProperties.download = download
  app.config.globalProperties.parseTime = parseTime
  app.config.globalProperties.resetForm = resetForm
  app.config.globalProperties.handleTree = handleTree
  app.config.globalProperties.addDateRange = addDateRange
  app.config.globalProperties.selectDictLabel = selectDictLabel
  app.config.globalProperties.selectDictLabels = selectDictLabels

  app.use(router)            // 使用路由
  app.use(store)             // 使用状态管理
  app.use(plugins)           // 使用插件
  app.use(directive)         // 使用指令
}