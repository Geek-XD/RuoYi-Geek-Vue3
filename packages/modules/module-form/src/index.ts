import { defineAppModule } from '@ruoyi/core/types/module'
import { formPageRoutes, resolveFormView } from './routes'

const formModule = defineAppModule({
  key: 'form',
  name: '表单模块',
  description: '在线表单模板与表单数据能力',
  pageRoutes: formPageRoutes,
  resolveView: resolveFormView
})

export default formModule
