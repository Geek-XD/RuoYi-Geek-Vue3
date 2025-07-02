<template>
  <div class="template-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="hover">
      <div class="card-header">
        <el-icon><Search /></el-icon>
        <span>搜索条件</span>
      </div>
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
        <el-form-item label="模版名称" prop="templateName">
          <el-input v-model="queryParams.templateName" placeholder="请输入模版名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="模版类型" prop="templateType">
          <el-select v-model="queryParams.templateType" placeholder="请选择模版类型" clearable style="width:180px">
            <el-option v-for="dict in template_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工具栏 -->
    <el-card class="action-card" shadow="hover">
      <div class="card-header">
        <el-icon><Operation /></el-icon>
        <span>操作面板</span>
      </div>
      <div class="action-bar">
        <div>
          <el-button type="primary" plain icon="Plus" @click="handleAdd">新增模版</el-button>
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">批量删除</el-button>
          <el-button type="success" plain icon="Download" @click="handleExport">导出数据</el-button>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="hover">
      <div class="card-header">
        <el-icon><List /></el-icon>
        <span>模版列表</span>
      </div>
      <el-table v-loading="loading" :data="templateList" @selection-change="handleSelectionChange"
        highlight-current-row stripe border>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="模版名称" align="center" prop="templateName" min-width="120" show-overflow-tooltip />
        <el-table-column label="模版CODE" align="center" prop="templateCode" min-width="120" show-overflow-tooltip />
        <el-table-column label="模版类型" align="center" prop="templateType" width="120">
          <template #default="scope">
            <dict-tag :options="template_type" :value="scope.row.templateType" />
          </template>
        </el-table-column>
        <el-table-column label="模版内容" align="center" prop="templateContent" min-width="180" show-overflow-tooltip />
        <el-table-column label="变量" align="center" prop="templateVariable" min-width="120" show-overflow-tooltip />
        <el-table-column label="场景说明" align="center" prop="remark" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="215">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button link type="success" icon="View" @click="handlePreview(scope.row)">预览</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize" @pagination="getList" />
      </div>
    </el-card>

    <!-- 添加或修改模版管理对话框 -->
    <TemplateFormDialog
      :visible="open"
      :title="title"
      :formData="form"
      :variable="variable"
      @update:visible="open = $event"
      @submit="handleFormSubmit"
      @cancel="cancel"
      ref="templateFormDialogRef"
    />

    <!-- 模板预览对话框 -->
    <TemplatePreviewDialog
      :visible="previewOpen"
      :previewData="previewData"
      :previewVariables="previewVariables"
      @update:visible="previewOpen = $event"
    />
  </div>
</template>

<script setup name="Template">
import { listTemplate, getTemplate, delTemplate, addTemplate, updateTemplate } from "@/api/modelMessage/template";
import { selectVariable } from "@/api/modelMessage/variable";
import { Search, Operation, List } from '@element-plus/icons-vue';
import TemplateFormDialog from './components/TemplateFormDialog.vue';
import TemplatePreviewDialog from './components/TemplatePreviewDialog.vue';

const { proxy } = getCurrentInstance();
const { template_type } = proxy.useDict("template_type");
const templateList = ref([]);
const open = ref(false);
const loading = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const variable = ref([]);
// 预览数据
const previewOpen = ref(false);
const previewData = ref({});
const previewVariables = ref([]);
// 组件引用
const templateFormDialogRef = ref(null);

const data = reactive({
  form: { templateContent: '' },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    templateName: null,
    templateType: null,
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

/** 查询模版管理列表 */
function getList() {
  loading.value = true;
  listTemplate(queryParams.value).then(response => {
    templateList.value = response.rows;
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
    templateId: null, templateName: null, templateCode: null, templateType: null, templateContent: '',
    templateVariable: [], createBy: null, createTime: null, updateBy: null, updateTime: null, remark: null
  };
  if (templateFormDialogRef.value) {
    templateFormDialogRef.value.resetForm();
  }
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
  ids.value = selection.map(item => item.templateId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  getVariable();
  open.value = true;
  title.value = "添加模版";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  getVariable();
  const _templateId = row.templateId || ids.value
  getTemplate(_templateId).then(response => {
    form.value = response.data;
    form.value.templateVariable = response.data.templateVariable.split('/');
    open.value = true;
    title.value = "编辑模版";
  });
}

/** 预览模板 */
function handlePreview(row) {
  previewData.value = { ...row };
  previewVariables.value = row.templateVariable ? row.templateVariable.split('/') : [];
  previewOpen.value = true;
}

/** 获取模板类型文字 */
function getTemplatTypeText(type) {
  const found = template_type.value.find(item => item.value === type);
  return found ? found.label : '未知类型';
}

/** 处理表单提交 */
function handleFormSubmit(formData) {
  const submitData = { ...formData };
  submitData.templateVariable = submitData.templateVariable.join('/');

  if (submitData.templateId != null) {
    updateTemplate(submitData).then(response => {
      proxy.$modal.msgSuccess("编辑模版成功");
      open.value = false;
      getList();
    });
  } else {
    addTemplate(submitData).then(response => {
      proxy.$modal.msgSuccess("新增模版成功");
      open.value = false;
      getList();
    });
  }
}



/** 删除按钮操作 */
function handleDelete(row) {
  const _templateIds = row.templateId || ids.value;
  proxy.$modal.confirm('是否确认删除模版管理编号为"' + _templateIds + '"的数据项？').then(function () {
    return delTemplate(_templateIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('modelMessage/template/export', {
    ...queryParams.value
  }, `template_${new Date().getTime()}.xlsx`)
}

async function getVariable() {
  try {
    variable.value = (await selectVariable()).data;
  } catch (error) {
    console.error('未获取到变量信息', error);
  }
}



getVariable();
getList();
</script>

<style scoped>
.template-container { padding: 16px; min-height: 100vh; background: #f0f2f5; }

/* 卡片通用样式 */
.search-card, .action-card, .table-card { margin-bottom: 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06) !important; transition: all 0.3s; }
.search-card:hover, .action-card:hover, .table-card:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important; }

/* 卡片标题 */
.card-header { display: flex; align-items: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #ebeef5; font-size: 16px; font-weight: 500; color: #303133; }
.card-header .el-icon { margin-right: 6px; font-size: 18px; color: #409EFF; }

/* 操作栏样式 */
.action-bar { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 4px 0; }

/* 表格和分页样式 */
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }


</style>