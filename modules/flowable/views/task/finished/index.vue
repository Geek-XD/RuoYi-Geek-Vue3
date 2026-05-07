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
            v-hasPermi="['system:deployment:remove']">删除</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="finishedList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="任务编号" align="center" prop="taskId" :show-overflow-tooltip="true" />
        <el-table-column label="流程名称" align="center" prop="procDefName" :show-overflow-tooltip="true" />
        <el-table-column label="任务节点" align="center" prop="taskName" />
        <el-table-column label="流程发起人" align="center">
          <template v-slot="scope">
            <label>
              {{ scope.row.startUserName }}
              <el-tag type="info">{{ scope.row.startDeptName }}</el-tag>
            </label>
          </template>
        </el-table-column>
        <el-table-column label="接收时间" align="center" prop="createTime" width="180" />
        <el-table-column label="审批时间" align="center" prop="finishTime" width="180" />
        <el-table-column label="耗时" align="center" prop="duration" width="180" />
        <el-table-column label="操作" align="center" width="150" fixed="right" class-name="small-padding fixed-width">
          <template v-slot="scope">
            <el-button type="primary" link icon="tickets" @click="handleFlowRecord(scope.row)">流转记录</el-button>
            <el-button type="primary" link icon="refresh-left" @click="handleRevoke(scope.row)">撤回</el-button>
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
import { finishedList as finishedListApi, delDeployment, revokeProcess } from "@ruoyi/module-flowable/api/finished";

const { proxy } = getCurrentInstance();

const loading = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const showSearch = ref(true);
const total = ref(0);
const finishedList = ref([]);
const title = ref("");
const open = ref(false);
const src = ref("");
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: null,
  category: null,
  key: null,
  tenantId: null,
  deployTime: null,
  derivedFrom: null,
  derivedFromRoot: null,
  parentDeploymentId: null,
  engineVersion: null
});
const form = ref({});
const rules = reactive({});

onMounted(() => {
  getList();
});

function getList() {
  loading.value = true;
  finishedListApi(queryParams).then(response => {
    finishedList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
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
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleFlowRecord(row) {
  proxy.$router.push({
    path: '/flowable/task/finished/detail/index',
    query: {
      procInsId: row.procInsId,
      deployId: row.deployId,
      taskId: row.taskId,
    }
  })
}

function handleRevoke(row) {
  const params = {
    instanceId: row.procInsId
  }
  revokeProcess(params).then(res => {
    proxy.$modal.msgSuccess(res.msg);
    getList();
  });
}

function handleDelete(row) {
  const rowIds = row.id || ids.value;
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
