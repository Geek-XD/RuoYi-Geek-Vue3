import { staticRoutes } from './staticRoutes'
import { dynamicRoutes } from './asyncRoutes'

export default [
  ...staticRoutes,
  ...dynamicRoutes
]
