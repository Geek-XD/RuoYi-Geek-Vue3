<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="模版名称" prop="templateName">
        <el-input v-model="queryParams.templateName" placeholder="请输入模版名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增模版</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除模版</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="templateList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="模版名称" align="center" prop="templateName" />
      <el-table-column label="模版CODE" align="center" prop="templateCode" />
      <el-table-column label="模版类型" align="center" prop="templateType">
        <template #default="scope">
          <dict-tag :options="template_type" :value="scope.row.templateType" />
        </template>
      </el-table-column>
      <el-table-column label="模版内容" align="center" prop="templateContent" />
      <el-table-column label="变量" align="center" prop="templateVariable" />
      <el-table-column label="场景说明" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改模版管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body class="dialog-container">
      <el-form ref="templateRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="模版名称" prop="templateName">
          <el-input v-model="form.templateName" placeholder="请输入模版名称" />
        </el-form-item>
        <el-form-item label="模版CODE" prop="templateCode" label-width="90px">
          <el-input v-model="form.templateCode" placeholder="请输入模版CODE" />
        </el-form-item>
        <el-form-item label="模版类型" prop="templateType">
          <el-select v-model="form.templateType" placeholder="请选择模版类型">
            <el-option v-for="dict in template_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="变量" prop="templateVariable">
          <el-select v-model="form.templateVariable" placeholder="请选择变量" multiple @change="handleVariableChange">
            <el-option v-for="item in variable" :key="item.variableId" :label="item.variableName"
              :value="item.variableName" />
          </el-select>
        </el-form-item>
        <el-form-item label="模版内容" prop="templateContent">
          <el-input v-model="form.templateContent" type="textarea" placeholder="请输入模版内容" />
        </el-form-item>
        <el-form-item label="场景说明" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入场景说明" />
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

<script setup name="Template">
import { listTemplate, getTemplate, delTemplate, addTemplate, updateTemplate } from "@/api/modelMessage/template";
import { selectVariable } from "@/api/modelMessage/variable";

const { proxy } = getCurrentInstance();
const { template_type } = proxy.useDict("template_type");
const templateList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const variable = ref([]);

const data = reactive({
  form: { templateContent: '' },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    templateName: null,
    templateType: null,
  },
  rules: {
    templateName: [{ required: true, message: '请输入模版名称', trigger: 'blur' }],
    templateCode: [{ required: true, message: '请输入模版CODE', trigger: 'blur' }],
    templateType: [{ required: true, message: '请选择模版类型', trigger: 'change' }],
    templateVariable: [{ required: true, message: '请选择变量', trigger: 'change' }],
    remark: [{ required: true, message: '请输入场景说明', trigger: 'blur' }],
    templateContent: [{ required: true, message: '请输入模版内容', trigger: 'blur' }]
  }
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
  proxy.resetForm("templateRef");
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

/** 提交按钮 */
function submitForm() {
  proxy.$refs["templateRef"].validate(valid => {
    if (valid) {
      form.value.templateVariable = form.value.templateVariable.join('/');
      if (form.value.templateId != null) {
        updateTemplate(form.value).then(response => {
          proxy.$modal.msgSuccess("编辑模版成功");
          open.value = false;
          getList();
        });
      } else {
        addTemplate(form.value).then(response => {
          proxy.$modal.msgSuccess("新增模版成功");
          open.value = false;
          getList();
        });
      }
    }
  });
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

// 当变量选项改变时触发
function handleVariableChange(value) {
  form.value.templateVariable = value;
  if (!form.value.templateContent) {
    form.value.templateContent = '';
  }
  const currentPlaceholders = form.value.templateContent.match(/\$\{\w+\}/g) || []; // 获取当前模板内容中的所有变量占位符
  const selectedVariableContents = variable.value.filter(v => value.includes(v.variableName)) // 获取选中的变量占位符
    .map(v => `\${${v.variableContent}}`);
  currentPlaceholders.forEach(placeholder => { // 移除未选中的变量占位符
    if (!selectedVariableContents.includes(placeholder)) {
      form.value.templateContent = form.value.templateContent.replace(placeholder, '').trim();
    }
  });
  // 填充模板内容
  const selectedVariable = variable.value.find(v => v.variableName === value[value.length - 1]);
  if (selectedVariable) {
    const variablePlaceholder = `\${${selectedVariable.variableContent}}`;
    if (!form.value.templateContent.includes(variablePlaceholder)) {
      form.value.templateContent += ` ${variablePlaceholder}`;
    }
  }
  form.value.templateContent = form.value.templateContent.replace(/\s+/g, ' ').trim();
}

getVariable();
getList();
</script>
<style scoped>
.el-form {
  margin-bottom: 20px;
}

.el-form-item {
  margin-bottom: 18px;
}

.dialog-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.dialog-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s;
}

.dialog-fade-enter,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>