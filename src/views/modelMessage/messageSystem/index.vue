<template>
  <div class="message-system-container">
    <!-- 优化后的搜索区域 - 删除收起功能 -->
    <div class="search-panel">
      <div class="search-panel-header">
        <div class="header-icon"><el-icon><Search /></el-icon></div>
        <span class="header-title">高级筛选</span>
      </div>
      <div class="search-panel-content">
        <el-form :model="queryParams" ref="queryRef" :inline="true">
          <el-form-item label="消息标题" prop="messageTitle">
            <el-input v-model="queryParams.messageTitle" placeholder="请输入标题关键词" clearable prefix-icon="Search" @keyup.enter="handleQuery" class="custom-input" />
          </el-form-item>
          <el-form-item label="消息状态" prop="messageStatus">
            <el-select v-model="queryParams.messageStatus" placeholder="请选择消息状态" clearable class="custom-select">
              <el-option v-for="dict in message_status" :key="dict.value" :label="dict.label" :value="dict.value">
                <div class="option-with-dot">
                  <span class="status-dot" :class="dict.value === '0' ? 'status-unread' : 'status-read'"></span>{{ dict.label }}
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item class="search-actions">
            <el-button type="primary" @click="handleQuery" class="search-btn"><el-icon><Search /></el-icon><span>搜索</span></el-button>
            <el-button @click="resetQuery" class="reset-btn"><el-icon><RefreshRight /></el-icon><span>重置</span></el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 优化后的操作按钮区域 - 删除收起筛选按钮 -->
    <div class="action-toolbar">
      <div class="left-actions">
        <el-tooltip content="发送新消息" placement="top">
          <el-button type="primary" class="action-btn send-btn" @click="handleAdd" v-hasPermi="['modelMessage:messageSystem:add']"><el-icon><Plus /></el-icon><span>发送信息</span></el-button>
        </el-tooltip>
        <el-tooltip content="删除选中的消息" placement="top">
          <el-button type="danger" class="action-btn delete-btn" :disabled="multiple" @click="handleDelete"><el-icon><Delete /></el-icon><span>批量删除</span></el-button>
        </el-tooltip>
      </div>
      <div class="right-actions">
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" class="custom-toolbar"></right-toolbar>
      </div>
    </div>
   
    <!-- 表格区域 -->
    <div class="message-card">
      <div class="message-card-header">
        <div class="left"><div class="title-icon"><el-icon><ChatDotRound /></el-icon></div><h3 class="title">消息列表</h3></div>
        <div class="right"><div class="total-badge">共 <span class="highlight">{{ total }}</span> 条消息</div></div>
      </div>
      
      <div class="table-container">
        <el-table v-loading="loading" :data="messageSystemList" @selection-change="handleSelectionChange" border class="message-table">
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="消息标题" prop="messageTitle" min-width="30%" width="auto">
            <template #default="scope">
              <div class="msg-title-cell" @click="openDrawer(scope.row.messageId)">
                <el-icon class="envelope-icon"><Message /></el-icon>
                <span class="msg-text">{{ scope.row.messageTitle }}</span>
                <div class="status-dot" :class="getStatusClass(scope.row.messageStatus)" :title="getStatusLabel(scope.row.messageStatus)"></div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="发件人" prop="createBy" min-width="15%" width="auto" align="center">
            <template #default="scope">
              <div class="sender-wrapper">
                <el-avatar :size="28" class="sender-avatar" :style="getRandomAvatarColor(scope.row.createBy)">{{ scope.row.createBy.substring(0, 1).toUpperCase() }}</el-avatar>
                <span class="sender-name">{{ scope.row.createBy }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="发送时间" prop="createTime" min-width="18%" width="auto" align="center">
            <template #default="scope"><span class="time-text">{{ formatDate(scope.row.createTime) }}</span></template>
          </el-table-column>
          <el-table-column label="状态" min-width="10%" width="auto" align="center">
            <template #default="scope">
              <el-tag :type="getTagType(scope.row.messageStatus)" size="small" effect="light" class="status-tag">{{ getStatusLabel(scope.row.messageStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="15%" width="auto" align="center">
            <template #default="scope">
              <div class="op-buttons">
                <el-button type="primary" link size="small" @click.stop="openDrawer(scope.row.messageId)"><el-icon><View /></el-icon>查看</el-button>
                <el-button type="danger" link size="small" @click.stop="handleDelete(scope.row)"><el-icon><Delete /></el-icon>删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 空数据展示 -->
        <div v-if="!loading && messageSystemList.length === 0" class="empty-data">
          <el-empty description="暂无消息数据">
            <el-button type="primary" size="small" @click="handleAdd" v-hasPermi="['modelMessage:messageSystem:add']"><el-icon><Plus /></el-icon>发送新消息</el-button>
          </el-empty>
        </div>
      </div>
      
      <!-- 分页区域 -->
      <div class="table-footer" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next" :total="total" :page-size="queryParams.pageSize" :current-page="queryParams.pageNum" :page-sizes="[10, 20, 50, 100]" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </div>
    
    <!-- 发送信息组件 -->
    <AddMessage ref="sendMessageRef" @success="handleSendSuccess"/>
    
    <!-- 信息详情弹窗 -->
    <el-dialog :title="title" v-model="drawerVisible" width="600px" destroy-on-close class="message-detail-dialog">
      <div class="message-detail-content">
        <div class="message-header">
          <h2 class="message-detail-title">{{ detailForm.messageTitle }}</h2>
          <div class="message-meta">
            <div class="sender-info">
              <el-avatar :size="36" class="sender-detail-avatar" :style="getRandomAvatarColor(detailForm.createBy)">{{ detailForm.createBy ? detailForm.createBy.substring(0, 1).toUpperCase() : '' }}</el-avatar>
              <div class="sender-detail">
                <div class="sender-name">{{ detailForm.createBy }}</div>
                <div class="send-time">{{ parseTime(detailForm.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</div>
              </div>
            </div>
            <el-tag :type="getTagType(detailForm.messageStatus)" effect="dark" class="detail-status-tag">{{ getStatusLabel(detailForm.messageStatus) }}</el-tag>
          </div>
        </div>
        <div class="message-body"><p class="message-content">{{ detailForm.messageContent }}</p></div>
        <div class="message-footer">
          <div class="info-grid">
            <div class="info-item"><div class="info-icon"><el-icon><User /></el-icon></div><span class="label">收件人:</span><span class="value">{{ detailForm.messageRecipient }}</span></div>
            <div class="info-item"><div class="info-icon"><el-icon><Operation /></el-icon></div><span class="label">发送方式:</span><span class="value"><dict-tag :options="send_mode" :value="detailForm.sendMode" /></span></div>
            <div class="info-item"><div class="info-icon"><el-icon><InfoFilled /></el-icon></div><span class="label">消息类型:</span><span class="value"><dict-tag :options="message_type" :value="detailForm.messageType" /></span></div>
            <div class="info-item" v-if="detailForm.remark"><div class="info-icon"><el-icon><Document /></el-icon></div><span class="label">备注:</span><span class="value">{{ detailForm.remark }}</span></div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="MessageSystem">
import { ref, reactive, toRefs, getCurrentInstance, computed } from 'vue';
import { delMessageSystem, listMessageSystem, getMessageSystem, getUpdate } from "@/api/modelMessage/messageSystem";
import AddMessage from './components/addMessage.vue';

const { proxy } = getCurrentInstance();
const { message_status, message_type, send_mode } = proxy.useDict("message_status", "message_type", "send_mode");

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
    title.value ='信息详情';
    drawerVisible.value = true;
    getUpdate(messageId).then(response => {});
  });
}

function getStatusClass(status) {
  const statusMap = {
    '0': 'status-unread',
    '1': 'status-read'
  };
  return statusMap[status] || 'status-default';
}

function getStatusLabel(status) {
  const statusMap = {
    '0': '未读',
    '1': '已读'
  };
  return statusMap[status] || '未知';
}

function getTagType(status) {
  const typeMap = {
    '0': 'danger',
    '1': 'success'
  };
  return typeMap[status] || 'info';
}

function getRandomAvatarColor(seed) {
  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #6a11cb, #2575fc)',
    'linear-gradient(135deg, #f093fb, #f5576c)'
  ];
  const index = seed ? seed.length % colors.length : 0;
  return { background: colors[index] };
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (date.getFullYear() === today.getFullYear()) {
    return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + 
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
};

// 分页处理
const handleSizeChange = (size) => {
  queryParams.value.pageSize = size;
  getList();
};

const handleCurrentChange = (page) => {
  queryParams.value.pageNum = page;
  getList();
};

getList();
</script>
<style scoped>
/* 全局布局 */
.message-system-container{padding:16px;background:#f5f7fa;min-height:100vh}
.message-card{background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.1);margin-bottom:16px}
.message-card-header{padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0}
.left{display:flex;align-items:center}
.right{display:flex;align-items:center}
.title-icon{width:32px;height:32px;border-radius:6px;background:#409EFF;display:flex;align-items:center;justify-content:center}
.title-icon .el-icon{color:white;font-size:18px}
.title{margin:0 0 0 10px;font-size:16px;font-weight:500}
.total-badge{font-size:13px;color:#606266;background:#f6f8fa;border-radius:20px;padding:4px 12px}
.highlight{color:#409EFF;font-weight:500}

/* 表格容器 */
.table-container{padding:12px}
.message-table{width:100%}
:deep(.el-table__header) th{background-color:#f5f7fa;font-weight:500;height:45px;padding:8px 0}
:deep(.el-table__row){transition:all 0.2s}
:deep(.el-table__row:hover){background-color:#f0f7ff}
:deep(.el-table .cell){padding:8px 5px}
:deep(.el-table__body-wrapper){overflow-x:hidden}
:deep(.el-table){table-layout:fixed}

/* 消息标题单元格 */
.msg-title-cell{display:flex;align-items:center;padding:6px 0;cursor:pointer;position:relative}
.envelope-icon{color:#409EFF;margin-right:8px;font-size:16px;flex-shrink:0}
.msg-text{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.status-dot{width:8px;height:8px;border-radius:50%;margin-left:8px;flex-shrink:0}
.status-unread{background-color:#f56c6c;box-shadow:0 0 0 2px rgba(245,108,108,0.2)}
.status-read{background-color:#67c23a;box-shadow:0 0 0 2px rgba(103,194,58,0.2)}

/* 发件人单元格 */
.sender-wrapper{display:flex;align-items:center;justify-content:center;gap:8px}
.sender-avatar{border:1px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.1)}
.sender-name{font-size:13px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px}

/* 时间文本 */
.time-text{font-size:13px;color:#606266}

/* 状态标签 */
.status-tag{padding:4px 8px}

/* 操作按钮 */
.op-buttons{display:flex;justify-content:center;gap:8px}
.op-buttons .el-button{padding:6px;min-height:28px}
.op-buttons .el-button .el-icon{margin-right:4px}

/* 空数据 */
.empty-data{text-align:center;padding:30px 0}

/* 表格页脚 */
.table-footer{padding:12px 16px;border-top:1px solid #ebeef5;text-align:right}

/* 重新设计的搜索面板 */
.search-panel{background:#fff;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.05);margin-bottom:20px;overflow:hidden}
.search-panel-header{display:flex;align-items:center;height:54px;padding:0 20px;background:linear-gradient(90deg,#f8f9fc 0%,#f2f5fa 100%);border-bottom:1px solid #eef0f5}
.header-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#4b9dff,#2d84ea);display:flex;align-items:center;justify-content:center}
.header-icon .el-icon{color:#fff;font-size:16px}
.header-title{margin-left:12px;font-size:15px;font-weight:500;color:#2c3e50}
.search-panel-content{padding:15px 20px}

/* 自定义表单样式 */
.custom-input{width:220px;transition:all 0.3s}
.custom-input:hover,:deep(.custom-input:focus-within){box-shadow:0 0 0 2px rgba(64,158,255,0.2)}
.custom-select{width:180px;transition:all 0.3s}
.custom-select:hover,:deep(.custom-select:focus-within){box-shadow:0 0 0 2px rgba(64,158,255,0.2)}
.search-actions{margin-left:10px}
:deep(.el-input__wrapper),:deep(.el-select .el-input__wrapper){box-shadow:0 0 0 1px rgba(220,223,230,0.6) inset;padding:1px 11px;border-radius:6px}
:deep(.el-input__wrapper:hover),:deep(.el-select .el-input__wrapper:hover){box-shadow:0 0 0 1px #c0c4cc inset}
:deep(.el-form-item__label){color:#606266;font-weight:500}
.option-with-dot{display:flex;align-items:center;gap:5px}

/* 自定义按钮样式 */
.search-btn{padding:0 20px;height:36px;background:linear-gradient(90deg,#3a8ee6,#5ca9fd);border:none;border-radius:6px;color:white;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:5px}
.search-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(64,158,255,0.3)}
.search-btn:active{transform:translateY(0);opacity:0.9}
.reset-btn{padding:0 20px;height:36px;background:#fff;border:1px solid #dcdfe6;border-radius:6px;color:#606266;transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:5px}
.reset-btn:hover{border-color:#409EFF;color:#409EFF}

/* 操作工具栏 */
.action-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;background:#fff;border-radius:12px;padding:12px 16px;box-shadow:0 4px 15px rgba(0,0,0,0.05)}
.left-actions{display:flex;align-items:center;gap:10px}
.right-actions{display:flex;align-items:center}

/* 操作按钮 */
.action-btn{height:38px;border-radius:6px;transition:all 0.3s;font-weight:500;display:flex;align-items:center;gap:5px}
.action-btn .el-icon{font-size:16px}
.action-btn:hover{transform:translateY(-2px)}
.send-btn{background:linear-gradient(90deg,#3a8ee6,#5ca9fd);border:none;padding:8px 16px;color:#fff}
.send-btn:hover{box-shadow:0 4px 12px rgba(64,158,255,0.3)}
.delete-btn{background:linear-gradient(90deg,#f56c6c,#fa8c8c);border:none;padding:8px 16px;color:#fff}
.delete-btn:hover:not(:disabled){box-shadow:0 4px 12px rgba(245,108,108,0.3)}
.delete-btn:disabled{background:#f7f7f7;color:#c0c4cc;border:1px solid #e4e7ed;cursor:not-allowed}
.refresh-btn{background:#fff;color:#606266;border:1px solid #dcdfe6;padding:8px 16px}
.refresh-btn:hover{border-color:#409EFF;color:#409EFF}
.custom-toolbar{margin-left:10px}

/* 详情弹窗 */
.message-detail-dialog :deep(.el-dialog__header){background:#409EFF;color:white;padding:15px;border-radius:8px 8px 0 0}
.message-detail-dialog :deep(.el-dialog__title){color:white}
.message-detail-dialog :deep(.el-dialog__headerbtn .el-dialog__close){color:white}
.message-detail-content{padding:20px}
.message-header{margin-bottom:20px;border-bottom:1px solid #ebeef5;padding-bottom:15px}
.message-detail-title{font-size:18px;margin-bottom:15px;font-weight:600}
.message-meta{display:flex;justify-content:space-between;align-items:center}
.sender-info{display:flex;align-items:center}
.sender-detail{margin-left:10px}
.sender-name{font-weight:500}
.send-time{font-size:12px;color:#999}
.message-body{background:#f9fbfd;padding:15px;border-radius:8px;margin-bottom:20px;min-height:100px;border-left:3px solid #409EFF}
.message-content{white-space:pre-line;line-height:1.6}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}
.info-item{display:flex;align-items:center}
.info-icon{width:24px;height:24px;border-radius:50%;background:rgba(64,158,255,0.1);display:flex;align-items:center;justify-content:center;margin-right:8px}
.info-item .label{color:#909399;margin-right:5px;font-weight:500}
.info-item .value{color:#303133}
</style>