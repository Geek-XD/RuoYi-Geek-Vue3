import { defineFrontendModule } from '@ruoyi/core/types/module'
import { flowablePageRoutes, resolveFlowableView } from './routes'

const flowableModule = defineFrontendModule({
  key: 'flowable',
  name: '流程模块',
  description: '流程设计、待办、已办与我的流程相关页面',
  version: '1.0.0',
  routeBase: '/flowable',
  pageRoutes: flowablePageRoutes,
  resolveView: resolveFlowableView
})

export default flowableModule


