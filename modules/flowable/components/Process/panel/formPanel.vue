<template>
  <div>
    <el-form label-width="80px" size="small" @submit.native.prevent>
      <el-form-item label="流程表单">
        <el-select v-model="bpmnFormData.formKey" clearable class="m-2" placeholder="挂载节点表单"
          @change="updateElementFormKey">
          <el-option v-for="item in formList" :key="item.value" :label="item.formName" :value="item.formId" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">

import { listAllForm } from '@ruoyi/module-flowable/api/form'
import { ref, watch } from 'vue'
import { StrUtil } from "@ruoyi/core/utils/StrUtil";
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'

interface FormOption {
  formId: string
  formName?: string
  value?: string
  [key: string]: unknown
}

interface FormPanelData {
  formKey?: string
}

defineOptions({ name: 'FormPanel' })

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const formList = ref<FormOption[]>([])
const bpmnFormData = ref<FormPanelData>({})

const resetFlowForm = (): void => {
  if (!modelerStore.element?.businessObject) return

  bpmnFormData.value.formKey = modelerStore.element.businessObject.formKey
}

const updateElementFormKey = (val: string | null): void => {
  if (!modelerStore.element?.businessObject || !modelerStore.modeling) return

  if (StrUtil.isBlank(val)) {
    delete modelerStore.element.businessObject[`formKey`]
  } else {
    modelerStore.modeling.updateProperties(modelerStore.element, { 'formKey': val })
  }
}

const getListForm = (): void => {
  listAllForm().then((res: { rows: FormOption[] }) => {
    res.rows.forEach(item => {
      item.formId = item.formId.toString()
    })
    formList.value = res.rows
  })
}

watch(
  () => props.id,
  (newVal: string) => {
    if (StrUtil.isNotBlank(newVal)) {
      getListForm()
      resetFlowForm()
    }
  },
  { immediate: true }
)
</script>

