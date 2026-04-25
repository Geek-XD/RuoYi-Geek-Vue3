import { createModuleRoutesFromPages, createModuleViewResolver, type FrontendModulePageRoute } from '@ruoyi/core/types/module'

const messageViews = import.meta.glob('./view/**/*.vue')

export const messagePageRoutes: FrontendModulePageRoute[] = [
  {
    path: 'template/index',
    name: 'MessageTemplate',
    hidden: true,
    meta: { title: '消息模板', routeKey: 'template.index', view: 'message/template/index' }
  },
  {
    path: 'variable/index',
    name: 'MessageVariable',
    hidden: true,
    meta: { title: '消息变量', routeKey: 'variable.index', view: 'message/variable/index' }
  },
  {
    path: 'messageSystem/index',
    name: 'MessageSystem',
    hidden: true,
    meta: { title: '系统消息', routeKey: 'messageSystem.index', view: 'message/messageSystem/index' }
  }
]

export const resolveMessageView = createModuleViewResolver('message', messageViews)

export const messageStandaloneRoutes = createModuleRoutesFromPages('message', messagePageRoutes, resolveMessageView)