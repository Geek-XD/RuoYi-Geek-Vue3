import type { LoginForm, RegisterForm } from '@ruoyi/core/types/user'

type TokenResponse = {
  token?: string
  data?: string
  msg?: string
}

export interface Handlers {
  [key: `${string}Login`]: (data: LoginForm) => Promise<TokenResponse>
  [key: `${string}Register`]: (data: RegisterForm) => Promise<unknown>
}

const authHandlers: Handlers = {}

export function registerHandlers<K extends keyof Handlers>(key: K, handlers: Handlers[K]) {
  authHandlers[key] = handlers
}

export function getHandler<K extends keyof Handlers>(key: K): Handlers[K] {
  const handler = authHandlers[key]
  if (!handler) {
    throw new Error(`[core] auth handler for ${key} is not registered`)
  }
  return handler
}
