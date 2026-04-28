import { defineAppModule } from '@ruoyi/core/types/module'
import { onlinePageRoutes, resolveOnlineView } from './routes'

const onlineModule = defineAppModule({
  key: 'online',
  name: '在线开发模块',
  description: '在线建表与移动端预览能力',
  pageRoutes: onlinePageRoutes,
  resolveView: resolveOnlineView
})

export default onlineModule
