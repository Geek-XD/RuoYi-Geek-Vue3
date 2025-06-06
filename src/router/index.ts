import { createWebHistory, createRouter, RouteRecordRaw } from 'vue-router'
/* Layout */
import { RouteItem } from '@/types/route'
import Layout from '@/layout/index.vue'

/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true                 // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                  // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                  // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                  // 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字,可以是route对象里面的内容：(route)=>route.query.xx
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮相对应的侧边栏。
    group:"group"                   // 当路由设置了该属性，则相同组的路由共用一个tab标签，可以是route对象里面的内容：(route)=>route.query.xx
    transition:"fade-transform"     // 设置该路由的切换动画，默认淡出，不需要动画可以填none，动画需要自己在transition.scss中定义
    isTopMenu: true                 // 当设置为true时，该路由的第一个子路由会在TopNav模式下显示为顶级菜单
    }
 */

// 公共路由
export const constantRoutes: RouteItem[] = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/auth',
    component: () => import('@/views/auth/index.vue'),
    hidden: true,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/login.vue'),
        hidden: true
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/register.vue'),
        hidden: true
      }
    ]
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import('@/views/error/404.vue'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401.vue'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: '/index',
    children: [
      {
        path: '/index',
        component: () => import('@/views/index.vue'),
        name: 'Index',
        meta: { title: '首页', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/laboratory',
    component: Layout,
    meta: { title: '实验室', icon: 'dashboard' },
    children: [
      {
        path: 'threeTest',
        component: () => import('@/views/three/gltfmode.vue'),
        name: 'threeTest',
        meta: { title: 'three实验室', icon: 'dashboard' }
      },
      {
        path: 'payTest',
        component: () => import('@/views/pay/paytest/index.vue'),
        name: 'payTest',
        meta: { title: '支付实验室', icon: 'dashboard' }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index.vue'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  },
  {
    path: "/websocket",
    component: () => import('@/views/websocket.vue'),
    hidden: true
  },



  {
    path: '/flowable',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'definition/model/',
        component: () => import('@/views/flowable/definition/model.vue'),
        name: 'Model',
        hidden: true,
        meta: { title: '流程设计', icon: '' }
      },
      {
        path: 'task/finished/detail/index',
        component: () => import('@/views/flowable/task/finished/detail/index.vue'),
        name: 'FinishedRecord',
        hidden: true,
        meta: { title: '流程详情', icon: '' }
      },
      {
        path: 'task/myProcess/detail/index',
        component: () => import('@/views/flowable/task/myProcess/detail/index.vue'),
        name: 'MyProcessRecord',
        hidden: true,
        meta: { title: '流程详情', icon: '' }
      },
      {
        path: 'task/myProcess/send/index',
        component: () => import('@/views/flowable/task/myProcess/send/index.vue'),
        name: 'SendRecord',
        hidden: true,
        meta: { title: '流程发起', icon: '' }
      },
      {
        path: 'task/todo/detail/index',
        component: () => import('@/views/flowable/task/todo/detail/index.vue'),
        name: 'TodoRecord',
        hidden: true,
        meta: { title: '流程处理', icon: '' }
      },
      {
        path: 'task/flowForm/index',
        component: () => import('@/views/flowable/task/flowForm/index.vue'),
        name: 'FlowForm',
        hidden: true,
        meta: { title: '流程表单', icon: '' }
      }
    ]
  },
]

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes: RouteItem[] = [
  {
    path: '/system/user-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:user:edit'],
    children: [
      {
        path: 'role/:userId(\\d+)',
        component: () => import('@/views/system/user/authRole.vue'),
        name: 'AuthRole',
        meta: { title: '分配角色', activeMenu: '/system/user' }
      }
    ]
  },
  {
    path: '/system/role-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:role:edit'],
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/system/role/authUser.vue'),
        name: 'AuthUser',
        meta: { title: '分配用户', activeMenu: '/system/role' }
      }
    ]
  },
  {
    path: '/system/dict-data',
    component: Layout,
    hidden: true,
    permissions: ['system:dict:list'],
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/system/dict/data.vue'),
        name: 'DictData',
        meta: { title: '字典数据', activeMenu: '/system/dict' }
      }
    ]
  },
  {
    path: '/monitor/job-log',
    component: Layout,
    hidden: true,
    permissions: ['monitor:job:list'],
    children: [
      {
        path: 'index/:jobId(\\d+)',
        component: () => import('@/views/monitor/job/log.vue'),
        name: 'JobLog',
        meta: { title: '调度日志', activeMenu: '/monitor/job' }
      }
    ]
  },
  {
    path: '/tool/gen-edit',
    component: Layout,
    hidden: true,
    permissions: ['tool:gen:edit'],
    children: [
      {
        path: 'index/:tableId(\\d+)',
        component: () => import('@/views/tool/gen/editTable.vue'),
        name: 'GenEdit',
        meta: { title: '修改生成配置', activeMenu: '/tool/gen' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_ROUTER),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
});

export default router;
