<template>
  <!-- 添加或修改变量管理对话框 -->
  <el-dialog :title="title" :modelValue="visible" @update:modelValue="emit('update:visible', $event)" width="600px" append-to-body>
    <el-form ref="variableRef" :model="form" :rules="rules" label-width="80px">
      <el-row>
        <el-col :span="24">
          <el-form-item label="变量名称" prop="variableName">
            <el-input v-model="form.variableName" placeholder="请输入变量名称" maxlength="50" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="变量类型" prop="variableType">
            <el-radio-group v-model="form.variableType" @change="handleVariableTypeChange">
              <el-radio label="指定文本">指定文本</el-radio>
              <el-radio label="内置变量">内置变量</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="form.variableType === '内置变量'">
        <el-col :span="24">
          <el-form-item label="内置变量" prop="variableContent">
            <el-select v-model="form.variableContent" placeholder="请选择内置变量" style="width: 100%">
              <el-option
                v-for="(item, key) in builtInVariableOptions"
                :key="key"
                :label="item.label"
                :value="key"
              >
                <span style="float: left">{{ item.label }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ item.description }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-else-if="form.variableType === '指定文本'">
        <el-col :span="24">
          <el-form-item label="变量内容" prop="variableContent">
            <el-input
              v-model="form.variableContent"
              type="textarea"
              :rows="4"
              placeholder="请输入变量内容"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
        <el-button @click="handleCancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="VariableFormDialog">
import { ref } from 'vue'

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

// 内置变量的显示文本配置（简化版）
const builtInVariableLabels = {
  'time': '发送时间',
  'date': '发送日期',
  'datetime': '发送日期+时间',
  'addresser': '发件人',
  'recipients': '收件人',
  'RandomnDigits': '随机数字',
  'RandomnCharacters': '随机字母',
  'RandomNDigitLetters': '随机数字+字母'
}

// 将 labels 转换为 options 数组用于下拉选择器
const builtInVariableOptions = Object.entries(builtInVariableLabels).map(([value, label]) => ({
  value,
  label
}))

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

// 暴露给父组件的方法
defineExpose({
  variableRef
})
</script>
