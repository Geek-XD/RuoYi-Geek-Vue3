import request from '@ruoyi/core/utils/request'
import { getToken } from '@ruoyi/core/utils/auth';

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

export function getClientList() {
  return request({
    url: '/file/client-list',
    method: 'get'
  })
}

// 统一上传接口
export function uploadFileUnified({ bucketName, file, useType }) {
  const formData = new FormData();
  formData.append('file', file);
  if (useType) {
    formData.append('useType', useType);
  }
  return request({
    url: bucketName ? `/file/${bucketName}/upload` : '/file/upload',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data', Authorization: 'Bearer ' + getToken() },
    data: formData
  });
}

// 统一下载接口（返回文件流）
export function downloadFileUnified({ bucketName, filePath }) {
  return request({
    url: bucketName ? `/file/${bucketName}/download` : '/file/download',
    method: 'get',
    params: { filePath },
    responseType: 'blob',
    headers: { Authorization: 'Bearer ' + getToken() }
  });
}

/**
 * 初始化分片上传
 */
export function initMultipartUpload(params) {
  return request({
    url: '/file/initUpload',
    method: 'post',
    params: {
      fileName: params.fileName,
      fileSize: params.fileSize,
      bucketName: params.bucketName,
      useType: params.useType,
    }
  });
}

/**
 * 上传文件分片
 */
export function uploadFileChunk(uploadId, filePath, partNumber, chunk, bucketName) {
  const formData = new FormData();
  formData.append('chunk', chunk);
  return request({
    url: '/file/uploadChunk',
    method: 'post',
    params: {
      uploadId,
      filePath,
      partNumber,
      bucketName
    },
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      repeatSubmit: false
    }
  });
}

/**
 * 完成分片上传
 */
export function completeMultipartUpload(params) {
  const { uploadId, filePath, fileSize, fileName, bucketName, useType, partETags } = params;
  return request({
    url: '/file/completeUpload',
    method: 'post',
    params: {
      uploadId,
      filePath,
      fileSize,
      fileName,
      bucketName,
      useType,
    },
    data: partETags
  });
}
