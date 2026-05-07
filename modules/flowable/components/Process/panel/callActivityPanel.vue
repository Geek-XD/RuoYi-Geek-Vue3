<template>
  <div>
    <el-form label-width="90px" size="small" @submit.native.prevent>
      <el-form-item label="流程Key">
        <el-input v-model="bpmnFormData.calledElement" clearable @change="updateElementTask('calledElement')" />
      </el-form-item>

      <el-form-item label="绑定方式">
        <el-select v-model="bpmnFormData.calledElementBinding" clearable @change="updateCalledElementBinding">
          <el-option label="最新版本" value="latest" />
          <el-option label="部署版本" value="deployment" />
          <el-option label="指定版本" value="version" />
          <el-option label="版本标记" value="versionTag" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="bpmnFormData.calledElementBinding === 'version'" label="流程版本">
        <el-input v-model="bpmnFormData.calledElementVersion" clearable @change="updateElementTask('calledElementVersion')" />
      </el-form-item>

      <el-form-item v-if="bpmnFormData.calledElementBinding === 'versionTag'" label="版本标记">
        <el-input v-model="bpmnFormData.calledElementVersionTag" clearable @change="updateElementTask('calledElementVersionTag')" />
      </el-form-item>

      <el-form-item label="租户ID">
        <el-input v-model="bpmnFormData.calledElementTenantId" clearable @change="updateElementTask('calledElementTenantId')" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { StrUtil } from '@ruoyi/core/utils/StrUtil'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'

interface CallActivityFormData {
  calledElement?: string
  calledElementBinding?: string
  calledElementVersion?: string
  calledElementVersionTag?: string
  calledElementTenantId?: string
  [key: string]: unknown
}

defineOptions({ name: 'CallActivityPanel' })

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const bpmnFormData = ref<CallActivityFormData>({
  calledElementBinding: 'latest'
})

const resetTaskForm = (): void => {
  const businessObject = modelerStore.element?.businessObject
  if (!businessObject) return

  bpmnFormData.value = {
    calledElement: businessObject.calledElement || '',
    calledElementBinding: businessObject.calledElementBinding || 'latest',
    calledElementVersion: businessObject.calledElementVersion || '',
    calledElementVersionTag: businessObject.calledElementVersionTag || '',
    calledElementTenantId: businessObject.calledElementTenantId || ''
  }
}

const updateElementProperties = (properties: Record<string, unknown>): void => {
  if (!modelerStore.modeling || !modelerStore.element) return

  modelerStore.modeling.updateProperties(modelerStore.element, properties)
}

const updateElementTask = (key: string): void => {
  const taskAttr = Object.create(null)
  taskAttr[key] = bpmnFormData.value[key] || null
  updateElementProperties(taskAttr)
}

const updateCalledElementBinding = (binding: string): void => {
  if (binding !== 'version') {
    bpmnFormData.value.calledElementVersion = ''
  }
  if (binding !== 'versionTag') {
    bpmnFormData.value.calledElementVersionTag = ''
  }

  updateElementProperties({
    calledElementBinding: binding || null,
    calledElementVersion: binding === 'version' ? bpmnFormData.value.calledElementVersion || null : null,
    calledElementVersionTag: binding === 'versionTag' ? bpmnFormData.value.calledElementVersionTag || null : null
  })
}

watch(
  () => props.id,
  (newVal: string) => {
    if (StrUtil.isNotBlank(newVal)) {
      resetTaskForm()
    }
  },
  { immediate: true }
)
</script>
