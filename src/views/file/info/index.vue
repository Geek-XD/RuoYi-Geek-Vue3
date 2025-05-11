<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="原始文件名" prop="fileName">
        <el-input v-model="queryParams.fileName" placeholder="请输入原始文件名" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['file:info:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['file:info:export']">导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Upload" @click="openUploadDialog = true">上传</el-button>
      </el-col>
      <!-- 移除原 el-upload 默认上传按钮，统一用弹窗上传 -->
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="infoList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="文件主键" align="center" prop="fileId" />
      <el-table-column label="原始文件名" align="center" prop="fileName" />
      <el-table-column label="统一逻辑路径" align="center" prop="filePath" />
      <el-table-column label="存储类型" align="center" prop="storageType" />
      <el-table-column label="文件类型/后缀" align="center" prop="fileType" />
      <el-table-column label="文件大小" align="center" prop="fileSize" />
      <el-table-column label="文件MD5" align="center" prop="md5" />
      <el-table-column label="预览" align="center">
        <template #default="scope">
          <template v-if="isImage(scope.row.fileType)">
            <ImagePreview :src="getFileUrl(scope.row)" width="60" height="60" />
          </template>
          <template v-else>
            <el-link :underline="false" type="primary" @click="handleDownload(scope.row)">
              {{ scope.row.fileName }}
            </el-link>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
            v-hasPermi="['file:info:remove']">删除</el-button>
          <el-button link type="primary" icon="Download" @click="handleDownload(scope.row)">下载</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="openUploadDialog" title="上传文件" width="500px" append-to-body>
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="上传类型">
          <el-radio-group v-model="uploadForm.uploadType">
            <el-radio label="image">图片</el-radio>
            <el-radio label="file">文件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="存储Client">
          <el-select v-model="uploadForm.clientKey" placeholder="请选择Client" style="width: 200px">
            <el-option v-for="item in clientList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="uploadForm.uploadType === 'image'" label="图片上传">
          <ImageUpload :limit="5" :fileSize="10" :isShowTip="true" :uploadImgUrl="uploadUrl"
            @update:modelValue="onUploadSuccess" style="width:100%"
            :fileType="['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']" />
        </el-form-item>
        <el-form-item v-else label="文件上传">
          <FileUpload :limit="5" :fileSize="10" :isShowTip="true" :uploadFileUrl="uploadUrl"
            @update:modelValue="onUploadSuccess" style="width:100%"
            :fileType="['doc', 'xls', 'ppt', 'txt', 'pdf', 'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']" />
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup name="Info">
import { listInfo, delInfo, uploadFileUnified, downloadFileUnified, getClientList } from '@/api/file/info';
import ImagePreview from "@/components/ImagePreview/index.vue";
import ImageUpload from '@/components/ImageUpload/index.vue';
import FileUpload from '@/components/FileUpload/index.vue';
import { onMounted } from 'vue';

const { proxy } = getCurrentInstance();

const infoList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    fileName: null,
    filePath: null,
    storageType: null,
    fileType: null,
    fileSize: null,
    md5: null,
  }
});

const { queryParams } = toRefs(data);

/** 查询文件信息列表 */
function getList() {
  loading.value = true;
  listInfo(queryParams.value).then(response => {
    infoList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
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
  ids.value = selection.map(item => item.fileId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}


/** 删除按钮操作 */
function handleDelete(row) {
  const _fileIds = row.fileId || ids.value;
  proxy.$modal.confirm('是否确认删除文件信息编号为"' + _fileIds + '"的数据项？').then(function () {
    return delInfo(_fileIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('file/info/export', {
    ...queryParams.value
  }, `info_${new Date().getTime()}.xlsx`)
}

function isImage(fileType) {
  if (!fileType) return false;
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileType.toLowerCase());
}

// 统一图片预览URL
function getFileUrl(row) {
  if (!row.filePath) return '';
  return `${import.meta.env.VITE_APP_BASE_API}/file/${row.storageType}/${getClientNameFromRow(row)}/preview?filePath=${encodeURIComponent(row.filePath)}`;
}

// 从 row 获取 clientName（如有扩展可自定义）
function getClientNameFromRow(row) {
  // 你可以根据实际表结构扩展此方法
  // 例如 row 里有 clientName 字段就直接返回
  // 这里只做演示，假设 local 只用 MASTER，minio 只用 MASTER
  if (row.storageType === 'minio') return 'MASTER';
  if (row.storageType === 'local') return 'MASTER';
  return 'MASTER';
}

const openUploadDialog = ref(false);
// 上传弹窗相关逻辑
const uploadForm = reactive({
  clientKey: '', // 形如 'minio:MASTER'
  uploadType: 'image', // 新增上传类型，默认图片
});
const clientOptions = ref({});
const clientList = computed(() =>
  Object.entries(clientOptions.value).flatMap(([type, arr]) =>
    arr.map(client => ({
      type,
      client,
      value: `${type}:${client}`,
      label: `${type} - ${client}`
    }))
  )
);
// 兼容ImageUpload和FileUpload的上传url属性
const uploadUrl = computed(() => {
  if (!uploadForm.clientKey) return '';
  const [storageType, clientName] = uploadForm.clientKey.split(":");
  return `${import.meta.env.VITE_APP_BASE_API}/file/${storageType}/${clientName}/upload`;
});
// FileUpload上传成功回调
function onUploadSuccess() {
  openUploadDialog.value = false;
  getList();
}
onMounted(() => {
  getClientList().then(res => {
    if (res.code === 200 && res.data) {
      clientOptions.value = res.data;
      const allClients = Object.entries(res.data).flatMap(([type, arr]) =>
        arr.map(client => `${type}:${client}`)
      );
      if (allClients.length > 0) {
        uploadForm.clientKey = allClients[0];
      }
    }
  });
});

// 统一下载方法
function handleDownload(row) {
  downloadFileUnified({
    storageType: row.storageType,
    clientName: getClientNameFromRow(row),
    filePath: row.filePath
  }).then(res => {
    if (!res) return;
    const blob = new Blob([res], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = row.fileName || 'download';
    link.click();
    window.URL.revokeObjectURL(link.href);
  });
}
getList();
</script>
