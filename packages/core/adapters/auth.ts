import type { LoginForm, RegisterForm } from '@ruoyi/core/types/user'

type TokenResponse = {
  token?: string
  data?: string
  msg?: string
}

export interface AuthHandlers {
  [key: `${string}Login`]: (data: LoginForm) => Promise<TokenResponse>
  [key: `${string}Register`]: (data: RegisterForm) => Promise<unknown>
}

let authHandlers: AuthHandlers | undefined

export function registerAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers
}

export function getAuthHandlers(): AuthHandlers {
  if (!authHandlers) {
    throw new Error('[core] auth handlers are not registered')
  }
  return authHandlers
}
