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

<script>
import { StrUtil } from "@/utils/StrUtil";

export default {
  name: "PropertiesPanel",
  props: {
    id: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      elementPropertyList: [],
      otherExtensionList: [],
      propertyForm: {},
      editingPropertyIndex: -1,
      propertyFormModelVisible: false
    };
  },
  watch: {
    id: {
      immediate: true,
      handler(val) {
        if (StrUtil.isNotBlank(val)) {
          this.resetAttributesList();
        }
      }
    }
  },
  methods: {
    resetAttributesList() {
      this.bpmnElement = this.modelerStore.element;
      this.otherExtensionList = []; // 其他扩展配置
      this.bpmnElementProperties =
        this.bpmnElement.businessObject?.extensionElements?.values?.filter(ex => {
          if (ex.$type !== `flowable:Properties`) {
            this.otherExtensionList.push(ex);
          }
          return ex.$type === `flowable:Properties`;
        }) ?? [];

      // 保存所有的 扩展属性字段
      this.bpmnElementPropertyList = this.bpmnElementProperties.reduce((pre, current) => pre.concat(current.values), []);
      // 复制 显示
      this.elementPropertyList = JSON.parse(JSON.stringify(this.bpmnElementPropertyList ?? []));
    },
    openAttributesForm(attr, index) {
      this.editingPropertyIndex = index;
      this.propertyForm = index === -1 ? {} : JSON.parse(JSON.stringify(attr));
      this.propertyFormModelVisible = true;
      this.$nextTick(() => {
        if (this.$refs["attributeFormRef"]) this.$refs["attributeFormRef"].clearValidate();
      });
    },
    removeAttributes(attr, index) {
      this.$confirm("确认移除该属性吗？", "提示", {
        confirmButtonText: "确 认",
        cancelButtonText: "取 消"
      })
        .then(() => {
          this.elementPropertyList.splice(index, 1);
          this.bpmnElementPropertyList.splice(index, 1);
          // 新建一个属性字段的保存列表
          const propertiesObject = this.modelerStore.moddle.create(`flowable:Properties`, {
            values: this.bpmnElementPropertyList
          });
          this.updateElementExtensions(propertiesObject);
          this.resetAttributesList();
        })
        .catch(() => console.info("操作取消"));
    },
    saveAttribute() {
      const { name, value } = this.propertyForm;
      console.log(this.bpmnElementPropertyList);
      if (this.editingPropertyIndex !== -1) {
        this.modelerStore.modeling.updateModdleProperties(this.bpmnElement, this.bpmnElementPropertyList[this.editingPropertyIndex], {
          name,
          value
        });
      } else {
        // 新建属性字段
        const newPropertyObject = this.modelerStore.moddle.create(`flowable:Property`, { name, value });
        // 新建一个属性字段的保存列表
        const propertiesObject = this.modelerStore.moddle.create(`flowable:Properties`, {
          values: this.bpmnElementPropertyList.concat([newPropertyObject])
        });
        this.updateElementExtensions(propertiesObject);
      }
      this.propertyFormModelVisible = false;
      this.resetAttributesList();
    },
    updateElementExtensions(properties) {
      const extensions = this.modelerStore.moddle.create("bpmn:ExtensionElements", {
        values: this.otherExtensionList.concat([properties])
      });

      this.modelerStore.modeling.updateProperties(this.bpmnElement, {
        extensionElements: extensions
      });
    }
  }
};
</script>
