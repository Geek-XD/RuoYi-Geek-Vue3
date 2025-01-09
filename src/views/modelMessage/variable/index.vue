<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="变量名称" prop="variableName">
        <el-input v-model="queryParams.variableName" placeholder="请输入变量名称" clearable   @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增变量</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除变量</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="variableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="变量名称" align="center" prop="variableName" />
      <el-table-column label="变量类型" align="center" prop="variableType" />
      <el-table-column label="变量内容" align="center" prop="variableContent" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改变量管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="variableRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="变量名称" prop="variableName">
          <el-input v-model="form.variableName" placeholder="请输入变量名称" />
        </el-form-item>
        <el-form-item label="变量类型" prop="variableType">
          <el-select v-model="form.variableType" placeholder="请选择变量类型" @change="handleVariableTypeChange">
            <el-option label="指定文本" value="指定文本"></el-option>
            <el-option label="内置变量" value="内置变量"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.variableType === '内置变量'" label="内置变量内容" label-width="100px" prop="builtInVariable">
          <el-select v-model="form.variableContent" placeholder="请选择内置变量">
            <el-option label="发送时间" value="time"></el-option>
            <el-option label="发送日期" value="date"></el-option>
            <el-option label="发送日期时间" value="datetime"></el-option>
            <el-option label="发件人" value="addresser"></el-option>
            <el-option label="收件人" value="recipients"></el-option>
            <el-option label="随机n位数字" value="RandomnDigits"></el-option>
            <el-option label="随机n位字母" value="RandomnCharacters"></el-option>
            <el-option label="随机n位数字字母" value="RandomN-digitLetters"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.variableType !== '内置变量'" label="变量内容" prop="variableContent">
          <el-input v-model="form.variableContent" type="textarea" placeholder="请输入变量内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Variable">
import { listVariable, getVariable, delVariable, addVariable, updateVariable } from "@/api/modelMessage/variable";
import { ElMessage } from "element-plus";
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

const data = reactive({
  form: {
    variableName: null,
    variableType: null,
    variableContent: null,
    builtInVariable: null
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    variableName: null,
  },
  rules: {
    variableName: [{ required: true, message: '请输入变量名称', trigger: 'blur' }],
    variableType: [{ required: true, message: '请选择变量类型', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data); 
 
/** 查询变量管理列表 */
function getList() {
  loading.value = true;
  listVariable(queryParams.value).then(response => {
    variableList.value = response.rows;
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
  form.value = { variableId: null, variableName: null, variableType: null, variableContent: null, builtInVariable: null,
    createBy: null, createTime: null, updateBy: null, updateTime: null, remark: null };
  proxy.resetForm("variableRef");
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

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.variableId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
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
function submitForm() {
  proxy.$refs["variableRef"].validate(async (valid) => {
    if (valid) {
      try {
        let result;
        if (form.value.variableId != null) {
          result = await updateVariable(form.value);
          proxy.$modal.msgSuccess("编辑成功");
        } else {
          result = await addVariable(form.value);
          proxy.$modal.msgSuccess("新增成功");
        }

        // 关闭对话框并刷新列表
        open.value = false;
        getList();
      } catch (error) {
        ElMessage.error('操作失败');
      }
    }
  });
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

getList();
</script>
<style scoped>
.app-container {
  padding: 20px;
  background-color: #f8f9fa;
}

.el-form, .el-table, .el-dialog {
  margin-bottom: 20px;
}

.el-button {
  transition: all 0.3s ease;
  font-weight: bold;
}

.el-button:hover {
  transform: scale(1.05);
}

.el-button--primary {
  background: linear-gradient(90deg, #67c23a, #5cb87a);
  border-color: transparent;
  color: white;
}

.el-button--danger {
  background: linear-gradient(90deg, #f56c6c, #e05b5b);
  border-color: transparent;
  color: white;
}

.el-button--warning {
  background: linear-gradient(90deg, #e6a23c, #d98e2d);
  border-color: transparent;
  color: white;
}

.el-button--plain {
  color: #409eff;
  background-color: #ecf5ff;
  border-color: #b3d8ff;
}

.el-button--plain:hover {
  background: linear-gradient(90deg, #ecf5ff, #d9ecff);
}

/* Table */
.el-table {
  margin-top: 20px;
}

.el-table th > .cell {
  color: #303133;
  font-weight: bold;
}

.el-table td {
  padding: 10px;
}

/* Form */
.el-form-item {
  margin-bottom: 10px;
}

.el-input, .el-select {
  width: 100%;
}

/* Dialog */
.el-dialog {
  border-radius: 12px;
}

.el-dialog__header {
  background-color: #f5f7fa;
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.el-dialog__footer {
  border-top: 1px solid #ebeef5;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

/* Input fields */
.el-input__inner {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

/* Select dropdown */
.el-select .el-input__inner {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

/* Textarea */
.el-textarea__inner {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

/* Icons */
.el-icon {
  color: #409eff;
}

/* Hover effects */
.el-button:hover {
  cursor: pointer;
}

</style>