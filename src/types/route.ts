import { Component } from "vue"
import { RouteRecordRaw } from "vue-router"

// 定义路由项接口
export type RouteItem = RouteRecordRaw & {
  path: string
  component?: Component | string
  redirect?: string
  name?: string
  query?: { [key: string]: string | number | boolean }
  roles?: string[]
  permissions?: string[]
  hidden?: boolean
  meta?: {
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
  children?: RouteItem[]
}