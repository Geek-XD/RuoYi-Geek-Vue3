<template>
  <div>
    <el-form label-width="80px" size="small" @submit.native.prevent>
      <el-form-item v-if="showSkipExpression" label="跳过表达式">
        <el-input v-model="bpmnFormData.skipExpression" clearable @change="updateTextProperty('skipExpression')" />
      </el-form-item>
      <el-form-item v-if="showAsyncConfig" label="异步前置">
        <el-switch v-model="bpmnFormData.asyncBefore" @change="updateBooleanProperty('asyncBefore')" />
      </el-form-item>
      <el-form-item v-if="showAsyncConfig" label="异步后置">
        <el-switch v-model="bpmnFormData.asyncAfter" @change="updateBooleanProperty('asyncAfter')" />
      </el-form-item>
      <el-form-item v-if="showAsyncConfig" label="异步排他">
        <el-switch v-model="bpmnFormData.exclusive" @change="updateBooleanProperty('exclusive')" />
      </el-form-item>
      <el-form-item v-if="showCompensation" label="补偿活动">
        <el-switch v-model="bpmnFormData.isForCompensation" @change="updateBooleanProperty('isForCompensation')" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'
import { StrUtil } from "@ruoyi/core/utils/StrUtil";

interface OtherPanelFormData {
  skipExpression?: string
  isForCompensation?: boolean
  asyncBefore?: boolean
  asyncAfter?: boolean
  exclusive?: boolean
  [key: string]: unknown
}

defineOptions({ name: 'OtherPanel' })

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const bpmnFormData = ref<OtherPanelFormData>({})
const elementType = ref('')
const activityTypes = new Set(['UserTask', 'ServiceTask', 'SendTask', 'BusinessRuleTask', 'ScriptTask', 'ReceiveTask', 'CallActivity', 'SubProcess'])
const asyncCapableTypes = new Set([
  'StartEvent',
  'EndEvent',
  'UserTask',
  'ServiceTask',
  'SendTask',
  'BusinessRuleTask',
  'ScriptTask',
  'ReceiveTask',
  'CallActivity',
  'SubProcess',
  'ExclusiveGateway',
  'ParallelGateway',
  'InclusiveGateway',
  'EventBasedGateway',
  'BoundaryEvent',
  'IntermediateCatchEvent',
  'IntermediateThrowEvent'
])

const showSkipExpression = computed(() => activityTypes.has(elementType.value))
const showCompensation = computed(() => activityTypes.has(elementType.value))
const showAsyncConfig = computed(() => asyncCapableTypes.has(elementType.value))

const resetFlowForm = (): void => {
  const businessObject = modelerStore.element?.businessObject
  if (!businessObject) return

  elementType.value = businessObject.$type?.replace('bpmn:', '') || ''
  bpmnFormData.value = {
    skipExpression: businessObject.skipExpression || '',
    isForCompensation: Boolean(businessObject.isForCompensation),
    asyncBefore: Boolean(businessObject.asyncBefore),
    asyncAfter: Boolean(businessObject.asyncAfter),
    exclusive: businessObject.exclusive !== false
  }
}

const updateTextProperty = (key: string): void => {
  if (!modelerStore.modeling || !modelerStore.element) return

  const taskAttr = Object.create(null)
  taskAttr[key] = bpmnFormData.value[key] || null
  modelerStore.modeling.updateProperties(modelerStore.element, taskAttr)
}

const updateBooleanProperty = (key: string): void => {
  if (!modelerStore.modeling || !modelerStore.element) return

  const taskAttr = Object.create(null)
  taskAttr[key] = Boolean(bpmnFormData.value[key])
  modelerStore.modeling.updateProperties(modelerStore.element, taskAttr)
}

watch(
  () => props.id,
  (newVal: string) => {
    if (StrUtil.isNotBlank(newVal)) {
      resetFlowForm()
    }
  },
  { immediate: true }
)
</script>
