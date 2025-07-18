import { Router } from 'vue-router'
import NProgress from 'nprogress'

/** 路由全局后置守卫 */
export function setupAfterEachGuard(router: Router) {
  router.afterEach(() => {
    NProgress.done()
  })
}