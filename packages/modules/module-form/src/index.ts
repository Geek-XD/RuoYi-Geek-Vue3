import { defineFrontendModule } from '@ruoyi/core/types/module'
import { formPageRoutes, resolveFormView } from './routes'

const formModule = defineFrontendModule({
  key: 'form',
  name: '表单模块',
  description: '在线表单模板与表单数据能力',
  version: '1.0.0',
  pageRoutes: formPageRoutes,
  resolveView: resolveFormView
})

export default formModule
