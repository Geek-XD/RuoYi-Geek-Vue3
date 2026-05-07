<template>
  <div class="app-container">
    <el-card shadow="never" body-class="search-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入表达式名称" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt10">
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="plus" @click="handleAdd"
            v-hasPermi="['system:expression:add']">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="edit" :disabled="single" @click="handleUpdate"
            v-hasPermi="['system:expression:edit']">修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="delete" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['system:expression:remove']">删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" plain icon="download" @click="handleExport"
            v-hasPermi="['system:expression:export']">导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-alert title="流程设计说明" type="warning">
        <div>1、用于指定流程任务配置中候选角色的表达式，可以使用SpEL表达式和流程中的变量。</div>
        <div>2、更改表达式<strong style="color: red;">不会影响</strong>已部署的流程实例。</div>
      </el-alert>
      <el-table v-loading="loading" :data="expressionList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="主键" align="center" prop="id" />
        <el-table-column label="名称" align="center" prop="name" />
        <el-table-column label="表达式内容" align="center" prop="expression" />
        <el-table-column label="指定类型" align="center" prop="dataType">
          <template v-slot="scope">
            <dict-tag :options="exp_data_type" :value="scope.row.dataType" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template v-slot="scope">
            <el-button type="primary" icon="edit" link @click="handleUpdate(scope.row)"
              v-hasPermi="['system:expression:edit']">修改</el-button>
            <el-button type="primary" icon="delete" link @click="handleDelete(scope.row)"
              v-hasPermi="['system:expression:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 添加或修改流程达式对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入表达式名称" />
        </el-form-item>
        <el-form-item label="内容" prop="expression">
          <el-input v-model="form.expression" placeholder="请输入表达式内容" />
        </el-form-item>
        <el-form-item label="指定类型" prop="dataType">
          <el-radio-group v-model="form.dataType">
            <el-radio v-for="dict in exp_data_type" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_common_status" :key="dict.value" :value="parseInt(dict.value)">{{ dict.label
              }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, getCurrentInstance, onMounted } from "vue";
import { listExpression, getExpression, delExpression, addExpression, updateExpression } from "@ruoyi/module-flowable/api/expression";

const { proxy } = getCurrentInstance();
const { sys_common_status, exp_data_type } = proxy.useDict("sys_common_status", "exp_data_type");

const loading = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const showSearch = ref(true);
const total = ref(0);
const expressionList = ref([]);
const title = ref("");
const open = ref(false);
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: null,
  expression: null,
  status: null,
});
const formRef = ref();
const form = ref({
  dataType: 'fixed'
});
const rules = reactive({});

onMounted(() => {
  getList();
});

/** 查询流程达式列表 */
function getList() {
  loading.value = true;
  listExpression(queryParams).then(response => {
    expressionList.value = response.rows;
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
    id: null,
    name: null,
    expression: null,
    createTime: null,
    updateTime: null,
    createBy: null,
    updateBy: null,
    status: null,
    remark: null
  };
  proxy.resetForm("formRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryForm");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加流程表达式";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const id = row.id || ids.value;
  getExpression(id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改流程达式";
  });
}

/** 提交按钮 */
function submitForm() {
  formRef.value.validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateExpression(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addExpression(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const rowIds = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除流程达式编号为"' + rowIds + '"的数据项？').then(function () {
    return delExpression(rowIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/expression/export', {
    ...queryParams
  }, `expression_${new Date().getTime()}.xlsx`)
}
</script>
