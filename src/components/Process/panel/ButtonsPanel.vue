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
        <el-form-item label="属性名：" prop="label">
          <el-input v-model="buttonForm.label" clearable />
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

<script>
import { StrUtil } from "@/utils/StrUtil";

export default {
  name: "ButtonsPanel",
  props: {
    id: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      elementButtonList: [],
      otherExtensionList: [],
      buttonForm: {},
      editingPropertyIndex: -1,
      buttonFormModelVisible: false
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
          if (ex.$type !== `flowable:Buttons`) {
            this.otherExtensionList.push(ex);
          }
          return ex.$type === `flowable:Buttons`;
        }) ?? [];

      // 保存所有的 扩展属性字段
      this.bpmnElementButtonList = this.bpmnElementProperties.reduce((pre, current) => pre.concat(current.values), []);
      // 复制 显示
      this.elementButtonList = JSON.parse(JSON.stringify(this.bpmnElementButtonList ?? []));
    },
    openAttributesForm(attr, index) {
      this.editingPropertyIndex = index;
      this.buttonForm = index === -1 ? {} : JSON.parse(JSON.stringify(attr));
      this.buttonFormModelVisible = true;
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
          this.elementButtonList.splice(index, 1);
          this.bpmnElementButtonList.splice(index, 1);
          // 新建一个属性字段的保存列表
          const propertiesObject = this.modelerStore.moddle.create(`flowable:Properties`, {
            values: this.bpmnElementButtonList
          });
          this.updateElementExtensions(propertiesObject);
          this.resetAttributesList();
        })
        .catch(() => console.info("操作取消"));
    },
    saveAttribute() {
      const { name, value } = this.buttonForm;
      if (this.editingPropertyIndex !== -1) {
        this.modelerStore.modeling.updateModdleProperties(this.bpmnElement, this.bpmnElementButtonList[this.editingPropertyIndex], {
          name,
          value
        });
      } else {
        // 新建属性字段
        const newPropertyObject = this.modelerStore.moddle.create(`flowable:Button`, { name, value });
        // 新建一个属性字段的保存列表
        const propertiesObject = this.modelerStore.moddle.create(`flowable:Buttons`, {
          values: this.bpmnElementButtonList.concat([newPropertyObject])
        });
        this.updateElementExtensions(propertiesObject);
      }
      this.buttonFormModelVisible = false;
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
