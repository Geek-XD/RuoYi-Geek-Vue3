<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
        <el-form-item label="订单号" prop="orderNumber">
          <el-input v-model="queryParams.orderNumber" placeholder="请输入订单号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="发票抬头" prop="invoiceHeader">
          <el-input v-model="queryParams.invoiceHeader" placeholder="请输入发票抬头" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="纳税人识别号" prop="invoiceNumber">
          <el-input v-model="queryParams.invoiceNumber" placeholder="请输入纳税人识别号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="收票人手机号" prop="invoicePhone">
          <el-input v-model="queryParams.invoicePhone" placeholder="请输入收票人手机号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="收票人邮箱" prop="invoiceEmail">
          <el-input v-model="queryParams.invoiceEmail" placeholder="请输入收票人邮箱" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="发票备注" prop="invoiceRemark">
          <el-input v-model="queryParams.invoiceRemark" placeholder="请输入发票备注" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt10">
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['pay:invoice:add']">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
            v-hasPermi="['pay:invoice:edit']">修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['pay:invoice:remove']">删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" plain icon="Download" @click="handleExport"
            v-hasPermi="['pay:invoice:export']">导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="invoiceList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="发票id" align="center" prop="invoiceId" />
        <el-table-column label="订单号" align="center" prop="orderNumber" />
        <el-table-column label="发票类型" align="center" prop="invoiceType" />
        <el-table-column label="发票抬头" align="center" prop="invoiceHeader" />
        <el-table-column label="纳税人识别号" align="center" prop="invoiceNumber" />
        <el-table-column label="收票人手机号" align="center" prop="invoicePhone" />
        <el-table-column label="收票人邮箱" align="center" prop="invoiceEmail" />
        <el-table-column label="发票备注" align="center" prop="invoiceRemark" />
        <el-table-column label="创建者" align="center" prop="createBy" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新者" align="center" prop="updateBy" />
        <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
              v-hasPermi="['pay:invoice:edit']">修改</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
              v-hasPermi="['pay:invoice:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 添加或修改发票对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="invoiceRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="订单号" prop="orderNumber">
          <el-input v-model="form.orderNumber" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="发票类型" prop="invoiceType">
          <el-select v-model="form.invoiceType" multiple filterable remote reserve-keyword remote-show-suffix
            placeholder="请选择发票类型" :remote-method="remoteMethodInvoiceType" :loading="loadingInvoiceType">
            <el-option v-for="item in optionsInvoiceType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="发票抬头" prop="invoiceHeader">
          <el-input v-model="form.invoiceHeader" placeholder="请输入发票抬头" />
        </el-form-item>
        <el-form-item label="纳税人识别号" prop="invoiceNumber">
          <el-input v-model="form.invoiceNumber" placeholder="请输入纳税人识别号" />
        </el-form-item>
        <el-form-item label="收票人手机号" prop="invoicePhone">
          <el-input v-model="form.invoicePhone" placeholder="请输入收票人手机号" />
        </el-form-item>
        <el-form-item label="收票人邮箱" prop="invoiceEmail">
          <el-input v-model="form.invoiceEmail" placeholder="请输入收票人邮箱" />
        </el-form-item>
        <el-form-item label="发票备注" prop="invoiceRemark">
          <el-input v-model="form.invoiceRemark" placeholder="请输入发票备注" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

<script setup name="Invoice">
import { listInvoice, getInvoice, delInvoice, addInvoice, updateInvoice } from "@/api/pay/invoice";

const { proxy } = getCurrentInstance();

const invoiceList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderNumber: null,
    invoiceType: null,
    invoiceHeader: null,
    invoiceNumber: null,
    invoicePhone: null,
    invoiceEmail: null,
    invoiceRemark: null,
  },
  rules: {
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询发票列表 */
function getList() {
  loading.value = true;
  listInvoice(queryParams.value).then(response => {
    invoiceList.value = response.rows;
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
    invoiceId: null,
    orderNumber: null,
    invoiceType: null,
    invoiceHeader: null,
    invoiceNumber: null,
    invoicePhone: null,
    invoiceEmail: null,
    invoiceRemark: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  };
  proxy.resetForm("invoiceRef");
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
  ids.value = selection.map(item => item.invoiceId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加发票";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _invoiceId = row.invoiceId || ids.value
  getInvoice(_invoiceId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改发票";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["invoiceRef"].validate(valid => {
    if (valid) {
      if (form.value.invoiceId != null) {
        updateInvoice(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addInvoice(form.value).then(response => {
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
  const _invoiceIds = row.invoiceId || ids.value;
  proxy.$modal.confirm('是否确认删除发票编号为"' + _invoiceIds + '"的数据项？').then(function () {
    return delInvoice(_invoiceIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}



/** 导出按钮操作 */
function handleExport() {
  proxy.download('pay/invoice/export', {
    ...queryParams.value
  }, `invoice_${new Date().getTime()}.xlsx`)
}

getList();
</script>
