import useTagsViewStore from '@/store/modules/tagsView'
import router from '@/router'
import { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router';

export default {
  // 刷新当前tab页签
  async refreshPage(obj: any | undefined) {
    const { path, query, matched } = router.currentRoute.value;
    if (obj === undefined) {
      matched.forEach((m) => {
        if (m.components && m.components.default && m.components.default.name) {
          if (!['Layout', 'ParentView'].includes(m.components.default.name)) {
            obj = { name: m.components.default.name, path: path, query: query };
          }
        }
      });
    }
    await useTagsViewStore().delCachedView(obj);
    const { path: path_1, query: query_1 } = obj;
    router.replace({
      path: '/redirect' + path_1,
      query: query_1
    });
  },
  // 关闭当前tab页签，打开新页签
  closeOpenPage(obj: RouteLocationRaw) {
    useTagsViewStore().delView(router.currentRoute.value);
    if (obj !== undefined) {
      return router.push(obj);
    }
  },
  // 关闭指定tab页签
  async closePage(obj: RouteLocationNormalizedLoaded | undefined) {
    if (obj === undefined) {
      const res = await useTagsViewStore().delView(router.currentRoute.value);
      await router.push(res.lastPath || '/index');
      return res;
    }
    return useTagsViewStore().delView(obj);
  },
  // 关闭所有tab页签
  closeAllPage() {
    return useTagsViewStore().delAllViews();
  },
  // 关闭左侧tab页签
  closeLeftPage(obj: RouteLocationNormalizedLoaded | undefined | null) {
    return useTagsViewStore().delLeftTags(obj || router.currentRoute.value);
  },
  // 关闭右侧tab页签
  closeRightPage(obj: RouteLocationNormalizedLoaded | undefined | null) {
    return useTagsViewStore().delRightTags(obj || router.currentRoute.value);
  },
  // 关闭其他tab页签
  closeOtherPage(obj: RouteLocationNormalizedLoaded | undefined | null) {
    return useTagsViewStore().delOthersViews(obj || router.currentRoute.value);
  },
  // 打开tab页签
  openPage(url: RouteLocationRaw) {
    return router.push(url);
  },
  // 修改tab页签
  updatePage(obj: RouteLocationNormalizedLoaded) {
    return useTagsViewStore().updateVisitedView(obj);
  }
}
