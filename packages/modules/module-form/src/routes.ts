import { createModuleRoutesFromPages, createModuleViewResolver, type FrontendModulePageRoute } from '@ruoyi/core/types/module'

const formViews = import.meta.glob('./view/**/*.vue')

export const formPageRoutes: FrontendModulePageRoute[] = [
  {
    path: 'template/index',
    name: 'FormTemplate',
    hidden: true,
    meta: { title: '表单模板', routeKey: 'template.index', view: 'form/template/index' }
  },
  {
    path: 'data/index',
    name: 'FormData',
    hidden: true,
    meta: { title: '表单数据', routeKey: 'data.index', view: 'form/data/index' }
  }
]

export const resolveFormView = createModuleViewResolver('form', formViews)

export const formStandaloneRoutes = createModuleRoutesFromPages('form', formPageRoutes, resolveFormView)