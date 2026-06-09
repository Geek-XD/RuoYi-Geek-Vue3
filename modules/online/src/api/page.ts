import { getAction } from '@ruoyi/core/utils/request'

export function getRuntimePage(pageCode: string) {
  return getAction('/online/page/runtime/' + pageCode)
}
