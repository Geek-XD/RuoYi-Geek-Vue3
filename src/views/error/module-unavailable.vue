<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const moduleKey = computed(() => String(route.meta.moduleKey || 'unknown'))
const routeKey = computed(() => String(route.meta.routeKey || 'unknown'))
const moduleName = computed(() => String(route.meta.moduleName || moduleKey.value))
const pageTitle = computed(() => String(route.meta.title || routeKey.value))
const currentPath = computed(() => route.fullPath)

function goHome() {
  void router.push('/index')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="module-unavailable-page">
    <div class="module-unavailable-page__hero">
      <div>
        <div class="module-unavailable-page__eyebrow">Module Unavailable</div>
        <h1>{{ moduleName }} 当前未加载到主程序</h1>
        <p>
          当前菜单已经命中了目标页面，但对应前端模块没有被当前宿主正确装配。这通常意味着模块未安装、未启用、远程入口不可用，或模块版本与壳应用不兼容。
        </p>
      </div>

      <div class="module-unavailable-page__status">
        <el-tag type="warning">模块未加载</el-tag>
        <span>当前路径：{{ currentPath }}</span>
      </div>
    </div>

    <div class="module-unavailable-page__grid">
      <div class="module-unavailable-page__panel">
        <div class="module-unavailable-page__panel-title">当前定位信息</div>
        <dl class="meta-list">
          <div class="meta-item">
            <dt>模块标识</dt>
            <dd>{{ moduleKey }}</dd>
          </div>
          <div class="meta-item">
            <dt>页面标识</dt>
            <dd>{{ routeKey }}</dd>
          </div>
          <div class="meta-item">
            <dt>页面标题</dt>
            <dd>{{ pageTitle }}</dd>
          </div>
        </dl>
      </div>

      <div class="module-unavailable-page__panel">
        <div class="module-unavailable-page__panel-title">建议先检查这 3 项</div>
        <ul>
          <li>模块是否已经被宿主自动发现并注册。</li>
          <li>如果当前是 remote 模式，子应用入口是否可访问。</li>
          <li>后端菜单下发的 moduleKey、routeKey、view 是否与模块声明一致。</li>
        </ul>

        <div class="module-unavailable-page__actions">
          <el-button type="primary" @click="goHome">回到首页</el-button>
          <el-button @click="goBack">返回上一页</el-button>
        </div>
      </div>
    </div>

    <el-alert title="这个页面属于宿主程序自己的兜底界面，不依赖任何子应用代码，因此即使模块没有加载成功，主程序也能稳定给出诊断信息。" type="info" :closable="false"
      show-icon />

    <p class="module-unavailable-page__tip">
      如果你想保留 qiankun demo 那种展示感，更合理的做法是把它的视觉语言迁到宿主兜底页，而不是直接复用某个具体模块里的演示页面。
    </p>
  </div>
</template>

<style lang="scss" scoped>
.module-unavailable-page {
  min-height: calc(100vh - 84px);
  display: grid;
  gap: 16px;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(245, 158, 11, 0.14), transparent 30%),
    linear-gradient(135deg, rgba(255, 251, 235, 0.98), rgba(248, 250, 252, 0.98));
}

.module-unavailable-page__hero {
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 1px solid rgba(180, 83, 9, 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);

  h1 {
    margin: 8px 0 12px;
    font-size: 30px;
    line-height: 1.3;
    color: #78350f;
  }

  p {
    margin: 0;
    max-width: 860px;
    line-height: 1.75;
    color: #57534e;
  }
}

.module-unavailable-page__eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b45309;
}

.module-unavailable-page__status {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: #57534e;
}

.module-unavailable-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.module-unavailable-page__panel {
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.module-unavailable-page__panel-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.meta-list {
  margin: 0;
  padding: 0;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid #edf1f7;

  dt {
    color: #8a97a6;
    font-size: 14px;
  }

  dd {
    margin: 0;
    color: #1f2d3d;
    font-size: 14px;
    font-weight: 600;
    text-align: right;
    word-break: break-all;
  }
}

.module-unavailable-page__panel ul {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.8;
}

.module-unavailable-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.module-unavailable-page__tip {
  margin: 0;
  color: #78716c;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .module-unavailable-page {
    padding: 20px;
  }

  .module-unavailable-page__grid {
    grid-template-columns: 1fr;
  }

  .module-unavailable-page__hero h1 {
    font-size: 24px;
  }
}
</style>