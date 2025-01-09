<template>
  <el-dialog :title="title" v-model="dialogVisible" width="500px" append-to-body @closed="handleClosed" class="custom-dialog">
    <el-form ref="messageSystemFormRef" :model="form" :rules="rules" label-width="80px" class="custom-form" v-loading="loading" element-loading-text="信息正在发送中...">
      <el-form-item label="标题" prop="messageTitle">
        <el-input v-model="form.messageTitle" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="发送方式" prop="sendMode">
        <el-select v-model="form.sendMode" placeholder="请选择发送方式" clearable style="width: 100%" @change="fetchRecipients">
          <el-option v-for="dict in send_mode" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="号码" prop="code" v-if="isCodeFieldVisible">
        <el-input v-model="form.code" placeholder="请输入手机号或者邮箱" disabled />
      </el-form-item>
      <el-form-item label="内容类型" prop="contentType">
        <el-radio-group v-model="form.contentType" @change="handleContentTypeChange">
          <el-radio label="template">模版签名</el-radio>
          <el-radio label="content">消息内容</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="模版签名" prop="messageContent" v-if="form.contentType === 'template'">
        <el-select v-model="form.messageContent" placeholder="请选择模版签名" style="width: 100%;" @change="handleTemplateChange">
          <el-option v-for="temp in templates" :key="temp.templateId" :label="temp.templateCode" :value="temp.templateCode" />
        </el-select>
      </el-form-item>
      <el-form-item label="消息内容" prop="messageContent" v-if="form.contentType === 'content'">
        <el-input v-model="form.messageContent" type="textarea" placeholder="(手机号内容格式必须为：模板名?模板参数=值)" @input="handleContentInput"  maxlength="100" show-word-limit/>
      </el-form-item>
      <el-form-item label="消息类型" prop="messageType">
        <el-select v-model="form.messageType" placeholder="请选择消息类型" clearable >
          <el-option v-for="dict in message_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="收件人类型" prop="recipientType" label-width="92px">
        <el-radio-group v-model="form.recipientType" @change="fetchRecipients">
          <el-radio v-for="type in recipientTypes" :key="type.value" :label="type.value">{{ type.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="hasSelectedOptions" :label="selectedLabel" prop="messageRecipient">
        <div v-if="form.recipientType === 'dept'" style="width: 100%;">
          <el-tree-select v-model="form.messageRecipient" :data="depts" placeholder="请选择部门" clearable
            :props="{ value: 'deptId', label: 'deptName', children: 'children' }" @change="handleDeptChange" multiple />
        </div>
        <div v-else style="width: 100%;">
          <el-select v-model="form.messageRecipient" placeholder="请选择" @change="handleSelectionChange" multiple>
            <el-option v-for="item in selectedOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm" :loading="loading">发 送</el-button>
        <el-button @click="toggleDialog">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, getCurrentInstance, defineProps, defineEmits, defineExpose } from 'vue';
import { getUserNamesByDeptId, getUsersByRoleId, selectUser, selectRole, selectDept, selecTemplates, batchAddMessage } from '@/api/modelMessage/messageSystem';
import { ElMessage } from 'element-plus';

const props = defineProps({ title: { type: String, default: "发送消息界面" } });
const { proxy } = getCurrentInstance();
const { send_mode, message_type} = proxy.useDict("send_mode", "message_type");
const emit = defineEmits(['success', 'close']);
const users = ref([]);
const roles = ref([]);
const depts = ref([]);
const templates = ref([]);
const messageSystemFormRef = ref(null);
const dialogVisible = ref(false);
const form = ref({
  messageTitle: null,
  messageContent: null,
  messageTemplate: null,
  messageRecipient: [], 
  remark: null,
  sendMode: null,
  recipientType: null,
  code: null,
  contentType: null 
});

const loading = ref(false);

const isCodeFieldVisible = computed(() => ['1', '2'].includes(form.value.sendMode)); //0 平台 1 短信 2 邮箱
const recipientTypes=computed(() =>[{ value: 'user', label: '用户' },{ value: 'role', label: '角色' },{ value: 'dept', label: '部门' }]);
const selectedLabel = computed(() => recipientTypes.value.find(type => type.value === form.value.recipientType)?.label || '');
const hasSelectedOptions = computed(() => form.value.recipientType && (users.value.length || roles.value.length || depts.value.length));

const rules = ref({ //验证
  messageTitle: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  sendMode: [{ required: true, message: '请选择发送方式', trigger: 'change' }],
  messageRecipient: [{ required: true, message: '请选择收件人', trigger: 'change' }],
  messageType: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
  recipientType: [{ required: true, message: '请选择收件人方式', trigger: 'change' }],
  contentType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  messageContent: [{ required: true, message: '模版签名或消息内容不能为空', trigger: 'blur' },
    { validator: validateMessageContent, trigger: 'blur' }],
  ...(isCodeFieldVisible.value ? { code: [{ required: true, message: '手机号或者邮箱', trigger: 'blur' }] } : {})
});

const selectedOptions = computed(() => {
  if (!form.value.recipientType) return [];
  const data = form.value.recipientType === 'user' ? users.value : form.value.recipientType === 'role' ? roles.value :  depts.value;
  return data.map(item => ({
    id: item.userId || item.roleId || item.deptId, name: item.userName || item.roleName || item.deptName,
    phonenumber: item.phonenumber, email: item.email
  }));
});

//获取部门 角色 平台信息
async function fetchRecipients() {
  form.value.messageRecipient = null;
  switch (form.value.recipientType) {
    case 'user': await getUsers(); break;
    case 'role': await getRoles(); break;
    case 'dept': await getDepts(); break;
  }
}

//选择对应的平台 角色 部门 填充对应的号码信息
async function handleSelectionChange(selectedIds) {
  try {
    let users = [];
    if (form.value.recipientType === 'role') {
      for (const id of selectedIds) {
        const roleUsers = (await getUsersByRoleId(id)).data;
        users.push(...roleUsers.filter(user => user.phonenumber || user.email || user.name));
      }
    } else if (form.value.recipientType === 'dept') {
      for (const id of selectedIds) {
        const deptUsers = (await getUserNamesByDeptId(id)).data;
        users.push(...deptUsers.filter(user => user.phonenumber || user.email || user.name));
      }
    } else {
      users = selectedOptions.value.filter(option => selectedIds.includes(option.id) && (option.phonenumber || option.email || option.name));
    }
    updateCodeField(users);
  } catch (error) {
    console.error('未获取到用户信息', error);
  }
}

//部门信息
async function handleDeptChange(deptIds) {
  try {
    const users = [];
    for (const deptId of deptIds) {
      const deptUsers = (await getUserNamesByDeptId(deptId)).data;
      users.push(...deptUsers.filter(user => user.phonenumber || user.email || user.name));
    }
    updateCodeField(users);
  } catch (error) {
    console.error('未获取到部门成员信息', error);
  }
}

function updateCodeField(users) {
  form.value.code = users.map(user => {
    if (form.value.sendMode === '0') return user.name || ''; // 用户
    if (form.value.sendMode === '1') return user.phonenumber || ''; // 短信
    if (form.value.sendMode === '2') return user.email || ''; // 邮箱
    return ''; 
  }).join(', ');
  if (!form.value.code) {
    ElMessage.warning('未找到该收件人有效联系方式！');
  }
}

//发送信息提交
async function submitForm() {
  loading.value = true;
  await messageSystemFormRef.value.validate(async valid => {
    if (valid) {
      try {
        const recipients = await getRecipients();
        const messages = recipients.map(recipient => ({
          ...form.value, messageRecipient: recipient.userName || recipient.name,
          code: form.value.sendMode === '1' ? recipient.phonenumber : form.value.sendMode === '2' ? recipient.email : recipient.name,
          sendMode: form.value.sendMode
        }));
        await batchAddMessage(messages);
        ElMessage.success("消息发送成功！");
        emit('success');
        toggleDialog();
      } catch (error) {
        ElMessage.error('发送信息失败:', error);
      }
    } else {
      ElMessage.warning("请将信息输入完整！");
    }
  });
  loading.value = false;
}

//过滤掉不符合的用户
async function getRecipients() {
  if (form.value.recipientType === 'dept') {
    const users = [];
    for (const deptId of form.value.messageRecipient) {
      users.push(...(await getUserNamesByDeptId(deptId)).data.filter(user => user.deptId));
    }
    return users;
  } else if (form.value.recipientType === 'role') {
    return form.value.messageRecipient.flatMap(async id => (await getUsersByRoleId(id)).data);
  } else if (form.value.recipientType === 'user') {
    return selectedOptions.value.filter(option => form.value.messageRecipient.includes(option.id));
  }
  return [];
}

//查询平台 角色 部门 模版信息 部门为树状
async function getUsers() {
  try {
    users.value = (await selectUser(form.value.sendMode)).data;
  } catch (error) {
    console.error('未获取到用户信息', error);
  }
}
async function getRoles() {
  try {
    roles.value = (await selectRole()).data;
  } catch (error) {
    console.error('未获取到角色信息', error);
  }
}
async function getDepts() {
  try {
    depts.value = buildTree((await selectDept()).data);
  } catch (error) {
    console.error('未获取到部门信息', error);
  }
}
function buildTree(depts) {
  const map = {}, root = [];
  depts.forEach(dept => {
    map[dept.deptId] = dept;
    if (dept.parentId === 0) root.push(dept);
    else {
      map[dept.parentId].children = map[dept.parentId].children || [];
      map[dept.parentId].children.push(dept);
    }
  });
  return root;
}
async function getTemplate() {
  try {
    templates.value = (await selecTemplates()).data;
  } catch (error) {
    console.error('未获取到模版信息', error);
  }
}

function reset() {
  form.value = { messageTitle: null, messageContent: null, messageTemplate: null, messageRecipient: null, remark: null, sendMode: null, recipientType: null };
  proxy.resetForm("messageSystemFormRef");
}
function toggleDialog() {
  dialogVisible.value = !dialogVisible.value;
  if (!dialogVisible.value) {
    reset();
    emit('close');
  }
}
function handleClosed() {reset(); emit('close');}
function handleContentTypeChange() {form.value.messageContent = null;}
function handleTemplateChange(value) { form.value.messageContent = value;}
function handleContentInput(value) {form.value.messageContent = value;}
function validateMessageContent(rule, value, callback) {
  const pattern = /^[^?]+?\?[^=]+?=.*$/;
  if (form.value.sendMode === '1' && form.value.contentType === 'content' && !pattern.test(value)) {
    callback(new Error('短信输入内容格式必须为：模板名?模板参数=值'));
  } else {
    callback();
  }
}
defineExpose(
  { open: () => { 
    dialogVisible.value = true;  
    fetchRecipients();
  }, 
  getTemplate
});
getTemplate();
</script>

<style scoped>
.custom-dialog {
  background: linear-gradient(135deg, #1f1f1f, #3d3d3d);
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  color: #fff;
}

.custom-form {
  padding: 20px;
}

.custom-form .el-form-item__label {
  color: #fff;
}

.custom-form .el-input__inner, .custom-form .el-select .el-input__inner {
  background-color: #2c2c2c;
  border-color: #444;
  color: #fff;
}

.custom-form .el-input__inner::placeholder, .custom-form .el-select .el-input__inner::placeholder {
  color: #888;
}

.custom-form .el-input__inner:focus, .custom-form .el-select .el-input__inner:focus {
  border-color: #00aaff;
}

.custom-button {
  background-color: #00aaff;
  border-color: #00aaff;
  color: #fff;
}

.custom-button:hover {
  background-color: #0088cc;
  border-color: #0088cc;
}
</style>