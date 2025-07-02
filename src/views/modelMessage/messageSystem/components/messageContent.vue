<template>
  <div class="message-content">
    <div class="section-title">
      <el-icon><ChatDotRound /></el-icon> 消息内容
    </div>
    
    <!-- 内容类型选择 -->
    <el-row>
      <el-col :span="24">
        <div class="content-type-selector">
          <div class="type-label">内容类型:</div>
          <el-radio-group v-model="contentType" @change="handleContentTypeChange" size="default">
            <el-radio label="template">
              <el-icon><Files /></el-icon> 模板签名
            </el-radio>
            <el-radio label="content">
              <el-icon><EditPen /></el-icon> 消息内容
            </el-radio>
          </el-radio-group>
        </div>
      </el-col>
    </el-row>
    
    <!-- 内容输入 -->
    <el-row>
      <el-col :span="24">
        <div class="content-input-container">
          <!-- 模板选择 -->
          <template v-if="contentType === 'template'">
            <el-form-item label="模板选择" prop="messageContent">
              <el-select 
                v-model="messageContent" 
                placeholder="请选择模板签名" 
                style="width: 100%" 
                @change="handleTemplateChange"
                :loading="templateLoading"
              >
                <el-option 
                  v-for="temp in templates" 
                  :key="temp.templateId" 
                  :label="temp.templateCode" 
                  :value="temp.templateCode" 
                />
              </el-select>
            </el-form-item>
          </template>
          
          <!-- 内容输入 -->
          <template v-else>
            <el-form-item label="消息内容" prop="messageContent">
              <el-input 
                v-model="messageContent" 
                type="textarea" 
                :rows="3" 
                placeholder="短信格式须为: 模板名?模板参数=值" 
                maxlength="100" 
                show-word-limit 
                @input="handleContentInput" 
              />
            </el-form-item>
          </template>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { selecTemplates } from '@/api/modelMessage/template';
import { ElMessage } from 'element-plus';
import { ChatDotRound, Files, EditPen } from '@element-plus/icons-vue';

// Props
const props = defineProps({
  sendMode: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['update:contentType', 'update:messageContent']);

// 响应式数据
const contentType = ref('template');
const messageContent = ref('');
const templates = ref([]);
const templateLoading = ref(false);

// 获取模板列表
async function getTemplates() {
  try {
    templateLoading.value = true;
    const response = await selecTemplates();
    templates.value = response.data || [];
  } catch (error) {
    console.error('获取模板信息失败:', error);
    ElMessage.error('获取模板信息失败');
  } finally {
    templateLoading.value = false;
  }
}

// 处理内容类型变化
function handleContentTypeChange() {
  messageContent.value = '';
  emit('update:contentType', contentType.value);
  emit('update:messageContent', '');
}

// 处理模板选择变化
function handleTemplateChange(value) {
  messageContent.value = value;
  emit('update:messageContent', value);
}

// 处理内容输入变化
function handleContentInput(value) {
  messageContent.value = value;
  emit('update:messageContent', value);
}

// 验证消息内容格式
function validateMessageContent(value) {
  if (props.sendMode === '1' && contentType.value === 'content') {
    const pattern = /^[^?]+?\?[^=]+?=.*$/;
    if (!pattern.test(value)) {
      return '短信输入内容格式必须为：模板名?模板参数=值';
    }
  }
  return true;
}

// 监听发送方式变化
watch(() => props.sendMode, () => {
  // 发送方式变化时可能需要重新验证内容格式
  if (messageContent.value) {
    const validation = validateMessageContent(messageContent.value);
    if (validation !== true) {
      ElMessage.warning(validation);
    }
  }
});

// 初始化
getTemplates();

// 暴露方法给父组件
defineExpose({
  validateContent: () => validateMessageContent(messageContent.value),
  reset: () => {
    contentType.value = 'template';
    messageContent.value = '';
  },
  getTemplates
});
</script>

<style scoped>
.message-content {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 6px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.section-title .el-icon {
  margin-right: 8px;
  color: #409EFF;
  font-size: 16px;
}

.content-type-selector {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.type-label {
  margin-right: 10px;
  font-weight: 500;
  color: #606266;
  min-width: 70px;
}

.content-type-selector .el-radio {
  margin-right: 14px;
  margin-bottom: 0;
}

.content-type-selector .el-icon {
  margin-right: 4px;
  font-size: 15px;
}

.content-input-container {
  margin-top: 10px;
  margin-bottom: 0;
}
</style>
