import { login, logout, getInfo } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import defAva from '@/assets/images/profile.jpg'
import { defineStore } from 'pinia'
import { LoginForm, RoleInfo, UserInfo } from '@/types/user'

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
      login(userInfo: LoginForm) {
        const username = userInfo.username.trim()
        const password = userInfo.password
        const code = userInfo.code
        const uuid = userInfo.uuid
        return new Promise((resolve, reject) => {
          login(username, password, code, uuid).then((res:any) => {
            setToken(res.token)
            this.token = res.token
            resolve(null)
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 获取用户信息
      getInfo() {
        return new Promise<{user: UserInfo, roles: RoleInfo[], permissions: string[]}>((resolve, reject) => {
          getInfo().then((res:any) => {
            console.log(res);
            
            const user = res.user
            // @ts-ignore
            const avatar = (user.avatar == "" || user.avatar == null) ? defAva : import.meta.env.VITE_APP_BASE_API + user.avatar;

            if (res.roles && res.roles.length > 0) { // 验证返回的roles是否是一个非空数组
              this.roles = res.roles
              this.permissions = res.permissions
            } else {
              this.roles = ['ROLE_DEFAULT']
            }
            this.name = user.userName
            this.roleName = user.roles[0]?user.roles[0].roleName:'普通角色'
            this.deptName = user.dept?user.dept.deptName: '暂无部门'
            this.loginDate = user.loginDate
            this.avatar = avatar;
            console.log(res);
            
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
