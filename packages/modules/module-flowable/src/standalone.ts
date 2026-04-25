import { createStandaloneApp, type CreateStandaloneAppOptions } from '@ruoyi/core/standalone'
import { flowableStandaloneRoutes } from './routes'

export type CreateFlowableStandaloneAppOptions = Omit<CreateStandaloneAppOptions, 'routes'>

export function createFlowableStandaloneApp(options: CreateFlowableStandaloneAppOptions = {}) {
  return createStandaloneApp({
    ...options,
    routes: flowableStandaloneRoutes,
    homeRoute: options.homeRoute || '/flowable/definition/index'
  })
}