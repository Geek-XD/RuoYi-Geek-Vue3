<template>
  <div>
    <el-form :model="bpmnFormData" label-width="80px" :rules="rules" size="small">
      <el-form-item :label="bpmnFormData.$type === 'bpmn:Process' ? '流程标识' : '节点ID'" prop="id"
        @change="updateElementTask('id')">
        <el-input v-model="bpmnFormData.id" />
      </el-form-item>
      <el-form-item :label="bpmnFormData.$type === 'bpmn:Process' ? '流程名称' : '节点名称'" prop="name">
        <el-input v-model="bpmnFormData.name" @change="updateElementTask('name')" />
      </el-form-item>

      <!--流程的基础属性-->
      <template v-if="bpmnFormData.$type === 'bpmn:Process'">
        <el-form-item label="流程分类" prop="processCategory">
          <el-select v-model="bpmnFormData.processCategory" placeholder="请选择流程分类"
            @change="updateElementTask('processCategory')">
            <el-option v-for="dict in sys_process_category" :key="dict.value" :label="dict.label"
              :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
      </template>
      <el-form-item v-if="bpmnFormData.$type === 'bpmn:SubProcess'" label="状态">
        <el-switch v-model="bpmnFormData.isExpanded" active-text="展开" inactive-text="折叠"
          @change="updateElementTask('isExpanded')" />
      </el-form-item>
      <el-form-item label="节点描述">
        <el-input :rows="2" type="textarea" v-model="bpmnFormData.documentationValue" @change="updateDocumentation" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { StrUtil } from '@ruoyi/core/utils/StrUtil'
import { getCurrentInstance, ref, watch } from 'vue'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'

interface CommonPanelFormData {
  $type?: string
  id?: string
  name?: string
  processCategory?: string
  isExpanded?: boolean
  documentationValue?: string
  [key: string]: unknown
}

defineOptions({ name: 'CommonPanel' })

const emit = defineEmits<{
  (e: 'save'): void
}>()

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const proxy = getCurrentInstance()?.proxy as {
  useDict?: (...args: string[]) => { sys_process_category?: unknown[] }
} | undefined
const { sys_process_category = [] } = proxy?.useDict?.('sys_process_category') ?? {}

const rules = {
  id: [{ required: true, message: '节点Id 不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '节点名称不能为空', trigger: 'blur' }]
}

const bpmnFormData = ref<CommonPanelFormData>({})

const resetTaskForm = (): void => {
  if (!modelerStore.element?.businessObject) return

  bpmnFormData.value = Object.assign({}, modelerStore.element.businessObject)
  bpmnFormData.value['documentationValue'] = modelerStore.element.businessObject.documentation?.[0]?.text || ''
}

const updateElementTask = (key: string): void => {
  if (!modelerStore.modeling || !modelerStore.element) return

  const taskAttr = Object.create(null)
  taskAttr[key] = bpmnFormData.value[key] || null
  modelerStore.modeling.updateProperties(modelerStore.element, taskAttr)
}

const updateDocumentation = (): void => {
  if (!modelerStore.modeler || !modelerStore.element) return

  const modeler = modelerStore.modeler
  const moddle = modeler.get('moddle')
  const modeling = modeler.get('modeling')

  const documentation = moddle.create('bpmn:Documentation', {
    text: bpmnFormData.value.documentationValue
  })

  let extensionElements = modelerStore.element.businessObject.extensionElements

  if (!extensionElements) {
    extensionElements = moddle.create('bpmn:ExtensionElements', {
      values: []
    })
  }

  modeling.updateProperties(modelerStore.element, {
    documentation: [documentation],
    extensionElements: extensionElements
  })

  emit('save')
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

