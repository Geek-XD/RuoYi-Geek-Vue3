import request from '@/utils/request'

// 查询消息管理列表
export function listMessageSystem(query) {
  return request({
    url: '/modelMessage/messageSystem/list',
    method: 'get',
    params: query
  })
}

// 查询消息管理详细
export function getMessageSystem(messageId) {
  return request({
    url: '/modelMessage/messageSystem/' + messageId,
    method: 'get'
  })
}

// 新增消息管理
export function addMessage(data) {
  return request({
    url: '/modelMessage/messageSystem',
    method: 'post',
    data: data,
    headers: { 'isRepeatSubmit': false }
  })
}

// 修改消息管理
export function updateMessageSystem(data) {
  return request({
    url: '/modelMessage/messageSystem',
    method: 'put',
    data: data
  })
}

// 删除消息管理
export function delMessageSystem(messageId) {
  return request({
    url: '/modelMessage/messageSystem/' + messageId,
    method: 'delete'
  })
}

// 查询系统用户收件人
export function selectUser(sendMode) {
  const url = '/modelMessage/messageSystem/selectUser' + (sendMode ? `?sendMode=${encodeURIComponent(sendMode)}` : '');
  return request({
    url: url,
    method: 'get'
  });
}

// 查询角色信息
export function selectRole() {
  return request({
    url: '/modelMessage/messageSystem/selectRole',
    method: 'get'
  })
}

// 查询部门信息
export function selectDept() {
  return request({
    url: '/modelMessage/messageSystem/selectDept',
    method: 'get'
  })
}

//消息状态
export function getUpdate(messageId) {
  return request({
    url: '/modelMessage/messageSystem/' + messageId,
    method: 'post'
  })
}

//根据角色ID获取所有符合条件的用户信息。
export function getUsersByRoleId(roleId) {
  return request({
    url: 'modelMessage/messageSystem/getUsersByRole/'+roleId,
    method: 'get'
  })
}

//根据部门ID获取所有符合条件的用户信息。
export function getUserNamesByDeptId(deptId) {
  return request({
    url: 'modelMessage/messageSystem/getUserNameByDeptId/'+deptId,  
    method: 'get'
  })
}

// 查询模版签名
export function selecTemplates() {
  return request({
    url: '/modelMessage/messageSystem/selecTemplates',
    method: 'get'
  })
}

// 批量发送消息
export function batchAddMessage(data) {
  return request({
    url: '/modelMessage/messageSystem',
    method: 'post',
    data: data,
    headers: { 'isRepeatSubmit': false } 
  })
}
