import { defineFrontendModule } from '@ruoyi/core/types/module'
import { messagePageRoutes, resolveMessageView } from './routes'

const messageModule = defineFrontendModule({
  key: 'message',
  name: '消息模块',
  description: '消息模板、变量与站内消息能力',
  version: '1.0.0',
  pageRoutes: messagePageRoutes,
  resolveView: resolveMessageView
})

export default messageModule
