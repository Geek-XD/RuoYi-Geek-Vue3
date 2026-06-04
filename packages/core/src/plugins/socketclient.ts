import { createEventMessage, Message } from '@ruoyi/core/types/Message'
import { getToken } from '@ruoyi/core/utils/auth'

type ConnectSocketOption = {
  url: string | URL
  headers?: {
    isToken?: boolean
  }
}

type MessageCallback = (data: Message) => void
type ErrorCallback = (client: WebSocket | null, en: Event) => void
type CloseCallback = (client: WebSocket | null, en: CloseEvent) => void

type PendingRequest = {
  resolve: (data: Message) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

const DEFAULT_REQUEST_TIMEOUT = 10_000
const RECONNECT_DELAYS = [1_000, 2_000, 5_000, 10_000]

let socket: WebSocket | null = null
let currentOption: ConnectSocketOption | null = null
let currentSocketUrl = ''
let connectPromise: Promise<WebSocket> | null = null
let manualClose = false
let reconnectAttempts = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

const pendingRequests = new Map<string, PendingRequest>()
const eventListeners = new Map<string, Set<MessageCallback>>()
const defaultMessageListeners = new Set<MessageCallback>()
const errorListeners = new Set<ErrorCallback>()
const closeListeners = new Set<CloseCallback>()

function normalizePath(path: string) {
  if (!path) return ''
  if (path === '/') return ''
  return path.startsWith('/') ? path : `/${path}`
}

export function resolveDefaultSocketUrl(path = '/websocket/message') {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const baseWs = normalizePath((import.meta.env.VITE_APP_BASE_WS || '').trim())
  const socketPath = normalizePath(path)
  return `${protocol}//${window.location.host}${baseWs}${socketPath}`
}

function buildSocketUrl(options: ConnectSocketOption) {
  const url = new URL(String(options.url), window.location.origin)
  const isToken = options.headers?.isToken === false
  const token = getToken()
  if (token && !isToken) {
    url.searchParams.set('Authorization', `Bearer ${token}`)
  } else {
    url.searchParams.delete('Authorization')
  }
  return url.toString()
}

function ensureOpenSocket() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error('WebSocket 未连接')
  }
  return socket
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function rejectPendingRequests(reason: string) {
  pendingRequests.forEach((request) => {
    clearTimeout(request.timer)
    request.reject(new Error(reason))
  })
  pendingRequests.clear()
}

function notifyDefaultMessage(data: Message) {
  defaultMessageListeners.forEach((callback) => callback(data))
}

function notifyEventMessage(event: string, data: Message) {
  const listeners = eventListeners.get(event)
  if (!listeners || listeners.size === 0) {
    notifyDefaultMessage(data)
    return
  }
  listeners.forEach((callback) => callback(data))
}

function handleIncomingMessage(raw: string) {
  try {
    const data = JSON.parse(raw) as Message
    const messageId = data?.messageId
    if (messageId && pendingRequests.has(messageId)) {
      const pending = pendingRequests.get(messageId)!
      clearTimeout(pending.timer)
      pendingRequests.delete(messageId)
      pending.resolve(data)
      return
    }
    const event = data?.subject
    if (event) {
      console.info('[WS] received event', {
        subject: event,
        content: data?.content,
        messageId: data?.messageId,
      })
      notifyEventMessage(event, data)
      return
    }
    console.info('[WS] received message', {
      content: data?.content,
      messageId: data?.messageId,
      type: data?.type,
    })
    notifyDefaultMessage(data)
  } catch (error) {
    console.error('WebSocket JSON parse error:', error)
    console.error('Received data:', raw)
  }
}

function sendInternal(msg: Message) {
  ensureOpenSocket().send(JSON.stringify(msg))
}

function asyncSendInternal(msg: Message) {
  const ws = ensureOpenSocket()
  return new Promise<Message>((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(msg.messageId)
      reject(new Error(`WebSocket 消息超时: ${msg.messageId}`))
    }, DEFAULT_REQUEST_TIMEOUT)

    pendingRequests.set(msg.messageId, { resolve, reject, timer })

    try {
      ws.send(JSON.stringify(msg))
    } catch (error) {
      clearTimeout(timer)
      pendingRequests.delete(msg.messageId)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

function sendSubscription(event: string, action: 'subscribe' | 'unsubscribe') {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('[WS] skip subscription control because socket is not open', { event, action })
    return
  }
  console.info('[WS] sending subscription control', { event, action })
  const controlMessage = createEventMessage(event, { content: action })
  asyncSendInternal(controlMessage).catch(() => undefined)
}

function resubscribeAllEvents() {
  eventListeners.forEach((_listeners, event) => sendSubscription(event, 'subscribe'))
}

function attachSocketHandlers(
  ws: WebSocket,
  resolve?: (client: WebSocket) => void,
  reject?: (error: Error) => void,
) {
  let opened = false
  let settled = false

  ws.onopen = () => {
    opened = true
    reconnectAttempts = 0
    clearReconnectTimer()
    console.info('[WS] connected', {
      url: currentSocketUrl,
      subscriptions: Array.from(eventListeners.keys()),
    })
    resubscribeAllEvents()
    if (!settled) {
      settled = true
      resolve?.(ws)
    }
  }

  ws.onmessage = (event) => handleIncomingMessage(String(event.data ?? ''))

  ws.onerror = (event) => {
    console.error('[WS] socket error', {
      url: currentSocketUrl,
      readyState: ws.readyState,
    })
    errorListeners.forEach((callback) => callback(ws, event))
    if (!opened && !settled) {
      settled = true
      reject?.(new Error('WebSocket 连接失败'))
    }
  }

  ws.onclose = (event) => {
    if (socket === ws) {
      socket = null
    }
    console.warn('[WS] closed', {
      url: currentSocketUrl,
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
      manualClose,
    })
    closeListeners.forEach((callback) => callback(ws, event))
    rejectPendingRequests(event.reason || 'WebSocket 连接已关闭')

    if (!opened && !settled) {
      settled = true
      reject?.(new Error(event.reason || 'WebSocket 连接已关闭'))
      return
    }

    if (manualClose || !currentOption) {
      return
    }

    const delay = RECONNECT_DELAYS[Math.min(reconnectAttempts, RECONNECT_DELAYS.length - 1)]
    reconnectAttempts += 1
    clearReconnectTimer()
    console.info('[WS] scheduling reconnect', {
      url: currentSocketUrl,
      delay,
      attempt: reconnectAttempts,
    })
    reconnectTimer = setTimeout(() => {
      connectInternal(currentOption!).catch(() => undefined)
    }, delay)
  }
}

function connectInternal(options: ConnectSocketOption) {
  const nextUrl = buildSocketUrl(options)
  currentOption = {
    url: String(options.url),
    headers: { ...(options.headers ?? {}) },
  }

  if (socket && currentSocketUrl === nextUrl) {
    if (socket.readyState === WebSocket.OPEN) {
      console.info('[WS] reusing open socket', { url: nextUrl })
      return Promise.resolve(socket)
    }
    if (connectPromise) {
      console.info('[WS] waiting for pending connection', { url: nextUrl })
      return connectPromise
    }
  }

  clearReconnectTimer()
  manualClose = false

  if (socket && currentSocketUrl !== nextUrl) {
    const previousSocket = socket
    socket = null
    previousSocket.close()
  }

  currentSocketUrl = nextUrl
  console.info('[WS] connecting', { url: nextUrl })
  const ws = new WebSocket(nextUrl)
  socket = ws
  connectPromise = new Promise<WebSocket>((resolve, reject) => {
    attachSocketHandlers(ws, resolve, reject)
  }).finally(() => {
    connectPromise = null
  })
  return connectPromise
}

function removeEventListener(event: string, callback?: MessageCallback) {
  const listeners = eventListeners.get(event)
  if (!listeners) {
    return false
  }
  if (callback) {
    listeners.delete(callback)
  } else {
    listeners.clear()
  }
  if (listeners.size === 0) {
    eventListeners.delete(event)
    return true
  }
  return false
}

export default {
  connect(options: ConnectSocketOption) {
    return connectInternal(options)
  },

  resolveDefaultUrl(path = '/websocket/message') {
    return resolveDefaultSocketUrl(path)
  },

  close() {
    manualClose = true
    clearReconnectTimer()
    rejectPendingRequests('WebSocket 已手动关闭')
    if (!socket) {
      return Promise.resolve(undefined)
    }
    const ws = socket
    return new Promise((resolve) => {
      const closeHandler = (event: CloseEvent) => {
        ws.removeEventListener('close', closeHandler)
        resolve(event)
      }
      ws.addEventListener('close', closeHandler)
      ws.close()
    })
  },

  send(msg: Message) {
    sendInternal(msg)
  },

  asyncSend(msg: Message) {
    return asyncSendInternal(msg)
  },

  on(event: string, callback: MessageCallback) {
    const listeners = eventListeners.get(event) ?? new Set<MessageCallback>()
    const isFirstSubscriber = listeners.size === 0
    listeners.add(callback)
    eventListeners.set(event, listeners)
    console.info('[WS] register listener', { event, listenerCount: listeners.size })
    if (isFirstSubscriber) {
      sendSubscription(event, 'subscribe')
    }
    return () => this.off(event, callback)
  },

  off(event: string, callback?: MessageCallback) {
    const removedAll = removeEventListener(event, callback)
    console.info('[WS] remove listener', {
      event,
      removedAll,
      listenerCount: eventListeners.get(event)?.size ?? 0,
    })
    if (removedAll) {
      sendSubscription(event, 'unsubscribe')
    }
  },

  onMessage(callback: MessageCallback) {
    defaultMessageListeners.add(callback)
    return () => defaultMessageListeners.delete(callback)
  },

  onError(callback: ErrorCallback) {
    errorListeners.add(callback)
    return () => errorListeners.delete(callback)
  },

  onClose(callback: CloseCallback) {
    closeListeners.add(callback)
    return () => closeListeners.delete(callback)
  },
}
