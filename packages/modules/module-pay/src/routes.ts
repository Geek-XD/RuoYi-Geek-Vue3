import { createModuleRoutesFromPages, createModuleViewResolver, type FrontendModulePageRoute } from '@ruoyi/core/types/module'

const payViews = import.meta.glob('./view/**/*.vue')

export const payPageRoutes: FrontendModulePageRoute[] = [
  {
    path: 'order/index',
    name: 'PayOrder',
    hidden: true,
    meta: { title: '支付订单', routeKey: 'order.index', view: 'pay/order/index' }
  },
  {
    path: 'invoice/index',
    name: 'PayInvoice',
    hidden: true,
    meta: { title: '支付发票', routeKey: 'invoice.index', view: 'pay/invoice/index' }
  },
  {
    path: 'paytest/index',
    name: 'PayTest',
    hidden: true,
    meta: { title: '支付测试', routeKey: 'paytest.index', view: 'pay/paytest/index' }
  }
]

export const resolvePayView = createModuleViewResolver('pay', payViews)

export const payStandaloneRoutes = createModuleRoutesFromPages('pay', payPageRoutes, resolvePayView)