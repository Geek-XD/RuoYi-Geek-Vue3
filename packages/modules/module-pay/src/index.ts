import { defineFrontendModule } from '@ruoyi/core/types/module'
import { payPageRoutes, resolvePayView } from './routes'

const payModule = defineFrontendModule({
  key: 'pay',
  name: '支付模块',
  description: '订单、发票与支付测试能力',
  version: '1.0.0',
  pageRoutes: payPageRoutes,
  resolveView: resolvePayView
})

export default payModule
