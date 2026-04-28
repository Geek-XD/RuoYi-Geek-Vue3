import { defineAppModule } from '@ruoyi/core/types/module'
import { flowablePageRoutes } from './routes'

const flowableViews = import.meta.glob('./view/**/*.vue')

const flowableModule = defineAppModule({
  key: 'flowable',
  name: '流程模块',
  description: '流程设计、待办、已办与我的流程相关页面',
  pageRoutes: flowablePageRoutes,
  viewModules: flowableViews,
  homeRoute: '/flowable/definition'
})

export default flowableModule


