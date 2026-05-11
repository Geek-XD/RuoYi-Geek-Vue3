<template>
  <div class="app-container">
    <el-card shadow="never" body-class="search-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="开始时间" prop="deployTime">
          <el-date-picker clearable v-model="queryParams.deployTime" type="date" value-format="yyyy-MM-dd"
            placeholder="选择时间" />
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
            v-hasPermi="['system:deployment:add']">新增流程</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="delete" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['system:deployment:remove']">删除</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="myProcessList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="流程编号" align="center" prop="procInsId" :show-overflow-tooltip="true" />
        <el-table-column label="流程名称" align="center" prop="procDefName" :show-overflow-tooltip="true" />
        <el-table-column label="流程类别" align="center" prop="category" width="100px" />
        <el-table-column label="流程版本" align="center" width="80px">
          <template v-slot="scope">
            <el-tag size="default">v{{ scope.row.procDefVersion }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" align="center" prop="createTime" width="180" />
        <el-table-column label="流程状态" align="center" width="100">
          <template v-slot="scope">
            <el-tag v-if="scope.row.finishTime == null">进行中</el-tag>
            <el-tag type="success" v-if="scope.row.finishTime != null">已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" align="center" prop="duration" width="180" />
        <el-table-column label="当前节点" align="center" prop="taskName" />
        <el-table-column label="办理人" align="center">
          <template v-slot="scope">
            <label v-if="scope.row.assigneeName">
              <span>{{ scope.row.assigneeName }}</span>
              <el-tag type="info">{{ scope.row.assigneeDeptName }}</el-tag>
            </label>
            <!-- <label v-if="scope.row.candidate">{{ scope.row.candidate }}</label> -->
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right" class-name="small-padding fixed-width">
          <template v-slot="scope">
            <el-button @click="handleFlowRecord(scope.row)" type="primary" link>详情</el-button>
            <el-button @click="handleStop(scope.row)" type="primary" link>取消申请</el-button>
            <el-button @click="handleDelete(scope.row)" type="primary" link
              v-hasPermi="['system:deployment:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 发起流程 -->
    <el-dialog :title="title" v-model="open" width="60%" append-to-body>
      <el-form :model="queryProcessParams" ref="queryProcessForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="queryProcessParams.name" placeholder="请输入名称" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="handleProcessQuery">搜索</el-button>
          <el-button icon="refresh" @click="resetProcessQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="processLoading" fit :data="definitionList" border>
        <el-table-column label="流程名称" align="center" prop="name" />
        <el-table-column label="流程版本" align="center">
          <template v-slot="scope">
            <el-tag size="default">v{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="流程分类" align="center" prop="category" />
        <el-table-column label="操作" align="center" width="300" class-name="small-padding fixed-width">
          <template v-slot="scope">
            <el-button type="primary" link icon="edit" @click="handleStartProcess(scope.row)">发起流程</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="processTotal > 0" :total="processTotal" v-model:page="queryProcessParams.pageNum"
        v-model:limit="queryProcessParams.pageSize" @pagination="listDefinition" />
    </el-dialog>

  </div>
</template>

<script setup>
import { getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { delDeployment } from "@ruoyi/module-flowable/api/finished";
import { myProcessList as myProcessListApi, stopProcess } from "@ruoyi/module-flowable/api/process";
import { listDefinition } from "@ruoyi/module-flowable/api/definition";

const { proxy } = getCurrentInstance();

const loading = ref(true);
const processLoading = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const showSearch = ref(true);
const total = ref(0);
const processTotal = ref(0);
const myProcessList = ref([]);
const title = ref("");
const open = ref(false);
const src = ref("");
const definitionList = ref([]);
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
const queryProcessParams = reactive({
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
  myProcessListApi(queryParams).then(response => {
    myProcessList.value = response.rows;
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

function handleProcessQuery() {
  queryProcessParams.pageNum = 1;
  listDefinitionData();
}

function resetProcessQuery() {
  proxy.resetForm("queryProcessForm");
  handleProcessQuery();
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.procInsId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  open.value = true;
  title.value = "发起流程";
  listDefinitionData();
}

function listDefinitionData() {
  listDefinition(queryProcessParams).then(response => {
    definitionList.value = response.rows;
    processTotal.value = response.total;
    processLoading.value = false;
  });
}

function handleStartProcess(row) {
  proxy.$router.push({
    path: '/flowable/task/myProcess/send/index',
    query: {
      deployId: row.deploymentId,
      procDefId: row.id
    }
  })
}

function handleStop(row) {
  const params = { instanceId: row.procInsId }
  stopProcess(params).then(res => {
    proxy.$modal.msgSuccess(res.msg);
    getList();
  });
}

function handleFlowRecord(row) {
  proxy.$router.push({
    path: '/flowable/task/myProcess/detail/index',
    query: {
      procInsId: row.procInsId,
      deployId: row.deployId,
      taskId: row.taskId
    }
  })
}

function handleDelete(row) {
  const rowIds = row.procInsId || ids.value;
  proxy.$confirm('是否确认删除流程定义编号为"' + rowIds + '"的数据项?', "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    return delDeployment(rowIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  })
}
</script>
