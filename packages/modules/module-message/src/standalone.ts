import { createStandaloneApp, type CreateStandaloneAppOptions } from '@ruoyi/core/standalone'
import { messageStandaloneRoutes } from './routes'

export type CreateMessageStandaloneAppOptions = Omit<CreateStandaloneAppOptions, 'routes'>

export function createMessageStandaloneApp(options: CreateMessageStandaloneAppOptions = {}) {
  return createStandaloneApp({
    ...options,
    routes: messageStandaloneRoutes,
    homeRoute: options.homeRoute || '/message/template/index'
  })
}