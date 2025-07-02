<template>
  <!-- 添加或修改变量管理对话框 -->
  <el-dialog 
    :title="title" 
    :modelValue="visible" 
    @update:modelValue="emit('update:visible', $event)" 
    width="650px" 
    append-to-body 
    custom-class="variable-dialog"
  >
    <div class="dialog-container">
      <div class="dialog-header-info">
        <div class="header-icon">
          <i class="el-icon-magic-stick" v-if="form.variableId == null"></i>
          <i class="el-icon-edit" v-else></i>
        </div>
        <div class="header-text">
          {{ form.variableId == null ? '创建新的变量，可用于个性化消息内容' : '编辑已有变量，修改后将影响使用该变量的消息模板' }}
        </div>
      </div>
      <div class="dialog-form-container">
        <el-form ref="variableRef" :model="form" :rules="rules" label-width="100px" class="enhanced-form">
          <el-form-item label="变量名称" prop="variableName">
            <el-input v-model="form.variableName" placeholder="请输入变量名称" clearable>
              <template #prefix><i class="el-icon-price-tag variable-icon"></i></template>
            </el-input>
            <span class="form-tip"><i class="el-icon-info-filled tip-icon"></i> 变量名称用于在消息模板中识别，请确保其唯一性</span>
          </el-form-item>
          
          <el-form-item label="变量类型" prop="variableType" class="variable-type-section">
            <div class="type-selection-wrapper">
              <el-radio-group v-model="form.variableType" @change="handleVariableTypeChange" class="type-radio-group">
                <el-radio-button label="指定文本">
                  <i class="el-icon-document"></i> 指定文本
                </el-radio-button>
                <el-radio-button label="内置变量">
                  <i class="el-icon-cpu"></i> 内置变量
                </el-radio-button>
              </el-radio-group>
              <div class="type-description">
                {{ form.variableType === '指定文本' ? 
                    '指定文本变量用于设置固定的文本内容' : 
                    '内置变量会在发送消息时自动替换为系统值' }}
              </div>
            </div>
          </el-form-item>

          <div class="variable-content">
            <transition name="fade" mode="out-in">
              <el-form-item v-if="form.variableType === '内置变量'" label="内置变量" prop="variableContent" class="built-in-form-item content-transition-item">
                <div class="built-in-variables-grid">
                  <div
                    v-for="(item, key) in builtInVariableOptions"
                    :key="key"
                    :class="['variable-option', {'selected': form.variableContent === key}]"
                    :data-type="key"
                    @click="selectBuiltInVariable(key)"
                  >
                    <div class="variable-option-icon" :style="getVariableIconStyle(key, item.color)">
                      <i :class="item.icon"></i>
                    </div>
                    <div class="variable-option-content">
                      <div class="variable-option-title">{{ item.label }}</div>
                      <div class="variable-option-desc">{{ item.description }}</div>
                    </div>
                  </div>
                </div>
                
                <div class="variable-preview" v-if="form.variableContent">
                  <div class="preview-header">
                    <i class="el-icon-view"></i> 预览示例：{{ getVariablePreview(form.variableContent) }}
                  </div>
                </div>
              </el-form-item>
              
              <el-form-item v-else-if="form.variableType === '指定文本'" label="变量内容" prop="variableContent" class="content-transition-item">
                <el-input 
                  v-model="form.variableContent" 
                  type="textarea" 
                  :rows="4" 
                  placeholder="请输入变量内容" 
                  class="content-input"
                  maxlength="1000"
                  show-word-limit
                />
              </el-form-item>
            </transition>
          </div>
        </el-form>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" plain>取 消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          <i class="el-icon-check"></i> {{ form.variableId == null ? '创建' : '保存' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="VariableFormDialog">
import { ref, computed } from 'vue'

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
  form: {
    type: Object,
    required: true
  },
  submitLoading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible', 'submit', 'cancel', 'variable-type-change'])

// Refs
const variableRef = ref(null)

// 表单验证规则
const rules = {
  variableName: [{ required: true, message: '请输入变量名称', trigger: 'blur' }],
  variableType: [{ required: true, message: '请选择变量类型', trigger: 'change' }]
}

// 内置变量选项配置
const builtInVariableOptions = {
  'time': { 
    label: '发送时间', 
    icon: 'el-icon-time',
    description: '当前完整时间',
    color: '#3498db'
  },
  'date': { 
    label: '发送日期', 
    icon: 'el-icon-date',
    description: '当前完整日期',
    color: '#3498db'
  },
  'datetime': { 
    label: '发送日期+时间', 
    icon: 'el-icon-timer',
    description: '当前完整日期时间',
    color: '#3498db'
  },
  'addresser': { 
    label: '发件人', 
    icon: 'el-icon-user',
    description: '发送方的名称或账号',
    color: '#e74c3c'
  },
  'recipients': { 
    label: '收件人', 
    icon: 'el-icon-avatar',
    description: '接收方的名称或账号',
    color: '#e74c3c'
  },
  'RandomnDigits': {
    label: '随机数字',
    icon: 'el-icon-coin',
    description: '生成随机数字序列',
    color: '#2ecc71'
  },
  'RandomnCharacters': {
    label: '随机字母',
    icon: 'el-icon-collection',
    description: '生成随机字母序列',
    color: '#2ecc71'
  },
  'RandomNDigitLetters': {
    label: '随机数字+字母',
    icon: 'el-icon-collection-tag',
    description: '生成随机字母和数字',
    color: '#2ecc71'
  }
}

// 方法
const handleVariableTypeChange = (value) => {
  emit('variable-type-change', value)
}

const handleCancel = () => {
  emit('cancel')
}

const handleSubmit = () => {
  // 在子组件内部进行表单验证
  variableRef.value.validate((valid) => {
    if (valid) {
      emit('submit')
    }
  })
}

const selectBuiltInVariable = (key) => {
  props.form.variableContent = key
}

const getVariableIconStyle = (_, color) => {
  return {
    backgroundColor: color + '20',
    color: color,
    border: `1px solid ${color}40`
  }
}

const getVariablePreview = (variableType) => {
  const now = new Date()
  const previews = {
    'time': now.toLocaleTimeString(),
    'date': now.toLocaleDateString(),
    'datetime': now.toLocaleString(),
    'addresser': '系统管理员',
    'recipients': '用户A、用户B',
    'RandomnDigits': '123456',
    'RandomnCharacters': 'abcDEF',
    'RandomNDigitLetters': 'a1B2c3'
  }
  return previews[variableType] || '示例值'
}

// 暴露给父组件的方法
defineExpose({
  variableRef
})
</script>

<style scoped>
/* 对话框美化 - 进一步增强 */
.variable-dialog :deep(.el-dialog__header) {
  position: relative;
  background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 25px;
}
.variable-dialog :deep(.el-dialog__title) {
  font-size: 20px;
  letter-spacing: 0.5px;
}
.variable-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.dialog-container {
  display: flex;
  flex-direction: column;
}

.dialog-header-info {
  display: flex;
  align-items: center;
  padding: 20px 25px;
  background-color: rgba(103, 126, 234, 0.05);
  border-bottom: 1px solid #edf2f7;
}

.header-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.header-icon i {
  font-size: 24px;
  color: white;
}

.header-text {
  font-size: 15px;
  color: #4a5568;
  line-height: 1.5;
  flex: 1;
}

.dialog-form-container {
  padding: 25px;
}

.enhanced-form .el-form-item {
  margin-bottom: 24px;
}

.enhanced-form .el-form-item__label {
  font-weight: 600;
  color: #2d3748;
}

.variable-icon {
  color: #667eea;
}

.form-tip {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #718096;
  line-height: 1.4;
}

.tip-icon {
  margin-right: 4px;
  color: #4299e1;
}

.variable-type-section {
  margin-bottom: 30px;
}

.type-selection-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-radio-group {
  display: flex;
  gap: 12px;
}

.type-radio-group :deep(.el-radio-button__inner) {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.type-radio-group :deep(.el-radio-button__inner i) {
  margin-right: 6px;
}

.type-description {
  font-size: 13px;
  color: #718096;
  padding: 8px 12px;
  background-color: #f7fafc;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.variable-content {
  margin-top: 20px;
}

.built-in-variables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.variable-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.variable-option:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.variable-option.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.variable-option-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 18px;
}

.variable-option-content {
  flex: 1;
}

.variable-option-title {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.variable-option-desc {
  font-size: 12px;
  color: #718096;
  line-height: 1.4;
}

.variable-preview {
  padding: 16px;
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.preview-header {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}

.preview-header i {
  margin-right: 6px;
  color: #667eea;
}

.content-input {
  border-radius: 8px;
}

.content-input :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  transition: border-color 0.3s ease;
}

.content-input :deep(.el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 25px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.dialog-footer .el-button {
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 500;
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
