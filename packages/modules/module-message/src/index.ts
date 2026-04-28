import { defineAppModule } from '@ruoyi/core/types/module'
import { messagePageRoutes, resolveMessageView } from './routes'

const messageModule = defineAppModule({
  key: 'message',
  name: '消息模块',
  description: '消息模板、变量与站内消息能力',
  pageRoutes: messagePageRoutes,
  resolveView: resolveMessageView
})

export default messageModule
