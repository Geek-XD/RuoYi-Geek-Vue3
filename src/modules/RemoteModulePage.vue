<template>
  <div class="module-remote-page" v-loading="loading">
    <el-alert v-if="errorMessage" :title="`${moduleDisplayName}加载失败`" :description="errorMessage" type="error"
      :closable="false" show-icon />
    <div ref="containerRef" class="module-remote-page__container" :class="{ 'is-hidden': Boolean(errorMessage) }" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadMicroApp, type MicroApp } from 'qiankun'
import useUserStore from '@/store/modules/user'
import { getInstalledModuleManifest, getInstalledRemoteModule } from './registry'

const props = defineProps<{
  moduleKey?: string
  routePath?: string
}>()

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const containerRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const errorMessage = ref('')

type UpdatableMicroApp = MicroApp & {
  update?: (props: Record<string, unknown>) => Promise<unknown> | unknown
}

let microApp: UpdatableMicroApp | undefined
let mountedModuleSignature = ''
let lastSyncedRoutePath = ''

function resolveModuleKeyFromPath(path: string) {
  const [prefix] = path.replace(/^\//, '').split('/')
  return prefix || ''
}

const moduleKey = computed(() => {
  if (props.moduleKey) {
    return props.moduleKey
  }
  const metaModuleKey = route.meta.moduleKey
  if (typeof metaModuleKey === 'string' && metaModuleKey) {
    return metaModuleKey
  }

  return resolveModuleKeyFromPath(props.routePath || route.path)
})

const moduleManifest = computed(() => getInstalledModuleManifest(moduleKey.value))
const remoteModule = computed(() => getInstalledRemoteModule(moduleKey.value))
const moduleRoutePath = computed(() => props.routePath || route.fullPath)
const moduleDisplayName = computed(() => moduleManifest.value?.name || moduleKey.value || '远程模块')
const remoteModuleEntry = computed(() => remoteModule.value?.entry || '')

function buildRemoteProps() {
  return {
    ...(remoteModule.value?.props || {}),
    moduleKey: moduleKey.value,
    routePath: moduleRoutePath.value,
    routeBase: moduleManifest.value?.routeBase,
    permissions: userStore.permissions,
    roles: userStore.roles,
    onNavigate: async (path: string) => {
      if (!path || path === route.fullPath) {
        return
      }
      lastSyncedRoutePath = path
      await router.replace(path)
    }
  }
}

async function unmountRemoteModule() {
  const currentMicroApp = microApp
  microApp = undefined
  mountedModuleSignature = ''
  lastSyncedRoutePath = ''

  if (!currentMicroApp) {
    return
  }

  await currentMicroApp.unmount()
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
}

async function mountRemoteModule() {
  if (!moduleKey.value) {
    errorMessage.value = '当前路由未解析出远程模块标识，无法挂载子应用。'
    return
  }

  if (!containerRef.value) {
    return
  }

  if (!remoteModule.value?.entry) {
    errorMessage.value = '未配置远程入口地址，无法装载微前端模块。'
    return
  }

  const nextSignature = `${moduleKey.value}:${remoteModule.value.entry}`
  if (microApp && mountedModuleSignature === nextSignature) {
    return
  }

  await unmountRemoteModule()

  errorMessage.value = ''
  loading.value = true

  try {
    microApp = loadMicroApp({
      name: remoteModule.value.name || `ruoyi-${moduleKey.value}`,
      entry: remoteModule.value.entry,
      container: containerRef.value,
      props: buildRemoteProps()
    }, {
      sandbox: {
        experimentalStyleIsolation: true
      }
    })
    mountedModuleSignature = nextSignature
    lastSyncedRoutePath = moduleRoutePath.value

    await microApp.mountPromise
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '远程模块装载失败。'
  } finally {
    loading.value = false
  }
}

async function updateRemoteRoute() {
  if (!microApp) return
  if (moduleRoutePath.value === lastSyncedRoutePath) return
  lastSyncedRoutePath = moduleRoutePath.value
  if (typeof microApp.update === 'function') {
    await microApp.update(buildRemoteProps())
  }
}

watch(
  [moduleKey, remoteModuleEntry],
  () => {
    void mountRemoteModule()
  },
  { immediate: true }
)

watch(
  moduleRoutePath,
  () => {
    void updateRemoteRoute()
  }
)

onBeforeUnmount(() => {
  void unmountRemoteModule()
})

onMounted(() => {
  void mountRemoteModule()
})
</script>

<style scoped>
.module-remote-page {
  min-height: 320px;
}

.module-remote-page__container {
  min-height: 320px;
}

.module-remote-page__container.is-hidden {
  display: none;
}
</style>