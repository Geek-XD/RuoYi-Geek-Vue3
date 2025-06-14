<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px"
        class="form-container">
        <el-form-item label="标题" prop="messageTitle">
          <el-input v-model="queryParams.messageTitle" placeholder="请输入标题" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="消息状态" prop="messageStatus">
          <el-select v-model="queryParams.messageStatus" placeholder="请选择状态" clearable style="width: 190px">
            <el-option v-for="dict in message_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="mt10">
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd"
            v-hasPermi="['modelMessage:messageSystem:add']">发送信息</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">批量删除</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="filteredMessageSystemList" @selection-change="handleSelectionChange"
        class="table-container">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="标题" align="center" prop="messageTitle">
          <template #default="scope">
            <span @click="openDrawer(scope.row.messageId)" class="message-title"
              style="cursor: pointer; color: darkcyan;">
              {{ scope.row.messageTitle }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="发件人" align="center" prop="createBy" />
        <el-table-column label="发件时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消息状态" align="center" prop="messageStatus">
          <template #default="scope">
            <dict-tag :options="message_status" :value="scope.row.messageStatus" />
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <AddMessage ref="sendMessageRef" @success="handleSendSuccess" />

    <el-dialog :title="title" v-model="drawerVisible" width="40%" append-to-body :show-overlay="false"
      class="custom-dialog">
      <div>
        <el-descriptions :column="1" border class="descriptions">
          <el-descriptions-item label="标题">{{ detailForm.messageTitle }}</el-descriptions-item>
          <el-descriptions-item label="发件人">{{ detailForm.createBy }}</el-descriptions-item>
          <el-descriptions-item label="发送方式">
            <dict-tag :options="send_mode" :value="detailForm.sendMode" />
          </el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ parseTime(detailForm.createTime, '{y}-{m}-{d} {h}:{i}:{s}')
          }}</el-descriptions-item>
          <el-descriptions-item label="消息内容">{{ detailForm.messageContent }}</el-descriptions-item>
          <el-descriptions-item label="收件人">{{ detailForm.messageRecipient }}</el-descriptions-item>
          <el-descriptions-item label="消息类型">
            <dict-tag :options="message_type" :value="detailForm.messageType" />
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ detailForm.remark }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="MessageSystem">
import { ref, reactive, computed, toRefs, getCurrentInstance } from 'vue';
import { delMessageSystem, listMessageSystem, getMessageSystem, getUpdate } from "@/api/modelMessage/messageSystem";
import AddMessage from './addMessage.vue';
import useUserStore from '@/store/modules/user';

const { proxy } = getCurrentInstance();
const { message_status, message_type, send_mode } = proxy.useDict("message_status", "message_type", "send_mode");
const userStore = useUserStore();
const isCustomer = computed(() => !userStore.roles.includes('admin') && !userStore.roles.includes('engineer'));

const messageSystemList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const multiple = ref(true);
const title = ref('');
const total = ref(0);
const sendMessageRef = ref(false);
const drawerVisible = ref(false);
const detailForm = ref({});

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    messageTitle: null,
    messageStatus: null,
  }
});

const { queryParams } = toRefs(data);

// 查询消息管理列表
function getList() {
  loading.value = true;
  listMessageSystem(queryParams.value).then(response => {
    messageSystemList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 搜索按钮操作
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

// 重置按钮操作
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.messageId);
  multiple.value = !selection.length;
}

// 发送信息操作
function handleAdd() {
  sendMessageRef.value.open();
  sendMessageRef.value.getTemplate();
}

// 删除按钮操作
function handleDelete(row) {
  const _messageIds = row.messageId || ids.value;
  proxy.$modal.confirm('是否确认删除消息管理编号为"' + _messageIds + '"的数据项？').then(function () {
    return delMessageSystem(_messageIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除信息成功！");
  }).catch(() => { });
}

function handleSendSuccess() {
  getList();
}

// 打开抽屉并加载详细信息
function openDrawer(messageId) {
  getMessageSystem(messageId).then(response => {
    detailForm.value = response.data;
    title.value = '信息详情';
    drawerVisible.value = true;
    getUpdate(messageId).then(response => { });
  });
}

//过滤
const filteredMessageSystemList = computed(() => {
  if (isCustomer.value) {
    return messageSystemList.value.filter(item => item.sendMode === '0');
  }
  return messageSystemList.value;
});

getList();
</script>

<style scoped>
.el-button {
  transition: all 0.3s ease-in-out;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.el-form {
  margin-bottom: 20px;
}

.el-input__inner,
.el-textarea__inner {
  border-radius: 4px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.el-input__inner:focus,
.el-textarea__inner:focus {
  border-color: #409eff;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 5px rgba(64, 158, 255, 0.5);
}

.el-dialog {
  background-color: #f0f4ff;
  border-radius: 8px;
}

.el-dialog__header {
  background-color: #409eff;
  color: #ffffff;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.el-descriptions {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(4, 116, 245, 0.1);
}

.el-descriptions-item {
  margin-bottom: 20px;
}

.el-descriptions-item label {
  color: #409eff;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.custom-dialog {
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.dict-tag {
  background-color: #e0f7fa;
  color: #009688;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #b2ebf2;
}

.dict-tag:hover {
  background-color: #b2ebf2;
  color: #00695c;
}
</style>