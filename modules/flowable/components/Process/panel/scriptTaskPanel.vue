<template>
  <div>
    <el-form label-width="90px" size="small" @submit.native.prevent>
      <el-form-item label="脚本类型">
        <el-select v-model="bpmnFormData.scriptType" @change="updateScriptType">
          <el-option label="内联脚本" value="inlineScript" />
          <el-option label="外部脚本" value="externalScript" />
        </el-select>
      </el-form-item>

      <el-form-item label="脚本格式">
        <el-input v-model="bpmnFormData.scriptFormat" clearable @change="updateElementTask('scriptFormat')" />
      </el-form-item>

      <el-form-item v-if="bpmnFormData.scriptType === 'inlineScript'" label="脚本内容">
        <el-input v-model="bpmnFormData.script" type="textarea" :rows="4" @change="updateScriptContent" />
      </el-form-item>

      <el-form-item v-else label="资源地址">
        <el-input v-model="bpmnFormData.resource" clearable @change="updateScriptContent" />
      </el-form-item>

      <el-form-item label="结果变量">
        <el-input v-model="bpmnFormData.resultVariable" clearable @change="updateElementTask('resultVariable')" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { StrUtil } from '@ruoyi/core/utils/StrUtil'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'

interface ScriptTaskFormData {
  scriptType?: 'inlineScript' | 'externalScript'
  scriptFormat?: string
  script?: string
  resource?: string
  resultVariable?: string
  [key: string]: unknown
}

defineOptions({ name: 'ScriptTaskPanel' })

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const bpmnFormData = ref<ScriptTaskFormData>({
  scriptType: 'inlineScript'
})

const resetTaskForm = (): void => {
  const businessObject = modelerStore.element?.businessObject
  if (!businessObject) return

  bpmnFormData.value = {
    scriptType: businessObject.resource ? 'externalScript' : 'inlineScript',
    scriptFormat: businessObject.scriptFormat || '',
    script: businessObject.script || '',
    resource: businessObject.resource || '',
    resultVariable: businessObject.resultVariable || ''
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

const updateScriptType = (type: 'inlineScript' | 'externalScript'): void => {
  bpmnFormData.value.scriptType = type
  if (type === 'inlineScript') {
    bpmnFormData.value.resource = ''
  } else {
    bpmnFormData.value.script = ''
  }
  updateScriptContent()
}

const updateScriptContent = (): void => {
  updateElementProperties({
    script: bpmnFormData.value.scriptType === 'inlineScript' ? bpmnFormData.value.script || null : null,
    resource: bpmnFormData.value.scriptType === 'externalScript' ? bpmnFormData.value.resource || null : null
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
