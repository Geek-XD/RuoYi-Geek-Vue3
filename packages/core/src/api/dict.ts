import request from '@ruoyi/core/utils/request'
import type { Dict } from '@ruoyi/core/types/dict'
import type { GeekResponse } from '@ruoyi/core/types/request'

export function getDicts(dictType: string) {
  return request<Dict[]>({
    url: `/system/dict/data/type/${dictType}`,
    method: 'get'
  }) as Promise<GeekResponse<Dict[]>>
}
