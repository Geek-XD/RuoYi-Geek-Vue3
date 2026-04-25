import { createStandaloneApp, type CreateStandaloneAppOptions } from '@ruoyi/core/standalone'
import { payStandaloneRoutes } from './routes'

export type CreatePayStandaloneAppOptions = Omit<CreateStandaloneAppOptions, 'routes'>

export function createPayStandaloneApp(options: CreatePayStandaloneAppOptions = {}) {
  return createStandaloneApp({
    ...options,
    routes: payStandaloneRoutes,
    homeRoute: options.homeRoute || '/pay/order/index'
  })
}