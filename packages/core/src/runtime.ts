import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'
import type { LoginForm, RegisterForm } from './types/user'

interface AuthRuntime {
  getPermissions: () => string[]
  getRoles: () => string[]
}

interface RequestRuntime {
  onUnauthorized?: () => Promise<void> | void
}

interface TabRuntime {
  getCurrentRoute: () => RouteLocationNormalizedLoaded
  push: (to: RouteLocationRaw) => Promise<unknown> | unknown
  replace: (to: RouteLocationRaw) => Promise<unknown> | unknown
  resolveHomeRoute: () => RouteLocationRaw
  delCachedView: (view: unknown) => Promise<unknown> | unknown
  delView: (view: unknown) => Promise<{ lastPath?: string } | unknown> | { lastPath?: string } | unknown
  delAllViews: () => Promise<unknown> | unknown
  delLeftTags: (view: unknown) => Promise<unknown> | unknown
  delRightTags: (view: unknown) => Promise<unknown> | unknown
  delOthersViews: (view: unknown) => Promise<unknown> | unknown
  updateVisitedView: (view: unknown) => unknown
}

interface UserRuntime {
  login: (userInfo: LoginForm) => Promise<any>
  register: (registerForm: RegisterForm) => Promise<any>
  verifyPhoneCode: (payload: LoginForm | RegisterForm, type: 'login' | 'register') => Promise<any>
  verifyEmailCode: (payload: LoginForm | RegisterForm, type: 'login' | 'register') => Promise<any>
  getInfo: () => Promise<any>
  logout: () => Promise<any>
  resolveAvatar?: (avatar?: string | null) => string
  openResetPassword?: () => void
}

const runtimeState: {
  auth?: AuthRuntime
  request?: RequestRuntime
  tab?: TabRuntime
  user?: UserRuntime
} = {}

export function installAuthRuntime(runtime: AuthRuntime) {
  runtimeState.auth = runtime
}

export function installRequestRuntime(runtime: RequestRuntime) {
  runtimeState.request = runtime
}

export function installTabRuntime(runtime: TabRuntime) {
  runtimeState.tab = runtime
}

export function installUserRuntime(runtime: UserRuntime) {
  runtimeState.user = runtime
}

export function getAuthRuntime() {
  if (!runtimeState.auth) {
    throw new Error('Core auth runtime is not installed')
  }
  return runtimeState.auth
}

export function getRequestRuntime() {
  return runtimeState.request
}

export function getTabRuntime() {
  if (!runtimeState.tab) {
    throw new Error('Core tab runtime is not installed')
  }
  return runtimeState.tab
}

export function getUserRuntime() {
  if (!runtimeState.user) {
    throw new Error('Core user runtime is not installed')
  }
  return runtimeState.user
}