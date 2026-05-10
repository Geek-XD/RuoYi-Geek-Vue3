<template>
  <div class="panel-tab__content">
    <el-table :data="elementPropertyList" size="small" max-height="240" border fit>
      <el-table-column label="序号" width="50px" type="index" />
      <el-table-column label="属性名" prop="name" min-width="100px" show-overflow-tooltip />
      <el-table-column label="属性值" prop="value" min-width="100px" show-overflow-tooltip />
      <el-table-column label="操作" width="90px">
        <template slot-scope="{ row, $index }">
          <el-button type="primary" link @click="openAttributesForm(row, $index)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-button type="primary" link style="color: #ff4d4f" @click="removeAttributes(row, $index)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="element-drawer__button">
      <el-button size="small" type="primary" icon="plus" @click="openAttributesForm(null, -1)">添加属性</el-button>
    </div>

    <el-dialog v-model="propertyFormModelVisible" title="属性配置" width="600px" append-to-body destroy-on-close>
      <el-form :model="propertyForm" label-width="80px" size="small" ref="attributeFormRef" @submit.native.prevent>
        <el-form-item label="属性名：" prop="name">
          <el-input v-model="propertyForm.name" clearable />
        </el-form-item>
        <el-form-item label="属性值：" prop="value">
          <el-input v-model="propertyForm.value" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="propertyFormModelVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="saveAttribute">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, ref, watch } from 'vue'
import { StrUtil } from "@ruoyi/core/utils/StrUtil";
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'

interface FlowablePropertyLike {
  name?: string
  value?: string
  $type?: string
  values?: FlowablePropertyLike[]
  [key: string]: unknown
}

defineOptions({ name: "PropertiesPanel" })

const props = defineProps({
  id: {
    type: String,
    required: true
  },
})

const attributeFormRef = ref()
const elementPropertyList = ref<FlowablePropertyLike[]>([])
const otherExtensionList = ref<FlowablePropertyLike[]>([])
const propertyForm = ref<FlowablePropertyLike>({})
const editingPropertyIndex = ref(-1)
const propertyFormModelVisible = ref(false)

let bpmnElement: Record<string, unknown> | null = null
let bpmnElementProperties: FlowablePropertyLike[] = []
let bpmnElementPropertyList: FlowablePropertyLike[] = []

const resetAttributesList = (): void => {
  if (!modelerStore.element?.businessObject) return

  bpmnElement = modelerStore.element;
  otherExtensionList.value = []; // 其他扩展配置
  bpmnElementProperties =
    bpmnElement.businessObject?.extensionElements?.values?.filter(ex => {
      if (ex.$type !== `flowable:Properties`) {
        otherExtensionList.value.push(ex);
      }
      return ex.$type === `flowable:Properties`;
    }) ?? [];

  // 保存所有的 扩展属性字段
  bpmnElementPropertyList = bpmnElementProperties.reduce((pre, current) => pre.concat(current.values), []);
  // 复制 显示
  elementPropertyList.value = JSON.parse(JSON.stringify(bpmnElementPropertyList ?? []));
}

const openAttributesForm = (attr: FlowablePropertyLike | null, index: number): void => {
  editingPropertyIndex.value = index;
  propertyForm.value = index === -1 ? {} : JSON.parse(JSON.stringify(attr));
  propertyFormModelVisible.value = true;
  nextTick(() => {
    if (attributeFormRef.value) attributeFormRef.value.clearValidate();
  });
}

const removeAttributes = (_attr: FlowablePropertyLike, index: number): void => {
  if (!modelerStore.moddle) return

  proxy?.$confirm("确认移除该属性吗？", "提示", {
    confirmButtonText: "确 认",
    cancelButtonText: "取 消"
  })
    .then(() => {
      elementPropertyList.value.splice(index, 1);
      bpmnElementPropertyList.splice(index, 1);
      // 新建一个属性字段的保存列表
      const propertiesObject = modelerStore.moddle.create(`flowable:Properties`, {
        values: bpmnElementPropertyList
      });
      updateElementExtensions(propertiesObject);
      resetAttributesList();
    })
    .catch(() => console.info("操作取消"));
}

const saveAttribute = (): void => {
  if (!modelerStore.moddle || !modelerStore.modeling || !bpmnElement) return

  const { name, value } = propertyForm.value;
  if (editingPropertyIndex.value !== -1) {
    modelerStore.modeling.updateModdleProperties(bpmnElement, bpmnElementPropertyList[editingPropertyIndex.value], {
      name,
      value
    });
  } else {
    // 新建属性字段
    const newPropertyObject = modelerStore.moddle.create(`flowable:Property`, { name, value });
    // 新建一个属性字段的保存列表
    const propertiesObject = modelerStore.moddle.create(`flowable:Properties`, {
      values: bpmnElementPropertyList.concat([newPropertyObject])
    });
    updateElementExtensions(propertiesObject);
  }
  propertyFormModelVisible.value = false;
  resetAttributesList();
}

const updateElementExtensions = (properties: FlowablePropertyLike): void => {
  if (!modelerStore.moddle || !modelerStore.modeling || !bpmnElement) return

  const extensions = modelerStore.moddle.create("bpmn:ExtensionElements", {
    values: otherExtensionList.value.concat([properties])
  });

  modelerStore.modeling.updateProperties(bpmnElement, {
    extensionElements: extensions
  });
}

const proxy = getCurrentInstance()?.proxy as { $confirm?: (...args: any[]) => Promise<void> } | undefined

watch(
  () => props.id,
  (val: string) => {
    if (StrUtil.isNotBlank(val)) {
      resetAttributesList();
    }
  },
  { immediate: true }
)
</script>

