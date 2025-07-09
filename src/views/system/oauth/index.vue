<template>
  <div class="app-container">
    <el-card shadow="never" body-class="search-card">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="120px">
        <el-form-item label="第三方用户来源" prop="source">
          <el-input v-model="queryParams.source" placeholder="请输入第三方用户来源" clearable @keyup.enter="handleQuery" />
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
          <el-button type="primary" plain icon="Plus" @click="handleAdd"
            v-hasPermi="['system:oauth:add']">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
            v-hasPermi="['system:oauth:edit']">修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['system:oauth:remove']">删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" plain icon="Download" @click="handleExport"
            v-hasPermi="['system:oauth:export']">导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="oauthList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="主键" align="center" prop="id" />
        <el-table-column label="第三方系统的唯一ID" align="center" prop="uuid" />
        <el-table-column label="用户ID" align="center" prop="userId" />
        <el-table-column label="第三方用户来源" align="center" prop="source" />
        <el-table-column label="用户的授权令牌" align="center" prop="accessToken" />
        <el-table-column label="第三方用户的授权令牌的有效期" align="center" prop="expireIn" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
              v-hasPermi="['system:oauth:edit']">修改</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
              v-hasPermi="['system:oauth:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 添加或修改第三方认证对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="oauthRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="第三方系统的唯一ID" prop="uuid">
          <el-input v-model="form.uuid" placeholder="请输入第三方系统的唯一ID" />
        </el-form-item>
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="第三方用户来源" prop="source">
          <el-input v-model="form.source" placeholder="请输入第三方用户来源" />
        </el-form-item>
        <el-form-item label="用户的授权令牌" prop="accessToken">
          <el-input v-model="form.accessToken" placeholder="请输入用户的授权令牌" />
        </el-form-item>
        <el-form-item label="第三方用户的授权令牌的有效期" prop="expireIn">
          <el-input v-model="form.expireIn" placeholder="请输入第三方用户的授权令牌的有效期" />
        </el-form-item>
        <el-form-item label="刷新令牌，部分平台可能没有" prop="refreshToken">
          <el-input v-model="form.refreshToken" placeholder="请输入刷新令牌，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="第三方用户的 open id，部分平台可能没有" prop="openId">
          <el-input v-model="form.openId" placeholder="请输入第三方用户的 open id，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="第三方用户的 ID，部分平台可能没有" prop="uid">
          <el-input v-model="form.uid" placeholder="请输入第三方用户的 ID，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="个别平台的授权信息，部分平台可能没有" prop="accessCode">
          <el-input v-model="form.accessCode" placeholder="请输入个别平台的授权信息，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="第三方用户的 union id，部分平台可能没有" prop="unionId">
          <el-input v-model="form.unionId" placeholder="请输入第三方用户的 union id，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="第三方用户授予的权限，部分平台可能没有" prop="scope">
          <el-input v-model="form.scope" placeholder="请输入第三方用户授予的权限，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="个别平台的授权信息，部分平台可能没有" prop="tokenType">
          <el-select v-model="form.tokenType" multiple filterable remote reserve-keyword remote-show-suffix
            placeholder="请选择个别平台的授权信息，部分平台可能没有" :remote-method="remoteMethodTokenType" :loading="loadingTokenType">
            <el-option v-for="item in optionsTokenType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="id token，部分平台可能没有" prop="idToken">
          <el-input v-model="form.idToken" placeholder="请输入id token，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="小米平台用户的附带属性，部分平台可能没有" prop="macAlgorithm">
          <el-input v-model="form.macAlgorithm" placeholder="请输入小米平台用户的附带属性，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="小米平台用户的附带属性，部分平台可能没有" prop="macKey">
          <el-input v-model="form.macKey" placeholder="请输入小米平台用户的附带属性，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="用户的授权code，部分平台可能没有" prop="code">
          <el-input v-model="form.code" placeholder="请输入用户的授权code，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="Twitter平台用户的附带属性，部分平台可能没有" prop="oauthToken">
          <el-input v-model="form.oauthToken" placeholder="请输入Twitter平台用户的附带属性，部分平台可能没有" />
        </el-form-item>
        <el-form-item label="Twitter平台用户的附带属性，部分平台可能没有" prop="oauthTokenSecret">
          <el-input v-model="form.oauthTokenSecret" placeholder="请输入Twitter平台用户的附带属性，部分平台可能没有" />
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

<script setup name="Oauth">
import { listOauth, getOauth, delOauth, addOauth, updateOauth } from "@/api/system/oauth";

const { proxy } = getCurrentInstance();

const oauthList = ref([]);
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
    uuid: null,
    userId: null,
    source: null,
    accessToken: null,
    expireIn: null,
    refreshToken: null,
    openId: null,
    uid: null,
    accessCode: null,
    unionId: null,
    scope: null,
    tokenType: null,
    idToken: null,
    macAlgorithm: null,
    macKey: null,
    code: null,
    oauthToken: null,
    oauthTokenSecret: null
  },
  rules: {
    uuid: [
      { required: true, message: "第三方系统的唯一ID不能为空", trigger: "blur" }
    ],
    userId: [
      { required: true, message: "用户ID不能为空", trigger: "blur" }
    ],
    source: [
      { required: true, message: "第三方用户来源不能为空", trigger: "blur" }
    ],
    accessToken: [
      { required: true, message: "用户的授权令牌不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询第三方认证列表 */
function getList() {
  loading.value = true;
  listOauth(queryParams.value).then(response => {
    oauthList.value = response.rows;
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
    uuid: null,
    userId: null,
    source: null,
    accessToken: null,
    expireIn: null,
    refreshToken: null,
    openId: null,
    uid: null,
    accessCode: null,
    unionId: null,
    scope: null,
    tokenType: null,
    idToken: null,
    macAlgorithm: null,
    macKey: null,
    code: null,
    oauthToken: null,
    oauthTokenSecret: null
  };
  proxy.resetForm("oauthRef");
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
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加第三方认证";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getOauth(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改第三方认证";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["oauthRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateOauth(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addOauth(form.value).then(response => {
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
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除第三方认证编号为"' + _ids + '"的数据项？').then(function () {
    return delOauth(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}



/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/oauth/export', {
    ...queryParams.value
  }, `oauth_${new Date().getTime()}.xlsx`)
}

getList();
</script>
