<script setup lang="ts">
import ScrollPane from './ScrollPane.vue'
import { getNormalPath } from '@/utils/ruoyi'
import useTagsViewStore from '@/store/modules/tagsView'
import usePermissionStore from '@/store/modules/permission'
import { tab } from '@/plugins'
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { RouteLocationNormalizedGeneric, useRoute, useRouter } from 'vue-router'
import { RouteItem } from '@/types/route'
import { RoutesAlias } from '@/router/routesAlias'

const visible = ref(false);
const top = ref(0);
const left = ref(0);
const selectedTag = ref({} as RouteLocationNormalizedGeneric);
const affixTags = ref<RouteLocationNormalizedGeneric[]>([]);
const scrollPaneRef = ref<any>(null);
const route = useRoute();
const router = useRouter();

const visitedViews = computed(() => useTagsViewStore().visitedViews);
const routes = computed(() => usePermissionStore().routes);

watch(route, () => {
  addTags()
  moveToCurrentTag()
})
watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu)
  } else {
    document.body.removeEventListener('click', closeMenu)
  }
})
onMounted(() => {
  initTags()
  addTags()
})

function isActive(r: RouteLocationNormalizedGeneric) {
  return r.path === route.path
}
function isAffix(tag: RouteLocationNormalizedGeneric) {
  return tag.meta && tag.meta.affix
}
function isFirstView() {
  try {
    return selectedTag.value.fullPath === visitedViews.value[1].fullPath || selectedTag.value.fullPath === RoutesAlias.Home
  } catch (err) {
    return false
  }
}
function isLastView() {
  try {
    return selectedTag.value.fullPath === visitedViews.value[visitedViews.value.length - 1].fullPath
  } catch (err) {
    return false
  }
}
function filterAffixTags(routes: RouteItem[], basePath = '') {
  let tags: RouteLocationNormalizedGeneric[] = []
  routes.forEach(route => {
    if (route.meta && route.meta.affix) {
      const tagPath = getNormalPath(basePath + '/' + route.path)
      tags.push({
        fullPath: tagPath,
        path: tagPath,
        name: route.name,
        meta: { ...route.meta }
      } as RouteLocationNormalizedGeneric)
    }
    if (route.children) {
      const tempTags = filterAffixTags(route.children, route.path)
      if (tempTags.length >= 1) {
        tags = [...tags, ...tempTags]
      }
    }
  })
  return tags
}
function initTags() {
  const res = filterAffixTags(routes.value);
  affixTags.value = res;
  for (const tag of res) {
    // Must have tag name
    if (tag.name) {
      useTagsViewStore().addVisitedView(tag)
    }
  }
}
function addTags() {
  const { name } = route
  if (name) {
    useTagsViewStore().addView(route)
    if (route.meta.link) {
      useTagsViewStore().addIframeView(route);
    }
  }
  return false
}
function moveToCurrentTag() {
  nextTick(() => {
    for (const r of visitedViews.value) {
      if (r.path === route.path) {
        scrollPaneRef.value.moveToTarget(r);
        // when query is different then update
        if (r.fullPath !== route.fullPath) {
          useTagsViewStore().updateVisitedView(route)
        }
      }
    }
  })
}
function refreshSelectedTag(view: RouteLocationNormalizedGeneric) {
  tab.refreshPage(view);
  if (route.meta.link) {
    useTagsViewStore().delIframeView(route);
  }
}
function closeSelectedTag(view: RouteLocationNormalizedGeneric) {
  tab.closePage(view).then(({ visitedViews }) => {
    if (isActive(view)) {
      toLastView(visitedViews, view)
    }
  })
}
function closeRightTags() {
  tab.closeRightPage(selectedTag.value).then(visitedViews => {
    if (!visitedViews.find(i => i.fullPath === route.fullPath)) {
      toLastView(visitedViews)
    }
  })
}
function closeLeftTags() {
  tab.closeLeftPage(selectedTag.value).then(visitedViews => {
    if (!visitedViews.find(i => i.fullPath === route.fullPath)) {
      toLastView(visitedViews)
    }
  })
}
function closeOthersTags() {
  router.push(selectedTag.value).catch(() => { });
  tab.closeOtherPage(selectedTag.value).then(() => {
    moveToCurrentTag()
  })
}
function closeAllTags(view: RouteLocationNormalizedGeneric) {
  tab.closeAllPage().then(({ visitedViews }) => {
    if (affixTags.value.some(tag => tag.path === route.path)) {
      return;
    }
    toLastView(visitedViews, view)
  })
}
function toLastView(visitedViews: RouteLocationNormalizedGeneric[], view?: RouteLocationNormalizedGeneric) {
  const latestView = visitedViews.slice(-1)[0]
  if (latestView) {
    router.push(latestView.fullPath)
  } else {
    // now the default is to redirect to the home page if there is no tags-view,
    // you can adjust it according to your needs.
    if (view?.name === 'Dashboard') {
      // to reload home page
      router.replace({ path: '/redirect' + view.fullPath })
    } else {
      router.push('/')
    }
  }
}
const proxy = getCurrentInstance()!.proxy!;
function openMenu(tag: RouteLocationNormalizedGeneric, e: MouseEvent) {
  const menuMinWidth = 105
  const offsetLeft = proxy.$el.getBoundingClientRect().left // container margin left
  const offsetWidth = proxy.$el.offsetWidth // container width
  const maxLeft = offsetWidth - menuMinWidth // left boundary
  const l = e.clientX - offsetLeft + 15 // 15: margin right

  if (l > maxLeft) {
    left.value = maxLeft
  } else {
    left.value = l
  }

  top.value = e.clientY
  visible.value = true
  selectedTag.value = tag
}
function closeMenu() {
  visible.value = false
}
function handleScroll() {
  closeMenu()
}
</script>

<template>
  <div id="tags-view-container" class="tags-view-container">
    <scroll-pane ref="scrollPaneRef" class="tags-view-wrapper" @scroll="handleScroll">
      <router-link v-for="tag in visitedViews" :key="tag.path" class="tags-view-item"
        :class="isActive(tag) ? 'active' : ''" :data-path="tag.path" :to="{ path: tag.path, query: tag.query }"
        @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''" @contextmenu.prevent="openMenu(tag, $event)">
        {{ tag.title }}
        <span v-if="!isAffix(tag)" @click.prevent.stop="closeSelectedTag(tag)">
          <close class="el-icon-close" style="width: 1em; height: 1em;vertical-align: middle;" />
        </span>
      </router-link>
    </scroll-pane>
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">
        <refresh-right style="width: 1em; height: 1em;" /> 刷新页面
      </li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">
        <close style="width: 1em; height: 1em;" /> 关闭当前
      </li>
      <li @click="closeOthersTags">
        <circle-close style="width: 1em; height: 1em;" /> 关闭其他
      </li>
      <li v-if="!isFirstView()" @click="closeLeftTags">
        <back style="width: 1em; height: 1em;" /> 关闭左侧
      </li>
      <li v-if="!isLastView()" @click="closeRightTags">
        <right style="width: 1em; height: 1em;" /> 关闭右侧
      </li>
      <li @click="closeAllTags(selectedTag)">
        <circle-close style="width: 1em; height: 1em;" /> 全部关闭
      </li>
    </ul>
  </div>
</template>
<style lang='scss' scoped>
@use "@/assets/styles/variables.module.scss";

.tags-view-container {
  height: variables.$tags-view-height;
  width: 100%;
  background: variables.$tags-view-color;

  @if variables.$tags-view-color !=variables.$page-background-color {
    border-bottom: 1px solid #d8dce5;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 0 3px 0 rgba(0, 0, 0, 0.04);
  }

  .tags-view-wrapper {
    padding: 0 15px;

    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: calc(variables.$tags-view-height - 10px);
      line-height: calc(variables.$tags-view-height - 10px);
      border: 1px solid #d8dce5;
      color: #495060;
      background: #fff;
      padding: 0 8px;
      font-size: 13px;
      margin-top: 4px;
      border-radius: 5px;

      &+.tags-view-item {
        margin-left: 10px;
      }

      &:hover {
        color: var(--el-color-primary);
      }

      &.active {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary);
        color: #fff;

        &::before {
          content: "";
          background: #fff;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          margin-right: 2px;
        }
      }

      :deep(.el-icon-close) {
        width: 16px;
        height: 16px;
        vertical-align: 2px;
        border-radius: 50%;
        text-align: center;
        transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        transform-origin: 100% 50%;

        &:before {
          transform: scale(0.6);
          display: inline-block;
          vertical-align: -3px;
        }

        &:hover {
          background-color: #b4bccc;
          color: #fff;
        }
      }
    }
  }

  .contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);

    li {
      margin: 0;
      padding: 7px 16px;
      cursor: pointer;

      &:hover {
        background: #eee;
      }
    }
  }
}
</style>