import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'
import { getTabRuntime } from '../runtime'

const tab = {
  async refreshPage(obj: any | undefined) {
    const tabRuntime = getTabRuntime()
    const currentRoute = tabRuntime.getCurrentRoute()
    const { path, query, matched } = currentRoute
    if (obj === undefined) {
      matched.forEach((item) => {
        if (item.components && item.components.default && item.components.default.name) {
          if (!['Layout', 'ParentView'].includes(item.components.default.name)) {
            obj = { name: item.components.default.name, path, query }
          }
        }
      })
    }
    await tabRuntime.delCachedView(obj)
    const { path: currentPath, query: currentQuery } = obj
    tabRuntime.replace({ path: '/redirect' + currentPath, query: currentQuery })
  },
  closeOpenPage(obj: RouteLocationRaw) {
    const tabRuntime = getTabRuntime()
    tabRuntime.delView(tabRuntime.getCurrentRoute())
    if (obj !== undefined) {
      return tabRuntime.push(obj)
    }
  },
  async closePage(obj: RouteLocationNormalizedLoaded | undefined) {
    const tabRuntime = getTabRuntime()
    if (obj === undefined) {
      const res = await tabRuntime.delView(tabRuntime.getCurrentRoute()) as { lastPath?: string }
      await tabRuntime.push(res.lastPath || tabRuntime.resolveHomeRoute())
      return res
    }
    return tabRuntime.delView(obj)
  },
  closeAllPage() {
    return getTabRuntime().delAllViews()
  },
  closeLeftPage(obj: RouteLocationNormalizedLoaded | undefined | null) {
    const tabRuntime = getTabRuntime()
    return tabRuntime.delLeftTags(obj || tabRuntime.getCurrentRoute())
  },
  closeRightPage(obj: RouteLocationNormalizedLoaded | undefined | null) {
    const tabRuntime = getTabRuntime()
    return tabRuntime.delRightTags(obj || tabRuntime.getCurrentRoute())
  },
  closeOtherPage(obj: RouteLocationNormalizedLoaded | undefined | null) {
    const tabRuntime = getTabRuntime()
    return tabRuntime.delOthersViews(obj || tabRuntime.getCurrentRoute())
  },
  openPage(url: RouteLocationRaw) {
    return getTabRuntime().push(url)
  },
  updatePage(obj: RouteLocationNormalizedLoaded) {
    return getTabRuntime().updateVisitedView(obj)
  }
}

export default tab
export { tab }