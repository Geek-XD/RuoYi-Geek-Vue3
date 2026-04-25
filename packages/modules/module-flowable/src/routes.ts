import { createModuleRoutesFromPages, createModuleViewResolver, type FrontendModulePageRoute } from '@ruoyi/core/types/module'

const flowableViews = import.meta.glob('./view/**/*.vue')

export const flowablePageRoutes: FrontendModulePageRoute[] = [
  {
    path: 'definition/model',
    name: 'FlowableDefinitionModelPage',
    hidden: true,
    meta: { title: '流程设计', routeKey: 'definition.model', view: 'flowable/definition/model' }
  },
  {
    path: 'definition/index',
    name: 'FlowableDefinitionIndexPage',
    hidden: true,
    meta: { title: '流程定义', routeKey: 'definition.index', view: 'flowable/definition/index' }
  },
  {
    path: 'listener/index',
    name: 'FlowableListenerIndexPage',
    hidden: true,
    meta: { title: '流程监听', routeKey: 'listener.index', view: 'flowable/listener/index' }
  },
  {
    path: 'expression/index',
    name: 'FlowableExpressionIndexPage',
    hidden: true,
    meta: { title: '流程表达式', routeKey: 'expression.index', view: 'flowable/expression/index' }
  },
  {
    path: 'task/todo/index',
    name: 'FlowableTodoIndexPage',
    hidden: true,
    meta: { title: '待办流程', routeKey: 'task.todo.index', view: 'flowable/task/todo/index' }
  },
  {
    path: 'task/todo/detail/index',
    name: 'FlowableTodoDetailPage',
    hidden: true,
    meta: { title: '流程处理', routeKey: 'task.todo.detail', view: 'flowable/task/todo/detail/index' }
  },
  {
    path: 'task/finished/index',
    name: 'FlowableFinishedIndexPage',
    hidden: true,
    meta: { title: '已办流程', routeKey: 'task.finished.index', view: 'flowable/task/finished/index' }
  },
  {
    path: 'task/finished/detail/index',
    name: 'FlowableFinishedDetailPage',
    hidden: true,
    meta: { title: '流程详情', routeKey: 'task.finished.detail', view: 'flowable/task/finished/detail/index' }
  },
  {
    path: 'task/myProcess/index',
    name: 'FlowableMyProcessIndexPage',
    hidden: true,
    meta: { title: '我的流程', routeKey: 'task.myProcess.index', view: 'flowable/task/myProcess/index' }
  },
  {
    path: 'task/myProcess/detail/index',
    name: 'FlowableMyProcessDetailPage',
    hidden: true,
    meta: { title: '流程详情', routeKey: 'task.myProcess.detail', view: 'flowable/task/myProcess/detail/index' }
  },
  {
    path: 'task/myProcess/send/index',
    name: 'FlowableMyProcessSendPage',
    hidden: true,
    meta: { title: '流程发起', routeKey: 'task.myProcess.send', view: 'flowable/task/myProcess/send/index' }
  }
]

export const resolveFlowableView = createModuleViewResolver('flowable', flowableViews)

export const flowableStandaloneRoutes = createModuleRoutesFromPages('flowable', flowablePageRoutes, resolveFlowableView)


