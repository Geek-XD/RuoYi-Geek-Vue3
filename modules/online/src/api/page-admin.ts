import request from '@ruoyi/core/utils/request'

export function listOnlinePage(query) {
  return request({
    url: '/online/page/list',
    method: 'get',
    params: query
  })
}

export function getOnlinePage(pageId) {
  return request({
    url: '/online/page/' + pageId,
    method: 'get'
  })
}

export function delOnlinePage(pageId) {
  return request({
    url: '/online/page/' + pageId,
    method: 'delete'
  })
}
