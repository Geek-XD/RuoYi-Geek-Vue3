import { ElMessageBox } from 'element-plus'
import { router } from '../../router'

export function clearUserSessionState(state: {
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
}) {
  state.token = ''
  state.name = ''
  state.nickName = ''
  state.avatar = ''
  state.roleName = ''
  state.deptName = ''
  state.loginDate = ''
  state.roles = []
  state.permissions = []
  state.isDefaultModifyPwd = null
  state.isPasswordExpired = null
}

export function handlePasswordSafetyPrompt(res: any, state: { isDefaultModifyPwd: boolean | null; isPasswordExpired: boolean | null }) {
  if (res.isDefaultModifyPwd && state.isPasswordExpired === null) {
    state.isPasswordExpired = res.isPasswordExpired
    ElMessageBox.confirm('您的密码还是初始密码，请修改密码！', '安全提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
      router.push({ name: 'Profile', params: { activeTab: 'resetPwd' } })
    }).catch(() => {})
  }
  if (!res.isDefaultModifyPwd && res.isPasswordExpired && state.isPasswordExpired === null) {
    state.isDefaultModifyPwd = res.isDefaultModifyPwd
    ElMessageBox.confirm('您的密码已过期，请尽快修改密码！', '安全提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
      router.push({ name: 'Profile', params: { activeTab: 'resetPwd' } })
    }).catch(() => {})
  }
}
