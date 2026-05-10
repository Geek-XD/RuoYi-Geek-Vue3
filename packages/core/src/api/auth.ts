import { getAction, postAction } from '@ruoyi/core/utils/request'
import type { UserInfo } from '@ruoyi/core/types/user'

export const getInfo = () => getAction('/getInfo') as unknown as Promise<{ 
  user: UserInfo
  roles: string[]
  permissions: string[]
  isDefaultModifyPwd: boolean
  isPasswordExpired: boolean
}>

export const logout = () => postAction('/logout')
