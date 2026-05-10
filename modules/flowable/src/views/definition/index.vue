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
          <el-button type="primary" plain icon="upload" @click="handleImport">导入</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="plus" @click="handleLoadXml">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="delete" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['system:deployment:remove']">删除</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>
      <el-alert title="流程表达式注意项" type="success">
        <div>1、XML文件中的流程定义id属性用作流程定义的key参数。</div>
        <div>2、XML文件中的流程定义name属性用作流程定义的name参数。如果未给定name属性，会使用id作为name。</div>
        <div>3、当每个唯一key的流程第一次部署时，指定版本为1。对其后所有使用相同key的流程定义，部署时版本会在该key当前已部署的最高版本号基础上加1。key参数用于区分流程定义。</div>
        <div>
          4、id参数设置为{processDefinitionKey}:{processDefinitionVersion}:{generated-id}，其中generated-id是一个唯一数字，用以保证在集群环境下，流程定义缓存中，流程id的唯一性。
        </div>
      </el-alert>
      <el-table v-loading="loading" fit :data="definitionList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="流程编号" align="center" prop="deploymentId" :show-overflow-tooltip="true" />
        <el-table-column label="流程标识" align="center" prop="flowKey" :show-overflow-tooltip="true" />
        <el-table-column label="流程分类" align="center" prop="category" />
        <el-table-column label="流程名称" align="center" width="120" :show-overflow-tooltip="true">
          <template v-slot="scope">
            <el-button link type="primary" @click="handleReadImage(scope.row.deploymentId)">
              <span>{{ scope.row.name }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="业务表单" align="center" :show-overflow-tooltip="true">
          <template v-slot="scope">
            <el-button link v-if="scope.row.formId" type="primary" @click="handleForm(scope.row.formId)">
              <span>{{ scope.row.formName }}</span>
            </el-button>
            <label v-else>暂无表单</label>
          </template>
        </el-table-column>
        <el-table-column label="流程版本" align="center">
          <template v-slot="scope">
            <el-tag size="default">v{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="150">
          <template v-slot="scope">
            <el-tag type="success" v-if="scope.row.suspensionState === 1">激活</el-tag>
            <el-tag type="warning" v-if="scope.row.suspensionState === 2">挂起</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="部署时间" align="center" prop="deploymentTime" width="180" />
        <el-table-column label="操作" align="center" width="350" fixed="right" class-name="small-padding fixed-width">
          <template v-slot="scope">
            <el-button link @click="handleLoadXml(scope.row)" icon="edit" type="primary">设计</el-button>
            <el-button link @click="handleAddForm(scope.row)" icon="promotion" type="primary">配置主表单</el-button>
            <el-button link @click="handleUpdateSuspensionState(scope.row)" icon="video-pause" type="warning"
              v-if="scope.row.suspensionState === 1">挂起</el-button>
            <el-button link @click="handleUpdateSuspensionState(scope.row)" icon="video-play" type="success"
              v-if="scope.row.suspensionState === 2">激活</el-button>
            <el-button link @click="handleDelete(scope.row)" icon="delete" type="danger"
              v-hasPermi="['system:deployment:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- bpmn20.xml导入对话框 -->
    <el-dialog :title="upload.title" v-model="upload.open" width="400px" append-to-body>
        <el-upload ref="uploadRef" :limit="1" accept=".xml" :headers="upload.headers"
        :action="upload.url + '?name=' + upload.name + '&category=' + upload.category" :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress" :on-success="handleFileSuccess" :auto-upload="false" drag>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          将文件拖到此处，或
          <em>点击上传</em>
        </div>
        <template #tip>
          流程名称：<el-input v-model="upload.name" />
          流程分类：
          <div>
            <!-- <el-input v-model="upload.category" /> -->
            <el-select v-model="upload.category" placeholder="请选择流程分类">
              <el-option v-for="dict in sys_process_category" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </div>
          <span style="color:red">
            提示：仅允许导入“bpmn20.xml”格式文件！
          </span>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
          <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 流程图 -->
    <el-dialog :title="readImage.title" v-model="readImage.open" width="70%" append-to-body>
      <!-- <el-image :src="readImage.src"></el-image> -->
      <bpmn-viewer :flowData="flowData" />
    </el-dialog>

    <!--表单配置详情-->
    <el-dialog :title="formTitle" v-model="formConfOpen" width="50%" append-to-body>
      <div class="test-form">
        <v-form-render :form-data="formData" ref="vFormRef" />
      </div>
    </el-dialog>

    <!--挂载表单-->
    <el-dialog :title="formDeployTitle" v-model="formDeployOpen" width="60%" append-to-body>
      <el-row :gutter="24">
        <el-col :span="10" :xs="24">
          <el-table ref="singleTable" :data="formList" border highlight-current-row
            @current-change="handleCurrentChange" style="width: 100%" height="400px">
            <el-table-column label="表单编号" align="center" prop="formId" />
            <el-table-column label="表单名称" align="center" prop="formName" />
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
              <template v-slot="scope">
                <el-button link type="primary" @click="submitFormDeploy(scope.row)">确定</el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination small layout="prev, pager, next" v-show="formTotal > 0" :total="formTotal"
            v-model:page="formQueryParams.pageNum" v-model:limit="formQueryParams.pageSize"
            @pagination="ListFormDeploy" />
        </el-col>
        <el-col :span="14" :xs="24">
          <el-card header="表单预览">
            <div class="test-form">
              <v-form-render :form-data="formData" ref="vFormCurrentRowRef" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>

    <!--    &lt;!&ndash;流程设计器&ndash;&gt;-->
    <!-- <el-dialog title="流程配置" v-model="dialogVisible" :close-on-press-escape="false" :fullscreen=true
      :before-close="handleClose" append-to-body>
      <Model :deployId="deployId" />
    </el-dialog> -->
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, onActivated, onMounted, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { listDefinition, updateState, delDeployment, definitionStart, flowXmlAndNode } from "@ruoyi/module-flowable/api/definition";
import { getToken } from "@ruoyi/core/utils/auth";
import { getForm, addDeployForm, listForm } from "@ruoyi/module-flowable/api/form";
import BpmnViewer from '@ruoyi/module-flowable/components/Process/viewer';
import Model from './model';

const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();
const { sys_process_category } = proxy.useDict("sys_process_category");

const loading = ref(true);
const dialogVisible = ref(false);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const showSearch = ref(true);
const total = ref(0);
const definitionList = ref([]);
const title = ref("");
const open = ref(false);
const formConfOpen = ref(false);
const formTitle = ref("");
const formDeployOpen = ref(false);
const formDeployTitle = ref("");
const formList = ref([]);
const formTotal = ref(0);
const formData = ref({});
const readImage = reactive({
  open: false,
  src: "",
});
const uploadRef = ref();
const upload = reactive({
  open: false,
  title: "",
  isUploading: false,
  name: null,
  category: null,
  headers: { Authorization: "Bearer " + getToken() },
  url: import.meta.env.VITE_APP_BASE_API + "/flowable/definition/import"
});
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
const formQueryParams = reactive({
  pageNum: 1,
  pageSize: 10,
});
const formDeployParam = reactive({
  formId: null,
  deployId: null
});
const deployId = ref('');
const currentRow = ref(null);
const flowData = ref({});
const form = ref({});
const rules = reactive({});
const vFormRef = ref();
const vFormCurrentRowRef = ref();

onMounted(() => {
  getList();
});

onActivated(() => {
  const time = route.query.t;
  if (time != null) {
    getList();
  }
});

/** 查询流程定义列表 */
function getList() {
  loading.value = true;
  listDefinition(queryParams).then(response => {
    definitionList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function handleClose(done) {
  proxy.$confirm('确定要关闭吗？关闭未保存的修改都会丢失？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    done();
  }).catch(() => { });
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
  ids.value = selection.map(item => item.deploymentId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

/** 跳转到流程设计页面 */
function handleLoadXml(row) {
  router.push({ path: '/flowable/definition/model', query: { deployId: row.deploymentId } })
}

/** 流程图查看 */
function handleReadImage(rowDeployId) {
  readImage.open = true;
  flowXmlAndNode({ deployId: rowDeployId }).then(res => {
    flowData.value = res.data;
  })
}

/** 表单查看 */
function handleForm(formId) {
  getForm(formId).then(res => {
    formTitle.value = "表单详情";
    formConfOpen.value = true;
    proxy.$nextTick(() => {
      vFormRef.value.setFormJson(JSON.parse(res.data.formSchema))
      proxy.$nextTick(() => {
        vFormRef.value.disableForm();
      })
    })
  })
}

/** 启动流程 */
function handleDefinitionStart(row) {
  definitionStart(row.id).then(res => {
    proxy.$modal.msgSuccess(res.msg);
  })
}

/** 挂载表单弹框 */
function handleAddForm(row) {
  formDeployParam.deployId = row.deploymentId
  ListFormDeploy()
}

/** 挂载表单列表 */
function ListFormDeploy() {
  listForm(formQueryParams).then(res => {
    formList.value = res.rows;
    formTotal.value = res.total;
    formDeployOpen.value = true;
    formDeployTitle.value = "挂载表单";
  })
}

/** 挂载表单 */
function submitFormDeploy(row) {
  formDeployParam.formId = row.formId;
  addDeployForm(formDeployParam).then(res => {
    proxy.$modal.msgSuccess(res.msg);
    formDeployOpen.value = false;
    getList();
  })
}

function handleCurrentChange(data) {
  if (data) {
    proxy.$nextTick(() => {
      vFormCurrentRowRef.value.setFormJson(JSON.parse(data.formSchema))
      proxy.$nextTick(() => {
        vFormCurrentRowRef.value.disableForm();
      })
    })
  }
}

/** 挂起/激活流程 */
function handleUpdateSuspensionState(row) {
  let state = 1;
  if (row.suspensionState === 1) {
    state = 2
  }
  const params = {
    deployId: row.deploymentId,
    state: state
  }
  updateState(params).then(res => {
    proxy.$modal.msgSuccess(res.msg);
    getList();
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const deploymentIds = row.deploymentId || ids.value;
  proxy.$confirm('是否确认删除流程定义编号为"' + deploymentIds + '"的数据项?', "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(function () {
    return delDeployment(deploymentIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  })
}

/** 导入bpmn.xml文件 */
function handleImport() {
  upload.title = "bpmn20.xml文件导入";
  upload.open = true;
}

function handleFileUploadProgress() {
  upload.isUploading = true;
}

function handleFileSuccess(response) {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value.clearFiles();
  proxy.$message(response.msg);
  getList();
}

function submitFileForm() {
  uploadRef.value.submit();
}
</script>
