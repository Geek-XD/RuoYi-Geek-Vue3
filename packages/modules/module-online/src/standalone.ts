import { createStandaloneApp, type CreateStandaloneAppOptions } from '@ruoyi/core/standalone'
import { onlineStandaloneRoutes } from './routes'

export type CreateOnlineStandaloneAppOptions = Omit<CreateStandaloneAppOptions, 'routes'>

export function createOnlineStandaloneApp(options: CreateOnlineStandaloneAppOptions = {}) {
  return createStandaloneApp({
    ...options,
    routes: onlineStandaloneRoutes,
    homeRoute: options.homeRoute || '/online/db/index'
  })
}