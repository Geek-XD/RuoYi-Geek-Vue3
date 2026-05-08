import { getAuthHandlers } from '@ruoyi/core/adapters/auth'
import { getInfo, logout } from '@ruoyi/core/api/auth'
import { getToken, setToken, removeToken } from '@ruoyi/core/utils/auth'
import { defineStore } from 'pinia'
import { LoginForm, RegisterForm } from '@ruoyi/core/types/user'
import { resetAccessRoutes } from '../../router/routeManager'
import usePermissionStore from './permission'
import { clearUserSessionState, handlePasswordSafetyPrompt } from '../helpers/user'

const DEFAULT_AVATAR = '/src/assets/images/profile.jpg'

interface UserState {
  token?: string | null
  name: string
  nickName: string
  avatar: string
  roleName: string
  deptName: string
  loginDate: string
  roles: string[]
  permissions: string[]
  isDefaultModifyPwd: boolean | null
  isPasswordExpired: boolean | null
}

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken(),
    name: '',
    nickName: '',
    avatar: '',
    roleName: '',
    deptName: '',
    loginDate: '',
    roles: [],
    permissions: [],
    isDefaultModifyPwd: null,
    isPasswordExpired: null
  }),
  actions: {
    /** 登录 */
    async login(userInfo: LoginForm, method: 'password' | 'phone' | 'email' = 'password') {
      const auth = getAuthHandlers()
      const handlerName = `${method}Login` as const
      const res: any = await auth[handlerName](userInfo)
      const token = res.token ?? res.data ?? res.msg
      setToken(token)
      this.token = token
    },
    register(registerForm: RegisterForm, method: 'password' | 'phone' | 'email' = 'password') {
      const auth = getAuthHandlers()
      const handlerName = `${method}Register` as const
      return auth[handlerName](registerForm)
    },
    /** 获取用户信息 */
    async getInfo() {
      const res = await getInfo()
      const user = res.user
      if (res.roles && res.roles.length > 0) { // 验证返回的roles是否是一个非空数组
        this.roles = res.roles
        this.permissions = res.permissions
      } else {
        this.roles = ['ROLE_DEFAULT']
      }
      this.name = user.userName
      this.nickName = user.nickName
      this.roleName = (user.roles || [])[0] ? user.roles[0].roleName : '普通角色'
      this.deptName = user.dept ? user.dept.deptName : '暂无部门'
      this.loginDate = user.loginDate
      if (user.avatar == "" || user.avatar == null) {
        this.avatar = DEFAULT_AVATAR
      } else {
        this.avatar = user.avatar.startsWith('http') ? user.avatar : import.meta.env.VITE_APP_BASE_API + user.avatar;
      }
      /* 初始密码提示 */
      handlePasswordSafetyPrompt(res, this)
      return res
    },
    // 退出系统
    async logOut() {
      try {
        await logout()
      } finally {
        clearUserSessionState(this)
        resetAccessRoutes()
        usePermissionStore().resetRouteData()
        removeToken()
      }
    }
  }
})

export default useUserStore
