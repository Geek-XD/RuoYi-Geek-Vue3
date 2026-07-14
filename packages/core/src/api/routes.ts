import { getAction } from '@ruoyi/core/utils/request'
import type { RouteItem } from '@ruoyi/core/types/route'

export const getRouters = () => getAction<RouteItem[]>('/getRouters')
