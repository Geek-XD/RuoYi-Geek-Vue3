const Layout = () => import('@ruoyi/ui/layout/Admin/index.vue')

export default [
  {
    path: '/online/page',
    component: Layout,
    permissions: ['online:page:list'],
    children: [
      {
        path: 'index',
        component: () => import('@ruoyi/module-online/views/page/index.vue'),
        name: 'OnlinePageAdmin',
        meta: { title: '在线页面管理', icon: 'monitor' }
      }
    ]
  },
  {
    path: '/online/runtime',
    component: Layout,
    hidden: true,
    children: [
      {
        path: ':pageCode',
        component: () => import('@ruoyi/module-online/views/runtime/index.vue'),
        name: 'OnlineRuntimePage',
        meta: { title: '在线页面' }
      }
    ]
  }
]
