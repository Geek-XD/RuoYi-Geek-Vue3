<template>
  <div class="app-container">
    <el-card shadow="never" body-class="search-card">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
        <el-form-item label="页面编码" prop="pageCode">
          <el-input v-model="queryParams.pageCode" placeholder="请输入页面编码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="数据表ID" prop="tableId">
          <el-input v-model="queryParams.tableId" placeholder="请输入数据表ID" clearable @keyup.enter="handleQuery" />
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
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['online:page:remove']">删除</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="pageList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="页面ID" align="center" prop="pageId" width="90" />
        <el-table-column label="页面编码" align="center" prop="pageCode" min-width="180" />
        <el-table-column label="页面名称" align="center" prop="pageName" min-width="160" />
        <el-table-column label="路由路径" align="center" prop="routePath" min-width="220" />
        <el-table-column label="数据表名" align="center" prop="tableName" min-width="140" />
        <el-table-column label="权限前缀" align="center" prop="permissionPrefix" min-width="160" />
        <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleOpen(scope.row)">打开页面</el-button>
            <el-button link type="primary" icon="Document" @click="handleView(scope.row)"
              v-hasPermi="['online:page:query']">查看</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
              v-hasPermi="['online:page:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog title="在线页面详情" v-model="open" width="720px" append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="页面ID">{{ currentPage?.pageId }}</el-descriptions-item>
        <el-descriptions-item label="页面编码">{{ currentPage?.pageCode }}</el-descriptions-item>
        <el-descriptions-item label="页面名称">{{ currentPage?.pageName }}</el-descriptions-item>
        <el-descriptions-item label="路由路径">{{ currentPage?.routePath }}</el-descriptions-item>
        <el-descriptions-item label="数据表名">{{ currentPage?.tableName }}</el-descriptions-item>
        <el-descriptions-item label="权限前缀">{{ currentPage?.permissionPrefix }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="open = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OnlinePageAdmin">
import { listOnlinePage, getOnlinePage, delOnlinePage } from '@ruoyi/module-online/api/page-admin'
import { useRouter } from 'vue-router'

const router = useRouter()
const { proxy } = getCurrentInstance()

const pageList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const open = ref(false)
const currentPage = ref(null)

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    pageCode: undefined,
    tableId: undefined
  }
})

const { queryParams } = toRefs(data)

function getList() {
  loading.value = true
  listOnlinePage(queryParams.value).then(response => {
    pageList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.pageId)
  multiple.value = !selection.length
}

function handleOpen(row) {
  router.push(row.routePath)
}

function handleView(row) {
  getOnlinePage(row.pageId).then(response => {
    currentPage.value = response.data
    open.value = true
  })
}

function handleDelete(row) {
  const pageIds = row.pageId || ids.value
  proxy.$modal.confirm('是否确认删除在线页面编号为"' + pageIds + '"的数据项？').then(function () {
    return delOnlinePage(pageIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => { })
}

getList()
</script>
