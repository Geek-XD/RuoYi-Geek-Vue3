import 'element-plus/dist/index.css'
import '@/assets/styles/index.scss'
import '@lib/vform/designer.style.css'

import { defineAppModuleQiankunEntry } from '@ruoyi/core'
import initComponents from '@/components'
import VForm3 from '@lib/vform/designer.js'
import flowableModule from './index'

defineAppModuleQiankunEntry({
  module: flowableModule,
  setup: ({ app }) => {
    initComponents(app)
    app.use(VForm3)
  }
})