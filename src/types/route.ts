import { Component } from "vue"
import { LocationQueryRaw, RouteLocationNormalized, RouteRecordRaw } from "vue-router"

type RouteMeta = {
  noCache?: boolean
  title?: string | ((route: RouteItem) => string)
  icon?: string
  breadcrumb?: boolean
  activeMenu?: string
  group?: string | ((route: RouteItem) => string)
  transition?: string
  isTopMenu?: boolean
  [key: string]: any
}


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

export type RouteItem = RouteRecordRaw & {
  path: string
  component?: Component | string
  redirect?: string
  name?: string
  query?: LocationQueryRaw
  roles?: string[]
  permissions?: string[]
  hidden?: boolean
  alwaysShow?: boolean
  meta?: RouteMeta
  children?: RouteItem[]
}

export type RouteLocationItem = RouteLocationNormalized & RouteMeta