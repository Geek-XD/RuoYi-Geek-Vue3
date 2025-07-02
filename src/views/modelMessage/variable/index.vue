<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="变量名称" prop="variableName">
        <el-input v-model="queryParams.variableName" placeholder="请输入变量名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <br>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">创建变量</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除变量</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 卡片视图 -->
    <div class="card-view">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(item, index) in variableList" :key="index" class="card-col">
          <el-card shadow="hover" class="variable-card" :class="{'variable-card-built-in': item.variableType === '内置变量'}">
            <template #header>
              <div class="card-header">
                <div class="card-header-left">
                  <el-checkbox v-model="item.isSelected" @change="handleSelectChange" class="card-checkbox"></el-checkbox>
                  <span class="card-title">{{ item.variableName }}</span>
                </div>
                <el-tag size="small" effect="plain" :type="getVariableTypeTag(item.variableType)">{{ item.variableType }}</el-tag>
              </div>
            </template>
            <div class="card-content">
              <div class="card-item">
                <span class="card-label">变量内容</span>
                <div class="content-display" :class="{'content-built-in': item.variableType === '内置变量'}">
                  <i v-if="item.variableType === '内置变量'" 
                     :class="getBuiltInVariableIcon(item.variableContent)" 
                     class="built-in-icon"></i>
                  <span class="card-value">{{ formatVariableContent(item) }}</span>
                </div>
              </div>
              <div class="card-actions">
                <el-button type="primary" size="small" icon="Edit" @click="handleUpdate(item)">编辑</el-button>
                <el-button type="danger" size="small" icon="Delete" @click="handleDelete(item)">删除</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 变量管理对话框组件 -->
    <VariableFormDialog ref="variableFormDialog" :visible="open" :title="title" :form="form"
      :submitLoading="submitLoading"  @update:visible="open = $event" @submit="submitForm"
      @cancel="cancel" @variable-type-change="handleVariableTypeChange"/>
  </div>
</template>

<script setup name="Variable">
import { listVariable, getVariable, delVariable, addVariable, updateVariable } from "@/api/modelMessage/variable";
import { ElMessage } from "element-plus";
import VariableFormDialog from "./components/VariableFormDialog.vue";
const { proxy } = getCurrentInstance();

const variableList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const submitLoading = ref(false); // 新增: 提交按钮加载状态

const data = reactive({
  form: {
    variableName: null,
    variableType: null,
    variableContent: null,
    builtInVariable: null
  },
  queryParams: {
    pageNum: 1,
    pageSize: 8,
    variableName: null,
  }
});

const { queryParams, form } = toRefs(data);
 
/** 查询变量管理列表 */
function getList() {
  loading.value = true;
  listVariable(queryParams.value).then(response => {
    variableList.value = response.rows.map(item => {
      item.isSelected = false;
      return item;
    });
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    variableId: null,
    variableName: null,
    variableType: null,
    variableContent: null,
    builtInVariable: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  };
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 处理卡片选择变化
function handleSelectChange() {
  const selectedItems = variableList.value.filter(i => i.isSelected);
  ids.value = selectedItems.map(i => i.variableId);
  single.value = selectedItems.length != 1;
  multiple.value = !selectedItems.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加变量";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _variableId = row.variableId || ids.value
  getVariable(_variableId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "编辑变量";
  });
}

// 当变量类型改变时触发
function handleVariableTypeChange(value) {
  if (value === '内置变量') {
    form.value.builtInVariable = null;
    form.value.variableContent = '';
  } else {
    form.value.variableContent = ''; 
  }
}

/** 提交按钮 */
async function submitForm() {
  try {
    submitLoading.value = true;
    if (form.value.variableId != null) {
      await updateVariable(form.value);
      proxy.$modal.msgSuccess("编辑成功");
    } else {
      await addVariable(form.value);
      proxy.$modal.msgSuccess("新增成功");
    }

    // 关闭对话框并刷新列表
    open.value = false;
    getList();
  } catch (error) {
    ElMessage.error('操作失败');
  } finally {
    submitLoading.value = false;
  }
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _variableIds = row.variableId || ids.value;
  proxy.$modal.confirm('是否确认删除变量管理编号为"' + _variableIds + '"的数据项？').then(function() {
   return delVariable(_variableIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('modelMessage/variable/export', {
    ...queryParams.value
  }, `variable_${new Date().getTime()}.xlsx`)
}

// 根据变量类型获取标签类型
function getVariableTypeTag(type) {
  if (type === '指定文本') return 'success';
  if (type === '内置变量') return 'primary';
  return 'info';
}

// 格式化变量内容展示
function formatVariableContent(item) {
  if (item.variableType === '内置变量') {
    return getBuiltInVariableLabel(item.variableContent);
  }
  return item.variableContent;
}

// 获取内置变量的显示文本
function getBuiltInVariableLabel(value) {
  const labels = {
    'time': '当前时间',
    'date': '当前日期',
    'datetime': '当前日期和时间',
    'addresser': '发件人信息',
    'recipients': '收件人信息',
    'RandomnDigits': '随机数字',
    'RandomnCharacters': '随机字母',
    'RandomNDigitLetters': '随机数字和字母'
  };
  return labels[value] || value;
}

// 获取内置变量的图标
function getBuiltInVariableIcon(value) {
  const icons = {
    'time': 'el-icon-time',
    'date': 'el-icon-date',
    'datetime': 'el-icon-date',
    'addresser': 'el-icon-user',
    'recipients': 'el-icon-user',
    'RandomnDigits': 'el-icon-coin',
    'RandomnCharacters': 'el-icon-collection',
    'RandomNDigitLetters': 'el-icon-collection-tag'
  };
  return icons[value] || 'el-icon-data-analysis';
}

getList();
</script>

<style scoped>
/* 整体布局样式 */
.app-container {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa, #edf2f7);
}

.el-form {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 15px rgba(0,0,0,0.05);
  backdrop-filter: blur(4px);
  margin-bottom: 20px;
}

/* 按钮样式优化 */
.el-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.el-button--primary {
  background: linear-gradient(45deg, #3a7bd5, #00d2ff);
  border: none;
  color: white;
}

.el-button--danger {
  background: linear-gradient(45deg, #ff5f6d, #ffc371);
  border: none;
  color: white;
}

.el-button--warning {
  background: linear-gradient(45deg, #f7971e, #ffd200);
  border: none;
  color: white;
}

.el-button--info {
  background: linear-gradient(45deg, #8e9eab, #eef2f3);
  border: none;
  color: #333;
}

/* 输入框样式优化 */
.el-input__inner, .el-textarea__inner {
  border-radius: 8px;
  border: 1px solid #e8edf2;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);
}

.el-input__inner:focus, .el-textarea__inner:focus {
  border-color: #3a7bd5;
  box-shadow: 0 0 0 2px rgba(58, 123, 213, 0.2);
}

/* 卡片视图布局 - 统一样式并修复间距问题 */
.card-view {
  margin: 20px 0;
}

.el-row {
  margin-left: -8px !important;
  margin-right: -8px !important;
}

.card-col {
  padding: 8px !important;
  height: auto;
}

.variable-card {
  height: 225px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 20px rgba(0,0,0,0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.variable-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 25px rgba(0,0,0,0.12);
}

.variable-card .el-card__header {
  background: linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.9));
  border-bottom: 1px solid #f0f3f7;
  padding: 12px 15px;
  height: 50px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.variable-card .el-card__body {
  padding: 15px;
  height: calc(100% - 50px);
  display: flex;
  flex-direction: column;
}

.card-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-left {
  display: flex;
  align-items: center;
  width: 75%;
  gap: 8px;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-checkbox {
  margin: 0;
  flex-shrink: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-grow: 1;
  overflow: hidden;
}

.card-label {
  font-size: 13px;
  color: #8492a6;
  font-weight: 500;
}

.card-value {
  font-size: 14px;
  color: #505A6D;
  word-break: break-all;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #f0f3f7;
  margin-top: auto;
}

/* 标签样式优化 */
.el-tag {
  border-radius: 6px;
  padding: 0 8px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  white-space: nowrap;
}

.el-tag--success {
  background: linear-gradient(120deg, #84fab0, #8fd3f4);
  color: #1f4037;
}

.el-tag--primary {
  background: linear-gradient(120deg, #6a85b6, #bac8e0);
  color: #2c3e50;
}

.el-tag--info {
  background: linear-gradient(120deg, #e0c3fc, #8ec5fc);
  color: #4a00e0;
}

/* 分页和动画 */
.el-pagination {
  margin-top: 20px;
  justify-content: center;
  padding: 15px 0;
  background: rgba(255,255,255,0.8);
  border-radius: 10px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 对话框基本样式 */
.el-dialog {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 30px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.el-dialog__header {
  background: linear-gradient(to right, #3a7bd5, #00d2ff);
  padding: 20px;
}

.el-dialog__title {
  color: white;
  font-weight: 600;
  font-size: 18px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.el-dialog__body {
  padding: 30px 25px;
}

.el-dialog__footer {
  border-top: 1px solid #f0f3f7;
  padding: 15px 25px;
}

/* 适配不同屏幕大小 */
@media screen and (max-width: 768px) {
  .variable-card {
    height: 245px;
  }
  .built-in-variables-grid {
    grid-template-columns: 1fr;
  }
  .variable-dialog {
    width: 95% !important;
  }
}

@media screen and (max-width: 576px) {
  .card-actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  .card-actions .el-button {
    margin-left: 0 !important;
  }
}

/* 卡片内容样式优化 */
.content-display {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px 12px;
  position: relative;
  min-height: 45px;
  display: flex;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.content-display:hover {
  background: #f0f2f5;
}

.content-built-in {
  background: rgba(58, 123, 213, 0.08);
  padding-left: 35px;
}

.built-in-icon {
  position: absolute;
  left: 10px;
  top: 12px;
  color: #3a7bd5;
  font-size: 16px;
}

.variable-card-built-in .el-card__header {
  background: linear-gradient(to right, rgba(235, 244, 255, 0.8), rgba(235, 244, 255, 0.9));
}
</style>