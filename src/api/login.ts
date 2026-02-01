import { LoginForm, RegisterForm } from '@/types/user'
import request from '@/utils/request'

// 登录方法
export function login(data: LoginForm) {
  return request({
    url: '/login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 注册方法
export function register(data: RegisterForm) {
  return request({
    url: '/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/getInfo',
    method: 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}

export function sendEmailCode(data: LoginForm, type = 'register') {
  return request({
    url: `/auth/mail/send/${type}`,
    headers: {
      isToken: (type == 'register' || type == 'login') ? false : true
    },
    method: 'post',
    timeout: 20000,
    data,
    params: {
      autoRegister: data.autoRegister
    },
  })
}

export function verifyEmailCode(data: LoginForm, type = 'register') {
  return request({
    url: `/auth/mail/verify/${type}`,
    headers: {
      isToken: (type == 'register' || type == 'login') ? false : true
    },
    method: 'post',
    timeout: 20000,
    data,
    params: {
      autoRegister: data.autoRegister
    },
  })
}

export function sendPhoneCode(data: LoginForm, type = 'register') {
  return request({
    url: `/auth/dySms/send/${type}`,
    headers: {
      isToken: (type == 'register' || type == 'login') ? false : true
    },
    method: 'post',
    timeout: 20000,
    data,
    params: {
      autoRegister: data.autoRegister
    },
  })
}

export function verifyPhoneCode(data: LoginForm, type = 'register') {
  return request({
    url: `/auth/dySms/verify/${type}`,
    headers: {
      isToken: (type == 'register' || type == 'login') ? false : true
    },
    method: 'post',
    timeout: 20000,
    data,
    params: {
      autoRegister: data.autoRegister
    },
  })
}