<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import Breadcrumb from './Breadcrumb.vue'
import TopNav from './TopNav.vue'
import RuoYiGitee from './RuoYi/Git/gitee.vue'
import RuoYiGithub from './RuoYi/Git/github.vue'
import RuoYiDoc from './RuoYi/Doc/index.vue'
import Hamburger from '@/components/Hamburger/index.vue'
import Screenfull from '@/components/Screenfull/index.vue'
import SizeSelect from '@/components/SizeSelect/index.vue'
import HeaderSearch from '@/components/HeaderSearch/index.vue'
import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import { useRouter } from 'vue-router'
import { RoutesAlias } from '@/router/routesAlias'

const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const router = useRouter()

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
</script>
<template>
  <div class="navbar">
    <!-- 侧边栏切换按钮 -->
    <hamburger id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container"
      @toggleClick="appStore.toggleSideBar(false)" />

    <!-- 顶部导航栏 -->
    <top-nav id="topmenu-container" class="topmenu-container" v-if="settingsStore.topNav" />
    <!-- 面包屑导航栏 -->
    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-else />

    <!-- 右侧菜单 -->
    <div class="right-menu">
      <template v-if="appStore.device !== 'mobile'">
        <header-search id="header-search" class="right-menu-item" />

        <el-tooltip content="gitee源码地址" effect="dark" placement="bottom">
          <ruo-yi-gitee id="ruoyi-gitee" class="right-menu-item hover-effect" />
        </el-tooltip>

        <el-tooltip content="github源码地址" effect="dark" placement="bottom">
          <ruo-yi-github id="ruoyi-github" class="right-menu-item hover-effect" />
        </el-tooltip>

        <el-tooltip content="文档地址" effect="dark" placement="bottom">
          <ruo-yi-doc id="ruoyi-doc" class="right-menu-item hover-effect" />
        </el-tooltip>

        <el-tooltip content="专注模式" effect="dark" placement="bottom">
          <screenfull id="screenfull" class="right-menu-item hover-effect" />
        </el-tooltip>

        <el-tooltip content="布局大小" effect="dark" placement="bottom">
          <size-select id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip>
      </template>
      <div class="avatar-container">
        <el-dropdown @command="handleCommand" class="right-menu-item hover-effect" trigger="click">
          <div class="avatar-wrapper">
            <img :src="userStore.avatar" class="user-avatar" />
            <el-icon><caret-bottom /></el-icon>
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

  @if variables.$navbar-color !=variables.$page-background-color {
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  }

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;
    display: flex;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
    }

    .avatar-container {
      margin-right: 40px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        i {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>
