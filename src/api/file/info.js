import request from '@/utils/request'
import { getToken } from '@/utils/auth';

// 查询文件信息列表
export function listInfo(query) {
  return request({
    url: '/file/info/list',
    method: 'get',
    params: query
  })
}

// 查询文件信息详细
export function getInfo(fileId) {
  return request({
    url: '/file/info/' + fileId,
    method: 'get'
  })
}

// 新增文件信息
export function addInfo(data) {
  return request({
    url: '/file/info',
    method: 'post',
    data: data
  })
}

// 修改文件信息
export function updateInfo(data) {
  return request({
    url: '/file/info',
    method: 'put',
    data: data
  })
}

// 删除文件信息
export function delInfo(fileId) {
  return request({
    url: '/file/info/' + fileId,
    method: 'delete'
  })
}

// 统一上传接口
export function uploadFileUnified({ storageType, clientName, file }) {
  const formData = new FormData();
  formData.append('file', file);
  return request({
    url: `/file/${storageType}/${clientName}/upload`,
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data', Authorization: 'Bearer ' + getToken() },
    data: formData
  });
}

// 统一下载接口（返回文件流）
export function downloadFileUnified({ storageType, clientName, filePath }) {
  return request({
    url: `/file/${storageType}/${clientName}/download`,
    method: 'get',
    params: { filePath },
    responseType: 'blob',
    headers: { Authorization: 'Bearer ' + getToken() }
  });
}

// 获取所有可用存储渠道及其client列表
export function getClientList() {
  return request({
    url: '/file/client-list',
    method: 'get'
  });
}
