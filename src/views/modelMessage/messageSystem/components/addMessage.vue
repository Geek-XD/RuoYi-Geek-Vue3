<template>
  <el-dialog v-model="dialogVisible" :title="title" width="700px" destroy-on-close :close-on-click-modal="false" @closed="handleClosed" class="message-dialog">
  <div class="form-container">
    <el-form ref="messageSystemFormRef" :model="form" :rules="rules" label-width="80px" class="message-form" v-loading="loading" element-loading-text="消息发送中...">
      <!-- 基本信息区域 -->
      <div class="form-section"><div class="section-title"><el-icon><Document /></el-icon> 基本信息</div>

      <el-row :gutter="16"><el-col :span="24"><el-form-item label="标题" prop="messageTitle"><el-input v-model="form.messageTitle" placeholder="请输入消息标题" clearable /></el-form-item></el-col></el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="发送方式" prop="sendMode">
            <el-select v-model="form.sendMode" placeholder="选择发送方式" clearable style="width: 100%" @change="handleSendModeChange">
              <el-option v-for="dict in send_mode" :key="dict.value" :label="dict.label" :value="dict.value">
                <div class="option-with-icon">
                  <el-icon v-if="dict.value === '0'"><MessageBox /></el-icon>
                  <el-icon v-else-if="dict.value === '1'"><PhoneFilled /></el-icon>
                  <el-icon v-else-if="dict.value === '2'"><Message /></el-icon>
                  {{ dict.label }}
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="消息类型" prop="messageType">
            <el-select v-model="form.messageType" placeholder="选择消息类型" clearable style="width: 100%">
              <el-option v-for="dict in message_type" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      </div>

      <!-- 消息内容组件 -->
      <MessageContent :send-mode="form.sendMode" @update:contentType="form.contentType = $event" @update:messageContent="form.messageContent = $event" ref="messageContentRef" />

      <!-- 收件人选择组件 -->
      <RecipientSelector :send-mode="form.sendMode" @update:recipients="form.messageRecipient = $event" @update:contactInfo="form.code = $event" ref="recipientSelectorRef" />

      <!-- 备注区域 -->
      <div class="form-section"><el-row><el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选：添加备注信息" /></el-form-item></el-col></el-row></div>
    </el-form>

    <div class="dialog-footer">
      <el-button @click="toggleDialog">取 消</el-button>
      <el-button type="primary" @click="submitForm" :loading="loading" class="send-button"><el-icon><Promotion /></el-icon> 发送消息</el-button>
    </div>
  </div>
</el-dialog>
</template>

<script setup>
import { ref, getCurrentInstance, defineProps, defineEmits, defineExpose } from 'vue';
import { batchAddMessage } from '@/api/modelMessage/messageSystem';
import { ElMessage } from 'element-plus';
import { Message, Document, MessageBox, PhoneFilled, Promotion } from '@element-plus/icons-vue';
import MessageContent from './MessageContent.vue';
import RecipientSelector from './RecipientSelector.vue';

const props = defineProps({ title: { type: String, default: "发送消息" } });
const { proxy } = getCurrentInstance();
const { send_mode, message_type } = proxy.useDict("send_mode", "message_type");
const emit = defineEmits(['success', 'close']);
// Refs
const messageSystemFormRef = ref(null);
const messageContentRef = ref(null);
const recipientSelectorRef = ref(null);
const dialogVisible = ref(false);
const loading = ref(false);

// Form Data
const form = ref({
  messageTitle: null,
  messageContent: null,
  messageRecipient: [],
  remark: null,
  sendMode: null,
  code: null,
  contentType: "template",
  messageType: null
});

// 表单验证规则
const rules = ref({
  messageTitle: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  sendMode: [{ required: true, message: '请选择发送方式', trigger: 'change' }],
  messageRecipient: [{ required: true, message: '请选择收件人', trigger: 'change' }],
  messageType: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
  messageContent: [{ required: true, message: '模版签名或消息内容不能为空', trigger: 'blur' }]
});
// 处理发送方式改变
function handleSendModeChange() {
  // 清空联系方式，子组件会自动处理数据更新
  form.value.code = '';
}

// 发送消息表单提交
async function submitForm() {
  loading.value = true;
  try {
    // 表单验证
    await messageSystemFormRef.value.validate();
    // 从子组件获取收件人信息
    const recipients = await recipientSelectorRef.value.getRecipients();
    if (!recipients || recipients.length === 0) {
      ElMessage.warning('请选择收件人');
      return;
    }
    // 构建消息数据
    const messages = recipients.map(recipient => ({
      ...form.value,
      messageRecipient: recipient.userName || recipient.name,
      code: form.value.sendMode === '1' ? recipient.phonenumber :
            form.value.sendMode === '2' ? recipient.email :
            recipient.name,
      sendMode: form.value.sendMode
    }));

    // 发送消息
    await batchAddMessage(messages);
    ElMessage.success("消息发送成功！");
    emit('success');
    toggleDialog();
  } catch (error) {
    console.error('Submit form error:', error);
    ElMessage.error('发送信息失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
}

// 重置表单
function reset() {
  form.value = {
    messageTitle: null,
    messageContent: null,
    messageRecipient: [],
    remark: null,
    sendMode: null,
    code: null,
    contentType: "template",
    messageType: null
  };

  // 重置子组件
  if (messageContentRef.value) {
    messageContentRef.value.reset();
  }
  if (recipientSelectorRef.value) {
    recipientSelectorRef.value.reset();
  }
}

// 切换对话框显示状态
function toggleDialog() {
  dialogVisible.value = !dialogVisible.value;
  if (!dialogVisible.value) {
    reset();
    emit('close');
    loading.value = false;
  }
}

// 对话框关闭处理
function handleClosed() {
  reset();
  emit('close');
  loading.value = false;
}

// 暴露方法给父组件
defineExpose({
  open: () => {
    dialogVisible.value = true;
  }
});
</script>

<style scoped>
.message-dialog {
  border-radius: 12px;
}

.form-container {
  padding: 10px;
}

.form-section {
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

.option-with-icon {
  display: flex;
  align-items: center;
}

.option-with-icon .el-icon {
  margin-right: 6px;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
}

.send-button {
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
}

.send-button:hover {
  background: linear-gradient(135deg, #337ecc 0%, #5daf34 100%);
}
</style>