<script setup lang="ts">
import iframeToggle from "./IframeToggle/index.vue"
import copyright from "./Copyright/index.vue"
import useTagsViewStore from '@ruoyi/core/store/modules/tagsView'
import useSettingsStore from '@ruoyi/core/store/modules/settings'
import { computed } from "vue"

const tagsViewStore = useTagsViewStore()
const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const fixedHeader = computed(() => settingsStore.fixedHeader);
</script>
<template>
  <section class="app-main" :class="{ hasTagsView: needTagsView, fixedHeader: fixedHeader }">
    <router-view v-slot="{ Component, route }">
      <transition :name="(!!route.meta && !!route.meta.transition) ? '' + route.meta.transition : 'fade-transform'"
        mode="out-in">
        <keep-alive :include="tagsViewStore.cachedViews">
          <component v-if="!route.meta.link" :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>
    <iframe-toggle />
    <copyright />
  </section>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/variables.module.scss";

.app-main {
  min-height: calc(100% - variables.$navbar-height);
  width: 100%;
  position: relative;
  overflow: hidden;

  &:has(.copyright) {
    padding-bottom: 36px;
  }

  &.hasTagsView {
    min-height: calc(100% - variables.$navbar-height - variables.$tags-view-height);
  }

  &.fixedHeader {
    padding-top: variables.$tags-view-height;
    min-height: 100%;

    &.hasTagsView {
      padding-top: (variables.$navbar-height + variables.$tags-view-height);
    }
  }
}
</style>