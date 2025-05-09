import { RouteItem } from "@/types/route";
import { defineStore } from "pinia";
import { RouteLocationNormalizedLoaded, RouteRecordName } from "vue-router";

const useTagsViewStore = defineStore("tags-view", {
  state: () => ({
    visitedViews: Array<RouteItem>(),
    cachedViews: Array<RouteRecordName | null | undefined>(),
    iframeViews: Array<RouteItem & { title: string }>(),
  }),
  actions: {
    addView(view: RouteItem) {
      if (typeof view.meta?.group === 'function') view.meta.group = view.meta.group(view)
      if (typeof view.meta?.title === 'function') view.meta.title = view.meta.title(view)
      this.addVisitedView(view);
      this.addCachedView(view);
    },
    addIframeView(view: RouteItem) {
      if (this.iframeViews.some((v) => v.path === view.path)) return;
      this.iframeViews.push(
        Object.assign({}, view, {
          title: typeof view.meta?.title === 'function' ?
            view.meta?.title(view) : view.meta?.title || "no-name",
        })
      );
    },
    addVisitedView(view: RouteItem) {
      if (this.visitedViews.some((v) => v.path === view.path)) return;
      const _view = view.meta?.group ? this.visitedViews.find((v) => v.meta?.group == view.meta?.group) : undefined
      if (_view) {
        Object.assign(_view, view);
      } else {
        this.visitedViews.push(
          Object.assign({}, view, {
            title: view.meta?.title || "no-name",
          })
        );
      }
    },
    addCachedView(view: RouteItem) {
      if (this.cachedViews.includes(view.name)) return;
      if (!view.meta?.noCache) {
        this.cachedViews.push(view.name);
      }
    },
    delView(view: RouteItem) {
      return new Promise<any>((resolve) => {
        this.delVisitedView(view);
        this.delCachedView(view);
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews],
        });
      });
    },
    delVisitedView(view: RouteItem) {
      return new Promise((resolve) => {
        for (const [i, v] of this.visitedViews.entries()) {
          if (v.path === view.path) {
            this.visitedViews.splice(i, 1);
            break;
          }
        }
        this.iframeViews = this.iframeViews.filter(
          (item) => item.path !== view.path
        );
        resolve([...this.visitedViews]);
      });
    },
    delIframeView(view: RouteLocationNormalizedLoaded) {
      return new Promise((resolve) => {
        this.iframeViews = this.iframeViews.filter(
          (item) => item.path !== view.path
        );
        resolve([...this.iframeViews]);
      });
    },
    delCachedView(view: RouteItem) {
      return new Promise((resolve) => {
        const index = this.cachedViews.indexOf(view.name);
        index > -1 && this.cachedViews.splice(index, 1);
        resolve([...this.cachedViews]);
      });
    },
    delOthersViews(view: RouteItem) {
      return new Promise((resolve) => {
        this.delOthersVisitedViews(view);
        this.delOthersCachedViews(view);
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews],
        });
      });
    },
    delOthersVisitedViews(view: RouteItem) {
      return new Promise((resolve) => {
        this.visitedViews = this.visitedViews.filter((v) => {
          return v.meta?.affix || v.path === view.path;
        });
        this.iframeViews = this.iframeViews.filter(
          (item) => item.path === view.path
        );
        resolve([...this.visitedViews]);
      });
    },
    delOthersCachedViews(view: RouteItem) {
      return new Promise((resolve) => {
        const index = this.cachedViews.indexOf(view.name);
        if (index > -1) {
          this.cachedViews = this.cachedViews.slice(index, index + 1);
        } else {
          this.cachedViews = [];
        }
        resolve([...this.cachedViews]);
      });
    },
    delAllViews() {
      return new Promise((resolve) => {
        this.delAllVisitedViews();
        this.delAllCachedViews();
        resolve({
          visitedViews: [...this.visitedViews],
          cachedViews: [...this.cachedViews],
        });
      });
    },
    delAllVisitedViews() {
      return new Promise((resolve) => {
        const affixTags = this.visitedViews.filter((tag) => tag.meta?.affix);
        this.visitedViews = affixTags;
        this.iframeViews = [];
        resolve([...this.visitedViews]);
      });
    },
    delAllCachedViews() {
      return new Promise((resolve) => {
        this.cachedViews = [];
        resolve([...this.cachedViews]);
      });
    },
    updateVisitedView(view: RouteLocationNormalizedLoaded) {
      for (let v of this.visitedViews) {
        if (v.path === view.path) {
          v = Object.assign(v, view);
          break;
        }
      }
    },
    delRightTags(view: RouteLocationNormalizedLoaded) {
      return new Promise((resolve) => {
        const index = this.visitedViews.findIndex((v) => v.path === view.path);
        if (index === -1) {
          return;
        }
        this.visitedViews = this.visitedViews.filter((item, idx) => {
          if (idx <= index || (item.meta && item.meta.affix)) {
            return true;
          }
          const i = this.cachedViews.indexOf(item.name);
          if (i > -1) {
            this.cachedViews.splice(i, 1);
          }
          if (item.meta?.link) {
            const fi = this.iframeViews.findIndex((v) => v.path === item.path);
            this.iframeViews.splice(fi, 1);
          }
          return false;
        });
        resolve([...this.visitedViews]);
      });
    },
    delLeftTags(view: RouteLocationNormalizedLoaded) {
      return new Promise((resolve) => {
        const index = this.visitedViews.findIndex((v) => v.path === view.path);
        if (index === -1) {
          return;
        }
        this.visitedViews = this.visitedViews.filter((item, idx) => {
          if (idx >= index || (item.meta && item.meta.affix)) {
            return true;
          }
          const i = this.cachedViews.indexOf(item.name);
          if (i > -1) {
            this.cachedViews.splice(i, 1);
          }
          if (item.meta?.link) {
            const fi = this.iframeViews.findIndex((v) => v.path === item.path);
            this.iframeViews.splice(fi, 1);
          }
          return false;
        });
        resolve([...this.visitedViews]);
      });
    },
  },
});

export default useTagsViewStore;
