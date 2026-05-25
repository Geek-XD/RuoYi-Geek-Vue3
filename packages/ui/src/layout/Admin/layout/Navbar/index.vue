<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import Breadcrumb from './Breadcrumb.vue'
import TopNav from './TopNav.vue'
import Logo from '@ruoyi/ui/layout/Admin/components/Logo/index.vue'
import Hamburger from '@ruoyi/ui/components/Hamburger/index.vue'
import Screenfull from '@ruoyi/ui/components/Screenfull/index.vue'
import SizeSelect from '@ruoyi/ui/components/SizeSelect/index.vue'
import HeaderSearch from '@ruoyi/ui/components/HeaderSearch/index.vue'
import useAppStore from '@ruoyi/core/store/modules/app'
import useUserStore from '@ruoyi/core/store/modules/user'
import useSettingsStore from '@ruoyi/core/store/modules/settings'
import { useRouter } from 'vue-router'
import { RoutesAlias } from '@ruoyi/core/router/routesAlias'
import { computed, ref } from 'vue'

const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const router = useRouter()
const sidebarOption = computed(() => appStore.sidebar);
const showTopLogo = computed(() => settingsStore.sidebarLogo && settingsStore.topNav && sidebarOption.value.hide);


function handleCommand(command: string) {
  switch (command) {
    case "setLayout":
      setLayout();
      break;
    case "logout":
      logout();
      break;
    default:
      break;
  }
}

function logout() {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logOut().then(() => {
      location.href = router.resolve(RoutesAlias.Home).href;
    })
  }).catch(() => { });
}

const emits = defineEmits(['setLayout'])
function setLayout() {
  emits('setLayout');
}

const tooltips = ref([
  { id: 'ruoyi-gitee', url: 'https://gitee.com/geek-xd', content: 'gitee源码地址', icon: 'gitee' },
  { id: 'ruoyi-github', url: 'https://github.com/Geek-XD', content: 'github源码地址', icon: 'github' },
  { id: 'ruoyi-doc', url: 'http://doc.ruoyi.vip/ruoyi-vue', content: '文档地址', icon: 'question' },
])
const goto = (url: string) => window.open(url)
</script>
<template>
  <div class="navbar">
    <div class="navbar-left">
      <logo v-if="showTopLogo" class="navbar-logo" :collapse="false" mode="navbar" />
      <!-- 侧边栏切换按钮 -->
      <hamburger v-if="!settingsStore.isTopMenu && !showTopLogo" id="hamburger-container"
        :is-active="appStore.sidebar.opened" @toggleClick="appStore.toggleSideBar(false)" />

      <!-- 顶部导航栏 -->
      <top-nav id="topmenu-container" v-if="settingsStore.topNav" />
      <!-- 面包屑导航栏 -->
      <breadcrumb id="breadcrumb-container" v-else />
    </div>

    <!-- 右侧菜单 -->
    <div class="right-menu">
      <template v-if="appStore.device !== 'mobile'">
        <header-search id="header-search" class="right-menu-item" />

        <el-tooltip v-for="tooltip in tooltips" :key="tooltip.id" :content="tooltip.content">
          <div class="right-menu-item hover-effect svg-menu-item">
            <svg-icon :icon-class="tooltip.icon" @click="goto(tooltip.url)" />
          </div>
        </el-tooltip>

        <el-tooltip content="专注模式">
          <screenfull id="screenfull" class="right-menu-item hover-effect svg-menu-item" />
        </el-tooltip>

        <el-tooltip content="布局大小">
          <size-select id="size-select" class="right-menu-item hover-effect svg-menu-item" />
        </el-tooltip>
      </template>
      <el-dropdown @command="handleCommand" class="right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <el-avatar :size="30" :src="userStore.avatar" />
          <span>{{ userStore.name }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/user/profile">
              <el-dropdown-item>个人中心</el-dropdown-item>
            </router-link>
            <el-dropdown-item command="setLayout">
              <span>布局设置</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <div class="right-menu-item hover-effect" @click="setLayout">
        <svg-icon icon-class="more-up" />
      </div>
    </div>
  </div>
</template>



<style lang='scss' scoped>
@use "@/assets/styles/variables.module.scss";

.navbar {
  height: variables.$navbar-height;
  overflow: hidden;
  position: relative;
  background: variables.$navbar-color;
  display: flex;
  align-items: center;

  @if variables.$navbar-color !=variables.$page-background-color {
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  }

  .navbar-left {
    min-width: 0;
    height: 100%;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .navbar-logo {
    flex-shrink: 0;
    margin-right: 4px;
  }

  #hamburger-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 100%;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  #breadcrumb-container {
    min-width: 0;
    flex: 1;
  }

  #topmenu-container {
    min-width: 0;
    flex: 1;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      font-size: 18px;
      color: #5a5e66;

      &.svg-menu-item {
        height: 38px;
        width: 38px;
        border-radius: 8px;
        margin-left: 8px;
      }

      &:not(.svg-menu-item) {
        height: 100%;
      }

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: #f4f4f6;
        }
      }
    }


    .avatar-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        margin-left: 8px;
        color: #5a5e66;
        font-size: 14px;
        font-weight: bold;
      }
    }
  }
}
</style>
