<template>
  <div>
    <el-form label-width="90px" size="small" @submit.native.prevent>
      <el-form-item label="实现方式">
        <el-select v-model="bpmnFormData.implementationType" clearable @change="updateImplementationType">
          <el-option label="Java类" value="class" />
          <el-option label="表达式" value="expression" />
          <el-option label="代理表达式" value="delegateExpression" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="bpmnFormData.implementationType === 'class'" label="Java类">
        <el-input v-model="bpmnFormData.class" clearable @change="updateImplementationValue('class')" />
      </el-form-item>

      <el-form-item v-if="bpmnFormData.implementationType === 'expression'" label="表达式">
        <el-input v-model="bpmnFormData.expression" clearable @change="updateImplementationValue('expression')" />
      </el-form-item>

      <el-form-item v-if="bpmnFormData.implementationType === 'delegateExpression'" label="代理表达式">
        <el-input v-model="bpmnFormData.delegateExpression" clearable @change="updateImplementationValue('delegateExpression')" />
      </el-form-item>

      <el-form-item label="结果变量">
        <el-input v-model="bpmnFormData.resultVariable" clearable @change="updateElementTask('resultVariable')" />
      </el-form-item>

      <template v-if="isBusinessRuleTask">
        <el-divider content-position="left">DMN 配置</el-divider>

        <el-form-item label="决策Key">
          <el-input v-model="bpmnFormData.decisionRef" clearable @change="updateElementTask('decisionRef')" />
        </el-form-item>

        <el-form-item label="绑定方式">
          <el-select v-model="bpmnFormData.decisionRefBinding" clearable @change="updateDecisionBinding">
            <el-option label="最新版本" value="latest" />
            <el-option label="部署版本" value="deployment" />
            <el-option label="指定版本" value="version" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="bpmnFormData.decisionRefBinding === 'version'" label="决策版本">
          <el-input v-model="bpmnFormData.decisionRefVersion" clearable @change="updateElementTask('decisionRefVersion')" />
        </el-form-item>

        <el-form-item label="结果映射">
          <el-select v-model="bpmnFormData.mapDecisionResult" clearable @change="updateElementTask('mapDecisionResult')">
            <el-option label="结果列表" value="resultList" />
            <el-option label="单条结果" value="singleResult" />
            <el-option label="单值结果" value="singleEntry" />
            <el-option label="收集条目" value="collectEntries" />
          </el-select>
        </el-form-item>

        <el-form-item label="租户ID">
          <el-input v-model="bpmnFormData.decisionRefTenantId" clearable @change="updateElementTask('decisionRefTenantId')" />
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { StrUtil } from '@ruoyi/core/utils/StrUtil'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'

interface ServiceTaskLikeFormData {
  implementationType?: '' | 'class' | 'expression' | 'delegateExpression'
  class?: string
  expression?: string
  delegateExpression?: string
  resultVariable?: string
  decisionRef?: string
  decisionRefBinding?: string
  decisionRefVersion?: string
  mapDecisionResult?: string
  decisionRefTenantId?: string
  [key: string]: unknown
}

defineOptions({ name: 'ServiceTaskLikePanel' })

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const isBusinessRuleTask = ref(false)
const bpmnFormData = ref<ServiceTaskLikeFormData>({
  implementationType: ''
})

const resetTaskForm = (): void => {
  const businessObject = modelerStore.element?.businessObject
  if (!businessObject) return

  isBusinessRuleTask.value = businessObject.$type === 'bpmn:BusinessRuleTask'
  bpmnFormData.value = {
    implementationType: businessObject.class
      ? 'class'
      : businessObject.expression
        ? 'expression'
        : businessObject.delegateExpression
          ? 'delegateExpression'
          : '',
    class: businessObject.class || '',
    expression: businessObject.expression || '',
    delegateExpression: businessObject.delegateExpression || '',
    resultVariable: businessObject.resultVariable || '',
    decisionRef: businessObject.decisionRef || '',
    decisionRefBinding: businessObject.decisionRefBinding || 'latest',
    decisionRefVersion: businessObject.decisionRefVersion || '',
    mapDecisionResult: businessObject.mapDecisionResult || 'resultList',
    decisionRefTenantId: businessObject.decisionRefTenantId || ''
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

const updateImplementationType = (type: '' | 'class' | 'expression' | 'delegateExpression'): void => {
  if (type !== 'class') bpmnFormData.value.class = ''
  if (type !== 'expression') bpmnFormData.value.expression = ''
  if (type !== 'delegateExpression') bpmnFormData.value.delegateExpression = ''

  updateImplementationValue(type)
}

const updateImplementationValue = (type: '' | 'class' | 'expression' | 'delegateExpression'): void => {
  bpmnFormData.value.implementationType = type
  updateElementProperties({
    class: type === 'class' ? bpmnFormData.value.class || null : null,
    expression: type === 'expression' ? bpmnFormData.value.expression || null : null,
    delegateExpression: type === 'delegateExpression' ? bpmnFormData.value.delegateExpression || null : null
  })
}

const updateDecisionBinding = (binding: string): void => {
  if (binding !== 'version') {
    bpmnFormData.value.decisionRefVersion = ''
  }

  updateElementProperties({
    decisionRefBinding: binding || null,
    decisionRefVersion: binding === 'version' ? bpmnFormData.value.decisionRefVersion || null : null
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
