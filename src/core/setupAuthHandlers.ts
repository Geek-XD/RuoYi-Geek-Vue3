import { login, register, verifyPhoneCode, verifyEmailCode } from '@/api/login'
import { registerAuthHandlers } from '@ruoyi/core/adapters/auth'

export function setupCoreAuthHandlers() {
  registerAuthHandlers({
    passwordLogin: async (data) => {
      const res = await login(data)
      return { token: (res as any).token, data: (res as any).data, msg: (res as any).msg }
    },
    phoneLogin: async (data) => {
      const res = await verifyPhoneCode(data, 'login')
      return { token: (res as any).token, data: (res as any).data, msg: (res as any).msg }
    },
    emailLogin: async (data) => {
      const res = await verifyEmailCode(data, 'login')
      return { token: (res as any).token, data: (res as any).data, msg: (res as any).msg }
    },
    passwordRegister: (data) => register(data),
    phoneRegister: (data) => verifyPhoneCode(data, 'register'),
    emailRegister: (data) => verifyEmailCode(data, 'register'),
  })
}
