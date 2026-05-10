<template>
  <div class="app-container">
    <el-card shadow="never" body-class="search-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="开始时间" prop="deployTime">
          <el-date-picker clearable v-model="queryParams.deployTime" type="date" value-format="yyyy-MM-dd"
            placeholder="选择时间">
          </el-date-picker>
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
          <el-button type="danger" plain icon="delete" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['system:deployment:remove']">删除
          </el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="todoList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="任务编号" align="center" prop="taskId" :show-overflow-tooltip="true" />
        <el-table-column label="流程名称" align="center" prop="procDefName" />
        <el-table-column label="当前节点" align="center" prop="taskName" />
        <el-table-column label="流程版本" align="center">
          <template v-slot="scope">
            <el-tag size="default">v{{ scope.row.procDefVersion }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="流程发起人" align="center">
          <template v-slot="scope">
            <label>
              <span>{{ scope.row.startUserName }}</span>
              <el-tag type="info">{{ scope.row.startDeptName }}</el-tag>
            </label>
          </template>
        </el-table-column>
        <el-table-column label="接收时间" align="center" prop="createTime" width="180" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template v-slot="scope">
            <el-button type="primary" link icon="edit" @click="handleProcess(scope.row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup>
import { getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { todoList as todoListApi, delDeployment } from "@ruoyi/module-flowable/api/todo";

const { proxy } = getCurrentInstance();

const loading = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const showSearch = ref(true);
const total = ref(0);
const todoList = ref([]);
const title = ref("");
const open = ref(false);
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: null,
  category: null
});
const form = ref({});
const rules = reactive({});

onMounted(() => {
  getList();
});

/** 查询流程定义列表 */
function getList() {
  loading.value = true;
  todoListApi(queryParams).then(response => {
    todoList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function handleProcess(row) {
  proxy.$router.push({
    path: '/flowable/task/todo/detail/index',
    query: {
      procInsId: row.procInsId,
      executionId: row.executionId,
      deployId: row.deployId,
      taskId: row.taskId,
      taskName: row.taskName,
      startUser: row.startUserName + '-' + row.startDeptName,
    }
  })
}

function cancel() {
  open.value = false;
  reset();
}

function reset() {
  form.value = {
    id: null,
    name: null,
    category: null,
    key: null,
    tenantId: null,
    deployTime: null,
    derivedFrom: null,
    derivedFromRoot: null,
    parentDeploymentId: null,
    engineVersion: null
  };
  proxy.resetForm("form");
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

function resetQuery() {
  proxy.resetForm("queryForm");
  handleQuery();
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.taskId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleDelete(row) {
  const rowIds = row.taskId || ids.value;
  proxy.$confirm('是否确认删除流程定义编号为"' + rowIds + '"的数据项?', "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(function () {
    return delDeployment(rowIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  })
}
</script>
