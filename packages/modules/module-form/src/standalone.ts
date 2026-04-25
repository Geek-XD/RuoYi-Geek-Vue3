import { createStandaloneApp, type CreateStandaloneAppOptions } from '@ruoyi/core/standalone'
import { formStandaloneRoutes } from './routes'

export type CreateFormStandaloneAppOptions = Omit<CreateStandaloneAppOptions, 'routes'>

export function createFormStandaloneApp(options: CreateFormStandaloneAppOptions = {}) {
  return createStandaloneApp({
    ...options,
    routes: formStandaloneRoutes,
    homeRoute: options.homeRoute || '/form/template/index'
  })
}