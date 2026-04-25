<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const moduleKey = computed(() => String(route.meta.moduleKey || 'unknown'))
const routeKey = computed(() => String(route.meta.routeKey || 'unknown'))
const moduleName = computed(() => String(route.meta.moduleName || moduleKey.value))
const pageTitle = computed(() => String(route.meta.title || routeKey.value))
</script>

<template>
  <div class="module-unavailable-page">
    <div class="content-card">
      <div class="status-code">模块缺失</div>
      <h1>{{ moduleName }}</h1>
      <p>当前菜单已经配置，但前端模块未安装、未启用，或版本与壳应用不兼容。</p>
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
      <p class="tip">建议检查当前壳应用的模块注册中心、部署配置，以及后端菜单下发的 moduleKey/routeKey 是否一致。</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.module-unavailable-page {
  min-height: calc(100vh - 84px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(64, 158, 255, 0.12), transparent 28%),
    radial-gradient(circle at bottom right, rgba(64, 158, 255, 0.08), transparent 24%),
    #f6f8fb;
}

.content-card {
  width: min(720px, 100%);
  padding: 40px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 20px 60px rgba(31, 45, 61, 0.12);

  h1 {
    margin: 0 0 16px;
    color: #1f2d3d;
    font-size: 32px;
    line-height: 1.2;
  }

  p {
    margin: 0;
    color: #5b6b7a;
    line-height: 1.8;
    font-size: 15px;
  }
}

.status-code {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: 18px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.12);
  color: #409eff;
  font-size: 13px;
  font-weight: 600;
}

.meta-list {
  margin: 28px 0;
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

.tip {
  margin-top: 12px;
  color: #8a97a6;
}
</style>