<template>
  <div>
    <el-form label-width="80px" size="small" @submit.native.prevent>
      <el-form-item label="跳过表达式">
        <el-input v-model="bpmnFormData.skipExpression" @change="updateElementTask('skipExpression')" />
      </el-form-item>
      <el-form-item label="是否为补偿">
        <el-input v-model="bpmnFormData.isForCompensation" @change="updateElementTask('isForCompensation')" />
      </el-form-item>
      <el-form-item label="服务任务可触发">
        <el-input v-model="bpmnFormData.triggerable" @change="updateElementTask('triggerable')" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'
import { StrUtil } from "@ruoyi/core/utils/StrUtil";

interface OtherPanelFormData {
  skipExpression?: string
  isForCompensation?: string | boolean
  triggerable?: string | boolean
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

const resetFlowForm = (): void => {
  if (!modelerStore.element?.businessObject) return

  bpmnFormData.value = JSON.parse(JSON.stringify(modelerStore.element.businessObject))
}

const updateElementTask = (key: string): void => {
  if (!modelerStore.modeling || !modelerStore.element) return

  const taskAttr = Object.create(null)
  taskAttr[key] = bpmnFormData.value[key] || null
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

