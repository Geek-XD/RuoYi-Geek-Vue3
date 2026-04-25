import { defineFrontendModule } from '@ruoyi/core/types/module'
import { onlinePageRoutes, resolveOnlineView } from './routes'

const onlineModule = defineFrontendModule({
  key: 'online',
  name: '在线开发模块',
  description: '在线建表与移动端预览能力',
  version: '1.0.0',
  pageRoutes: onlinePageRoutes,
  resolveView: resolveOnlineView
})

export default onlineModule
