import { createModuleRoutesFromPages, createModuleViewResolver, type FrontendModulePageRoute } from '@ruoyi/core/types/module'

const onlineViews = import.meta.glob('./view/**/*.vue')

export const onlinePageRoutes: FrontendModulePageRoute[] = [
  {
    path: 'db/index',
    name: 'OnlineDb',
    hidden: true,
    meta: { title: '在线建表', routeKey: 'db.index', view: 'online/db/index' }
  },
  {
    path: 'mb/index',
    name: 'OnlineMb',
    hidden: true,
    meta: { title: '移动端预览', routeKey: 'mb.index', view: 'online/mb/index' }
  },
  {
    path: 'mb/online-preview',
    name: 'OnlineMbPreview',
    hidden: true,
    meta: { title: '移动端预览详情', routeKey: 'mb.online-preview', view: 'online/mb/online-preview' }
  },
  {
    path: 'mb/mybatis-input',
    name: 'OnlineMbMybatisInput',
    hidden: true,
    meta: { title: 'MyBatis 输入', routeKey: 'mb.mybatis-input', view: 'online/mb/mybatis-input' }
  }
]

export const resolveOnlineView = createModuleViewResolver('online', onlineViews)

export const onlineStandaloneRoutes = createModuleRoutesFromPages('online', onlinePageRoutes, resolveOnlineView)