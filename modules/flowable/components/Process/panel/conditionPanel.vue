<template>
  <div>
    <el-form label-width="100px" size="small" @submit.native.prevent>
      <el-form-item>
        <template #label>
          <span>
            流转类型
            <el-tooltip placement="top">
              <template #content>
                <div>
                  普通流转路径：流程执行过程中，一个元素被访问后，会沿着其所有出口顺序流继续执行。
                  <br />默认流转路径：只有当没有其他顺序流可以选择时，才会选择默认顺序流作为活动的出口顺序流。流程会忽略默认顺序流上的条件。
                  <br />条件流转路径：是计算其每个出口顺序流上的条件。当条件计算为true时，选择该出口顺序流。如果该方法选择了多条顺序流，则会生成多个执行，流程会以并行方式继续。
                </div>
              </template>
              <i class="el-icon-question" />
            </el-tooltip>
          </span>
        </template>
        <el-select v-model="bpmnFormData.type" @change="updateFlowType">
          <el-option label="普通流转路径" value="normal" />
          <el-option label="默认流转路径" value="default" />
          <el-option label="条件流转路径" value="condition" />
        </el-select>
      </el-form-item>
      <el-form-item label="条件格式" v-if="bpmnFormData.type === 'condition'" key="condition">
        <el-select v-model="bpmnFormData.conditionType">
          <el-option label="表达式" value="expression" />
          <el-option label="脚本" value="script" />
        </el-select>
      </el-form-item>
      <el-form-item label="表达式" v-if="bpmnFormData.conditionType && bpmnFormData.conditionType === 'expression'"
        key="express">
        <el-input v-model="bpmnFormData.body" clearable @change="updateFlowCondition" />
      </el-form-item>
      <template v-if="bpmnFormData.conditionType && bpmnFormData.conditionType === 'script'">
        <el-form-item label="脚本语言" key="language">
          <el-input v-model="bpmnFormData.language" clearable @change="updateFlowCondition" />
        </el-form-item>
        <el-form-item label="脚本类型" key="scriptType">
          <el-select v-model="bpmnFormData.scriptType">
            <el-option label="内联脚本" value="inlineScript" />
            <el-option label="外部脚本" value="externalScript" />
          </el-select>
        </el-form-item>
        <el-form-item label="脚本" v-if="bpmnFormData.scriptType === 'inlineScript'" key="body">
          <el-input v-model="bpmnFormData.body" type="textarea" clearable @change="updateFlowCondition" />
        </el-form-item>
        <el-form-item label="资源地址" v-if="bpmnFormData.scriptType === 'externalScript'" key="resource">
          <el-input v-model="bpmnFormData.resource" clearable @change="updateFlowCondition" />
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'
import { StrUtil } from "@ruoyi/core/utils/StrUtil";

interface ConditionFormData {
  type?: 'normal' | 'default' | 'condition'
  conditionType?: 'expression' | 'script' | null
  scriptType?: 'inlineScript' | 'externalScript' | null
  body?: string | null
  resource?: string
  language?: string
  [key: string]: unknown
}

defineOptions({ name: 'BpmnModel' })

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const bpmnElementSource = ref<Record<string, unknown> | null>(null)
const bpmnElementSourceRef = ref<Record<string, unknown> | null>(null)
const bpmnFormData = ref<ConditionFormData>({})

const resetFlowCondition = (): void => {
  if (!modelerStore.element?.businessObject) return

  bpmnFormData.value = {
    body: null
  }
  bpmnElementSource.value = modelerStore.element.source
  bpmnElementSourceRef.value = modelerStore.element.businessObject.sourceRef
  if (bpmnElementSourceRef.value?.default?.id === modelerStore.element.id) {
    bpmnFormData.value["type"] = "default"
  } else if (!modelerStore.element.businessObject.conditionExpression) {
    bpmnFormData.value["type"] = "normal"
  } else {
    const conditionExpression = modelerStore.element.businessObject.conditionExpression
    bpmnFormData.value = { ...conditionExpression, type: "condition" }
    if (bpmnFormData.value.resource) {
      bpmnFormData.value["conditionType"] = "script"
      bpmnFormData.value["scriptType"] = "externalScript"
      return
    }
    if (conditionExpression.language) {
      bpmnFormData.value["conditionType"] = "script"
      bpmnFormData.value["scriptType"] = "inlineScript"
      return
    }
    bpmnFormData.value["conditionType"] = "expression"
  }
}

const updateFlowType = (flowType: string): void => {
  if (!modelerStore.moddle || !modelerStore.modeling || !modelerStore.element) return

  if (flowType === "condition") {
    const flowConditionRef = modelerStore.moddle.create("bpmn:FormalExpression")
    modelerStore.modeling.updateProperties(modelerStore.element, {
      conditionExpression: flowConditionRef
    })
    return
  }
  if (flowType === "default") {
    modelerStore.modeling.updateProperties(modelerStore.element, {
      conditionExpression: null
    })
    modelerStore.modeling.updateProperties(bpmnElementSource.value, {
      default: modelerStore.element
    })
    bpmnFormData.value.conditionType = null
    return
  }
  bpmnFormData.value.conditionType = null
  if (bpmnElementSourceRef.value?.default && bpmnElementSourceRef.value.default.id === modelerStore.element.id) {
    modelerStore.modeling.updateProperties(bpmnElementSource.value, {
      default: null
    })
  }
  modelerStore.modeling.updateProperties(modelerStore.element, {
    conditionExpression: null
  })
}

const updateFlowCondition = (): void => {
  if (!modelerStore.moddle || !modelerStore.modeling || !modelerStore.element) return

  let { conditionType, scriptType, body, resource, language } = bpmnFormData.value
  let condition
  if (conditionType === "expression") {
    condition = modelerStore.moddle.create("bpmn:FormalExpression", { body })
  } else {
    if (scriptType === "inlineScript") {
      condition = modelerStore.moddle.create("bpmn:FormalExpression", { body, language })
      bpmnFormData.value["resource"] = ""
    } else {
      bpmnFormData.value["body"] = ""
      condition = modelerStore.moddle.create("bpmn:FormalExpression", { resource, language })
    }
  }
  modelerStore.modeling.updateProperties(modelerStore.element, { conditionExpression: condition })
}

watch(
  () => props.id,
  (newVal: string) => {
    if (StrUtil.isNotBlank(newVal)) {
      resetFlowCondition()
    }
  },
  { immediate: true }
)
</script>

