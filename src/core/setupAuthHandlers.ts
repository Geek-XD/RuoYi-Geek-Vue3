import { login, register, verifyPhoneCode, verifyEmailCode } from '@/api/login'
import { registerHandlers } from '@ruoyi/core/adapters/auth'

export function setupCoreAuthHandlers() {
  registerHandlers('passwordLogin', async (data) => {
    const res = await login(data)
    return { token: (res as any).token, data: (res as any).data, msg: (res as any).msg }
  })
  registerHandlers('phoneLogin', async (data) => {
    const res = await verifyPhoneCode(data, 'login')
    return { token: (res as any).token, data: (res as any).data, msg: (res as any).msg }
  })
  registerHandlers('emailLogin', async (data) => {
    const res = await verifyEmailCode(data, 'login')
    return { token: (res as any).token, data: (res as any).data, msg: (res as any).msg }
  })


  registerHandlers('passwordRegister', (data) => register(data))
  registerHandlers('phoneRegister', (data) => verifyPhoneCode(data, 'register'))
  registerHandlers('emailRegister', (data) => verifyEmailCode(data, 'register'))
}
