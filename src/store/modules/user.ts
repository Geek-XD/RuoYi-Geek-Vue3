import { login, logout, getInfo, register, verifyPhoneCode, verifyEmailCode } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import defAva from '@/assets/images/profile.jpg'
import { defineStore } from 'pinia'
import { LoginForm, RegisterForm, RoleInfo, UserInfo } from '@/types/user'

const useUserStore = defineStore(
  'user',
  {
    state: () => ({
      token: getToken(),
      name: '',
      avatar: '',
      roleName: '',
      deptName: '',
      loginDate: '',
      roles: [] as string[],
      permissions: [] as string[]
    }),
    actions: {
      // 登录
      login(userInfo: LoginForm, method: 'password' | 'phone' | 'email' = 'password') {
        let handel = {
          'password': login,
          'phone': (userInfo: LoginForm) => verifyPhoneCode(userInfo, 'login'),
          'email': (userInfo: LoginForm) => verifyEmailCode(userInfo, 'login')
        }
        return new Promise((resolve, reject) => {
          handel[method](userInfo).then((res: any) => {
            const token = res.token ?? res.data ?? res.msg
            setToken(token)
            this.token = token
            resolve(null)
          }).catch(error => {
            reject(error)
          })
        })
      },
      register(registerForm: RegisterForm, method: 'password' | 'phone' | 'email' = 'password') {
        let handle = {
          'password': register,
          'phone': (registerForm: RegisterForm) => verifyPhoneCode(registerForm, 'register'),
          'email': (registerForm: RegisterForm) => verifyEmailCode(registerForm, 'register')
        }
        return handle[method](registerForm)
      },
      // 获取用户信息
      getInfo() {
        return new Promise<{ user: UserInfo, roles: RoleInfo[], permissions: string[] }>((resolve, reject) => {
          getInfo().then((res: any) => {
            const user = res.user
            if (res.roles && res.roles.length > 0) { // 验证返回的roles是否是一个非空数组
              this.roles = res.roles
              this.permissions = res.permissions
            } else {
              this.roles = ['ROLE_DEFAULT']
            }
            this.name = user.userName
            this.roleName = (user.roles || [])[0] ? user.roles[0].roleName : '普通角色'
            this.deptName = user.dept ? user.dept.deptName : '暂无部门'
            this.loginDate = user.loginDate
            if (user.avatar == "" || user.avatar == null) {
              this.avatar = defAva
            } else {
              this.avatar = user.avatar.startsWith('http') ? user.avatar : import.meta.env.VITE_APP_BASE_API + user.avatar;
            }
            resolve(res)
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 退出系统
      logOut() {
        return new Promise((resolve, reject) => {
          logout().then(() => {
            this.token = ''
            this.roles = []
            this.permissions = []
            removeToken()
            resolve(null)
          }).catch(error => {
            reject(error)
          })
        })
      }
    }
  })

export default useUserStore
