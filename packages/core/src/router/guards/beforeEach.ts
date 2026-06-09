import type { Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import { getToken } from '@ruoyi/core/utils/auth'
import { isRelogin } from '@ruoyi/core/utils/request'
import { isPathMatch } from '@ruoyi/core/utils/validate'
import useUserStore from '@ruoyi/core/store/modules/user'
import useSettingsStore from '@ruoyi/core/store/modules/settings'
import usePermissionStore from '@ruoyi/core/store/modules/permission'
import { RoutesAlias } from '../routesAlias'

const whiteList: string[] = [RoutesAlias.Login, RoutesAlias.Register, '/online/runtime/*']
const isWhiteList = (path: string) => whiteList.some(pattern => isPathMatch(pattern, path))
const computerTitle = <F extends (...args: any[]) => any>(fun?: F | string, ...args: Parameters<F>) =>
  typeof fun === 'function' ? fun(...args) : fun ?? ''

/**
 * 路由全局前置守卫
 * 处理进度条、获取菜单列表、动态路由注册、404 检查、工作标签页及页面标题设置
 */
export function setupBeforeEachGuard(router: Router): void {
  router.beforeEach(async (to, from) => {
    // 基础UI状态设置
    useSettingsStore().setTitle(computerTitle(to.meta.title, to))
    NProgress.start()

    // 白名单放行
    if (isWhiteList(to.path)) return

    // 其他路由需要验证权限
    if (getToken()) {
      const userStore = useUserStore()
      if (userStore.roles.length !== 0) return
      try {
        isRelogin.show = true
        await userStore.getInfo()
        isRelogin.show = false
        await usePermissionStore().resolveAndRegisterRoutes(to.path)
        return { ...to, replace: true }
      } catch (err: any) {
        await userStore.logOut()
        ElMessage.error(err.message)
        return RoutesAlias.Login
      }
    } else return to.fullPath
      ? { path: RoutesAlias.Login, query: { redirect: to.fullPath } }
      : RoutesAlias.Login
  })
}
