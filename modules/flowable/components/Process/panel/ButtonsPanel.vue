<template>
  <div class="panel-tab__content">
    <el-divider content-position="center">按钮设置</el-divider>
    <el-table :data="elementButtonList" size="small" max-height="240" border fit>
      <el-table-column label="序号" width="50px" type="index" />
      <el-table-column label="属性名" prop="name" min-width="100px" show-overflow-tooltip />
      <el-table-column label="属性值" prop="value" min-width="100px" show-overflow-tooltip />
      <el-table-column label="操作" width="90px">
        <template slot-scope="{ row, $index }">
          <el-link @click="openAttributesForm(row, $index)" type="primary">编辑</el-link>
          <el-divider direction="vertical" />
          <el-link style="color: #ff4d4f" @click="removeAttributes(row, $index)" type="primary">移除</el-link>
        </template>
      </el-table-column>
    </el-table>
    <div class="element-drawer__button_save">
      <el-button size="small" type="primary" icon="plus" @click="openAttributesForm(null, -1)">添加按钮</el-button>
    </div>

    <el-dialog v-model="buttonFormModelVisible" title="按钮配置" width="600px" append-to-body destroy-on-close>
      <el-form :model="buttonForm" label-width="80px" size="small" ref="attributeFormRef" @submit.native.prevent>
        <el-form-item label="属性名：" prop="name">
          <el-input v-model="buttonForm.name" clearable />
        </el-form-item>
        <el-form-item label="属性值：" prop="value">
          <el-input v-model="buttonForm.value" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="buttonFormModelVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="saveAttribute">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, ref, watch } from "vue";
import { StrUtil } from "@ruoyi/core/utils/StrUtil";
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'

defineOptions({ name: "ButtonsPanel" })

const props = defineProps({
  id: {
    type: String,
    required: true
  },
})

type ConfirmFn = (message: string, title: string, options: { confirmButtonText: string; cancelButtonText: string }) => Promise<void>

const proxy = getCurrentInstance()?.proxy as { $confirm?: ConfirmFn } | undefined
const attributeFormRef = ref()
const elementButtonList = ref<any[]>([])
const otherExtensionList = ref<any[]>([])
const buttonForm = ref<Record<string, any>>({})
const editingPropertyIndex = ref(-1)
const buttonFormModelVisible = ref(false)

let bpmnElement: any = null
let bpmnElementProperties: any[] = []
let bpmnElementButtonList: any[] = []

const resetAttributesList = () => {
  bpmnElement = modelerStore.element;
  otherExtensionList.value = []; // 其他扩展配置
  bpmnElementProperties =
    bpmnElement.businessObject?.extensionElements?.values?.filter((ex: any) => {
      if (ex.$type !== `flowable:Buttons`) {
        otherExtensionList.value.push(ex);
      }
      return ex.$type === `flowable:Buttons`;
    }) ?? [];

  // 保存所有的 扩展属性字段
  bpmnElementButtonList = bpmnElementProperties.reduce((pre, current) => pre.concat(current.values), []);
  // 复制 显示
  elementButtonList.value = JSON.parse(JSON.stringify(bpmnElementButtonList ?? []));
}

const openAttributesForm = (attr: any, index: number) => {
  editingPropertyIndex.value = index;
  buttonForm.value = index === -1 ? {} : JSON.parse(JSON.stringify(attr));
  buttonFormModelVisible.value = true;
  nextTick(() => {
    if (attributeFormRef.value) attributeFormRef.value.clearValidate();
  });
}

const removeAttributes = (_attr: any, index: number) => {
  proxy?.$confirm?.("确认移除该属性吗？", "提示", {
    confirmButtonText: "确 认",
    cancelButtonText: "取 消"
  })
    .then(() => {
      elementButtonList.value.splice(index, 1);
      bpmnElementButtonList.splice(index, 1);
      // 新建一个属性字段的保存列表
      const propertiesObject = modelerStore.moddle.create(`flowable:Buttons`, {
        values: bpmnElementButtonList
      });
      updateElementExtensions(propertiesObject);
      resetAttributesList();
    })
    .catch(() => console.info("操作取消"));
}

const saveAttribute = () => {
  const { name, value } = buttonForm.value;
  if (editingPropertyIndex.value !== -1) {
    modelerStore.modeling.updateModdleProperties(bpmnElement, bpmnElementButtonList[editingPropertyIndex.value], {
      name,
      value
    });
  } else {
    // 新建属性字段
    const newPropertyObject = modelerStore.moddle.create(`flowable:Button`, { name, value });
    // 新建一个属性字段的保存列表
    const propertiesObject = modelerStore.moddle.create(`flowable:Buttons`, {
      values: bpmnElementButtonList.concat([newPropertyObject])
    });
    updateElementExtensions(propertiesObject);
  }
  buttonFormModelVisible.value = false;
  resetAttributesList();
}

const updateElementExtensions = (properties: any) => {
  const extensions = modelerStore.moddle.create("bpmn:ExtensionElements", {
    values: otherExtensionList.value.concat([properties])
  });

  modelerStore.modeling.updateProperties(bpmnElement, {
    extensionElements: extensions
  });
}

watch(
  () => props.id,
  (val) => {
    if (StrUtil.isNotBlank(val)) {
      resetAttributesList();
    }
  },
  { immediate: true }
)
</script>

