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


// 定义路由项接口
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