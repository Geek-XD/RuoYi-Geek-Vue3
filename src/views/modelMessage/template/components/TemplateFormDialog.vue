<template>
  <!-- 添加或修改模版管理对话框 -->
  <el-dialog :title="title" :modelValue="visible" @update:modelValue="emit('update:visible', $event)" width="680px" append-to-body destroy-on-close custom-class="template-dialog">
    <el-form ref="templateRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="模版名称" prop="templateName">
            <el-input v-model="form.templateName" placeholder="请输入模版名称">
              <template #prefix>
                <el-icon><DocumentAdd /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="模版CODE" prop="templateCode">
            <el-input v-model="form.templateCode" placeholder="请输入模版CODE" @blur="validateTemplateCode">
              <template #prefix>
                <el-icon><Document /></el-icon>
              </template>
            </el-input>
            <div class="form-tips">CODE必须以SMS_开头</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="模版类型" prop="templateType">
            <el-select v-model="form.templateType" placeholder="请选择模版类型" style="width: 100%">
              <el-option v-for="dict in template_type" :key="dict.value" :label="dict.label" :value="dict.value">
                <div class="type-option">
                  <el-icon><Message /></el-icon>
                  <span>{{ dict.label }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="选择变量" prop="templateVariable">
            <el-select v-model="form.templateVariable" placeholder="请选择变量" multiple filterable
              @change="handleVariableChange" style="width: 100%">
              <el-option v-for="item in variable" :key="item.variableId" :label="item.variableName"
                :value="item.variableName">
                <div class="variable-option">
                  <span class="variable-name">{{ item.variableName }}</span>
                  <span class="variable-content">${{ item.variableName }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="variable-selected" v-if="form.templateVariable?.length > 0">
              <span class="selected-label">已选变量：</span>
              <div class="variable-tags">
                <el-tag v-for="(varName, index) in form.templateVariable" :key="index" 
                  size="small" class="variable-tag" effect="light" color="#ecf5ff">
                  {{ varName }}
                </el-tag>
              </div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="模版内容" prop="templateContent">
            <div class="content-editor-container">
              <div class="editor-section">
                <div class="editor-header">
                  <el-icon><Edit /></el-icon>
                  <span>编辑区域</span>
                </div>
                <div class="editor-wrapper">
                  <el-input v-model="form.templateContent" type="textarea" :rows="6" placeholder="请输入模版内容"
                    resize="none" class="template-textarea"/>
                </div>
                <div class="template-tips">
                  <el-icon><InfoFilled /></el-icon>
                  选中变量后会自动添加到模版内容中
                </div>
              </div>
              <div class="preview-section" v-if="form.templateContent">
                <div class="preview-header">
                  <el-icon><View /></el-icon>
                  <span>实时预览</span>
                </div>
                <div class="preview-body">{{ form.templateContent }}</div>
              </div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="场景说明" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入场景说明" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" plain>取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="TemplateFormDialog">
import { ref, reactive, toRefs, getCurrentInstance, watch } from 'vue';
import { Document, Message, InfoFilled, DocumentAdd, Edit, View, Memo } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance();
const { template_type } = proxy.useDict("template_type");

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  formData: {
    type: Object,
    default: () => ({})
  },
  variable: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['update:visible', 'submit', 'cancel']);

// Data
const templateRef = ref(null);
const data = reactive({
  form: { templateContent: '' },
  rules: {
    templateName: [{ required: true, message: '请输入模版名称', trigger: 'blur' }],
    templateCode: [{ required: true, message: '请输入模版CODE', trigger: 'blur' }, { validator: validateTemplateCode, trigger: 'blur' }],
    templateType: [{ required: true, message: '请选择模版类型', trigger: 'change' }],
    templateVariable: [{ required: true, message: '请选择变量', trigger: 'change' }],
    remark: [{ required: true, message: '请输入场景说明', trigger: 'blur' }],
    templateContent: [{ required: true, message: '请输入模版内容', trigger: 'blur' }]
  }
});

const { form, rules } = toRefs(data);

// Watch props changes
watch(() => props.formData, (newVal) => {
  if (newVal) {
    form.value = { ...newVal };
  }
}, { deep: true, immediate: true });

// Methods
function validateTemplateCode(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入模版CODE'));
  } else if (!value.startsWith('SMS_')) {
    callback(new Error('模版CODE必须以SMS_开头'));
  } else {
    callback();
  }
}

// 当变量选项改变时触发
function handleVariableChange(value) {
  // 保存当前模板内容光标位置
  const textarea = document.querySelector('.editor-wrapper textarea');
  const cursorPos = textarea ? textarea.selectionStart : -1;

  // 原有逻辑
  form.value.templateVariable = value;
  if (!form.value.templateContent) {
    form.value.templateContent = '';
  }
  const currentPlaceholders = form.value.templateContent.match(/\$\{\w+\}/g) || [];
  const selectedVariableNames = value.map(v => `\${${v}}`);
  currentPlaceholders.forEach(placeholder => {
    if (!selectedVariableNames.includes(placeholder)) {
      form.value.templateContent = form.value.templateContent.replace(placeholder, '').trim();
    }
  });

  // 改进：在光标位置插入变量
  const lastSelectedVariableName = value[value.length - 1];
  if (lastSelectedVariableName) {
    const variablePlaceholder = `\${${lastSelectedVariableName}}`;
    if (!form.value.templateContent.includes(variablePlaceholder)) {
      if (cursorPos >= 0) {
        // 在光标位置插入
        const before = form.value.templateContent.substring(0, cursorPos);
        const after = form.value.templateContent.substring(cursorPos);
        form.value.templateContent = `${before} ${variablePlaceholder} ${after}`;
      } else {
        // 原来的方式：追加到末尾
        form.value.templateContent += ` ${variablePlaceholder}`;
      }
    }
  }
  form.value.templateContent = form.value.templateContent.replace(/\s+/g, ' ').trim();
}

function handleSubmit() {
  templateRef.value.validate(valid => {
    if (valid) {
      emit('submit', form.value);
    }
  });
}

function handleCancel() {
  emit('cancel');
}

// Reset form
function resetForm() {
  form.value = {
    templateId: null, templateName: null, templateCode: null, templateType: null, templateContent: '',
    templateVariable: [], createBy: null, createTime: null, updateBy: null, updateTime: null, remark: null
  };
  if (templateRef.value) {
    templateRef.value.resetFields();
  }
}

// Expose methods
defineExpose({
  resetForm
});
</script>

<style scoped>
/* 表单提示样式 */
.form-tips { color: #909399; font-size: 12px; margin-top: 4px; }

/* 下拉选项样式 */
.type-option { display: flex; align-items: center; gap: 8px; }
.variable-option { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.variable-content { color: #409EFF; font-size: 13px; font-family: monospace; }

/* 已选变量区域 */
.variable-selected { margin-top: 10px; background: #f9fafc; border-radius: 6px; padding: 10px; border: 1px dashed #dcdfe6; }
.selected-label { font-size: 12px; color: #606266; margin-right: 8px; }
.variable-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.variable-tag { margin-right: 0; border-color: #d9ecff; }

/* 内容编辑器区域 */
.content-editor-container { display: flex; gap: 0; margin-bottom: 10px; border: 1px solid #dcdfe6; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); height: 320px; width:600px }
.editor-section, .preview-section { width: 50%; display: flex; flex-direction: column; height: 100%; }
.editor-header, .preview-header { display: flex; align-items: center; gap: 6px; background: #f5f7fa; padding: 10px 12px; border-bottom: 1px solid #e4e7ed; font-size: 13px; color: #606266; font-weight: 500; flex-shrink: 0; }
.editor-header .el-icon, .preview-header .el-icon { font-size: 16px; color: #409EFF; }
.editor-wrapper { padding: 12px; background: #fff; flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* 文本域样式 */
.template-textarea { width: 100%; height: 100%; }
:deep(.template-textarea .el-textarea__inner) { height: 100% !important; min-height: unset !important; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; line-height: 1.6; font-size: 14px; padding: 12px; resize: none; }

.preview-section { border-left: 1px solid #dcdfe6; overflow: hidden; display: flex; flex-direction: column; }
.preview-body { padding: 15px; flex: 1; overflow-y: auto; background: white; font-size: 14px; white-space: pre-wrap; color: #303133; line-height: 1.6; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; }
.template-tips { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #909399; margin: 0 0 10px 0; padding: 8px 12px; background: #f0f9eb; border-radius: 4px; border-left: 3px solid #67c23a; flex-shrink: 0; }

/* 对话框样式 */
:deep(.template-dialog .el-dialog__header) { padding: 16px 20px; margin-right: 0; background: #409EFF; border-radius: 8px 8px 0 0; }
:deep(.template-dialog .el-dialog__title) { color: white; font-weight: 600; }
:deep(.template-dialog .el-dialog__headerbtn .el-dialog__close) { color: rgba(255, 255, 255, 0.9); }
:deep(.template-dialog .el-dialog__body) { padding: 24px; }
:deep(.template-dialog .el-dialog__footer) { padding: 12px 20px 16px; border-top: 1px solid #ebeef5; }

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .content-editor-container { flex-direction: column; height: auto; }
  .editor-section, .preview-section { width: 100%; }
  .preview-section { border-left: none; border-top: 1px solid #dcdfe6; }
  .editor-wrapper, .preview-body { height: 160px; }
}
</style>
