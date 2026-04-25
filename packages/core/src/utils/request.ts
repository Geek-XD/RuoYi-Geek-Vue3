import axios, { AxiosResponse } from 'axios'
import { ElNotification, ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import { getToken } from './auth'
import errorCode from './errorCode'
import cache from './cache'
import { saveAs } from 'file-saver'
import type { GeekRequestConfig, GeekResponse } from '../types/request'
import { getRequestRuntime } from '../runtime'

let downloadLoadingInstance: any
export let isRelogin = { show: false }

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

function tansParams(params: any) {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName]
    const part = encodeURIComponent(propName) + '='
    if (value !== null && value !== '' && typeof value !== 'undefined') {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== '' && typeof value[key] !== 'undefined') {
            const currentParams = propName + '[' + key + ']'
            const subPart = encodeURIComponent(currentParams) + '='
            result += subPart + encodeURIComponent(value[key]) + '&'
          }
        }
      } else {
        result += part + encodeURIComponent(value) + '&'
      }
    }
  }
  return result
}

async function blobValidate(data: Blob) {
  try {
    const text = await data.text()
    JSON.parse(text)
    return false
  } catch {
    return true
  }
}

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000
})

service.interceptors.request.use((config) => {
  const isToken = (config.headers ?? {}).isToken === false
  const isRepeatSubmit = (config.headers ?? {}).repeatSubmit === false
  const interval = (config.headers || {}).interval || 1000
  if (getToken() && !isToken) {
    config.headers['Authorization'] = 'Bearer ' + getToken()
  }
  if (config.method === 'get' && config.params) {
    let url = config.url + '?' + tansParams(config.params)
    url = url.slice(0, -1)
    config.params = {}
    config.url = url
  }
  if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
    const requestObj = {
      url: config.url,
      data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
      time: new Date().getTime()
    }
    const sessionObj = cache.session.getJSON('sessionObj')
    if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
      cache.session.setJSON('sessionObj', requestObj)
    } else {
      const sUrl = sessionObj.url
      const sData = sessionObj.data
      const sTime = sessionObj.time
      if (sData === requestObj.data && requestObj.time - sTime < interval && sUrl === requestObj.url) {
        const message = '数据正在处理，请勿重复提交'
        console.warn(`[${sUrl}]: ` + message)
        return Promise.reject(new Error(message))
      }
      cache.session.setJSON('sessionObj', requestObj)
    }
  }
  return config
}, error => Promise.reject(error))

service.interceptors.response.use(<T>(res: AxiosResponse<GeekResponse<T>, any>) => {
  const code = String(res.data.code || 200)
  const msg = errorCode[code] || res.data.msg || errorCode['default']
  if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
    return res
  }
  if (code === '401') {
    if (!isRelogin.show) {
      isRelogin.show = true
      ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', { confirmButtonText: '重新登录', cancelButtonText: '取消', type: 'warning' }).then(async () => {
        isRelogin.show = false
        await getRequestRuntime()?.onUnauthorized?.()
      }).catch(() => {
        isRelogin.show = false
      })
    }
    return Promise.reject(new Error('无效的会话，或者会话已过期，请重新登录。'))
  }
  if (code === '500') {
    ElMessage({ message: msg, type: 'error' })
    return Promise.reject(new Error(msg))
  }
  if (code === '601') {
    ElMessage({ message: msg, type: 'warning' })
    return Promise.reject(new Error(msg))
  }
  if (code !== '200') {
    ElNotification.error({ title: msg })
    return Promise.reject('error')
  }
  return Promise.resolve(res)
}, error => {
  let { message } = error
  if (message == 'Network Error') {
    message = '后端接口连接异常'
  } else if (message.includes('timeout')) {
    message = '系统接口请求超时'
  } else if (message.includes('Request failed with status code')) {
    message = '系统接口' + message.slice(-3) + '异常'
  }
  ElMessage({ message, type: 'error', duration: 5 * 1000 })
  return Promise.reject(error)
})

export async function download(url: string, params: any, filename: string, config?: any) {
  downloadLoadingInstance = ElLoading.service({ text: '正在下载数据，请稍候', background: 'rgba(0, 0, 0, 0.7)' })
  try {
    const res = await service.post(url, params, {
      transformRequest: [(currentParams) => tansParams(currentParams)],
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'blob',
      ...config
    })
    const data: Blob = res.data
    const isLogin = await blobValidate(data)
    if (isLogin) {
      const blob = new Blob([data])
      saveAs(blob, filename)
    } else {
      const resText = await data.text()
      const rspObj: GeekResponse = JSON.parse(resText)
      const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
      ElMessage.error(errMsg)
    }
    downloadLoadingInstance.close()
  } catch (error) {
    console.error(error)
    ElMessage.error('下载文件出现错误，请联系管理员！')
    downloadLoadingInstance.close()
  }
}

const request = <T>(config: GeekRequestConfig) => service<GeekRequestConfig, AxiosResponse<GeekResponse<T>>>(config).then(res => res.data)

export function postAction<T>(url: string, data?: any, headers: GeekRequestConfig['headers'] = { isToken: true }) {
  return request<T>({ data, url, method: 'POST', headers })
}

export function getAction<T>(url: string, params?: any, headers: GeekRequestConfig['headers'] = { isToken: true }) {
  return request<T>({ params, url, method: 'GET', headers })
}

export function putAction<T>(url: string, data?: any, headers: GeekRequestConfig['headers'] = { isToken: true }) {
  return request<T>({ data, url, method: 'PUT', headers })
}

export function deleteAction<T>(url: string, data?: any, headers: GeekRequestConfig['headers'] = { isToken: true }) {
  return request<T>({ data, url, method: 'DELETE', headers })
}

export default request