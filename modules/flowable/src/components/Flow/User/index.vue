<template>
  <div>
    <el-row :gutter="20">
      <!--部门数据-->
      <el-col :span="6" :xs="24">
        <div class="head-container">
          <el-input v-model="deptName" placeholder="请输入部门名称" clearable prefix-icon="search"
            style="margin-bottom: 20px" />
        </div>
        <div class="head-container">
          <el-tree :data="deptOptions" :props="defaultProps" :expand-on-click-node="false"
            :filter-node-method="filterNode" ref="tree" node-key="id" default-expand-all highlight-current
            @node-click="handleNodeClick" />
        </div>
      </el-col>
      <!--用户数据-->
      <el-col :span="18" :xs="24">
        <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
          <el-form-item label="用户名称" prop="userName">
            <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable style="width: 150px"
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
            <el-button icon="refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table v-show="checkType === 'multiple'" ref="dataTable" v-loading="loading" :row-key="getRowKey"
          :data="userList" @selection-change="handleMultipleUserSelect">
          <el-table-column type="selection" :reserve-selection="true" width="50" align="center" />
          <el-table-column v-for="column in columns" :label="column.label" align="center" :key="column.key"
            :prop="column.key" v-show="column.visible" show-overflow-tooltip />
        </el-table>
        <el-table v-show="checkType === 'single'" v-loading="loading" :data="userList"
          @current-change="handleSingleUserSelect">
          <el-table-column width="55" align="center">
            <template v-slot="scope">
              <el-radio v-model="radioSelected" :value="scope.row.userId">{{ '' }}</el-radio>
            </template>
          </el-table-column>
          <el-table-column v-for="column in columns" :label="column.label" align="center" :key="column.key"
            :prop="column.key" v-show="column.visible" show-overflow-tooltip />
        </el-table>
        <pagination v-show="total > 0" :total="total" :page-sizes="[5, 10]" layout="prev, pager, next"
          v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { listUser, deptTreeSelect } from '@/api/system/user'
import { StrUtil } from '@ruoyi/core/utils/StrUtil'

defineOptions({ name: 'FlowUser' })

const props = defineProps({
  selectValues: {
    type: [Number, String, Array],
    default: null,
    required: false
  },
  checkType: {
    type: String,
    default: 'multiple',
    required: true
  },
})

const emit = defineEmits(['handleUserSelect'])
const { proxy } = getCurrentInstance()
const tree = ref(null)
const dataTable = ref(null)

const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const showSearch = ref(true)
const total = ref(0)
const userList = ref([])
const title = ref('')
const deptOptions = ref(undefined)
const open = ref(false)
const deptName = ref(undefined)
const radioSelected = ref(0)
const selectUserList = ref([])
const defaultProps = reactive({
  children: 'children',
  label: 'label'
})
const queryParams = reactive({
  pageNum: 1,
  pageSize: 5,
  userName: undefined,
  phonenumber: undefined,
  status: undefined,
  deptId: undefined
})
const form = reactive({})
const columns = ref([
  { key: 'userId', label: `用户编号`, visible: true },
  { key: 'userName', label: `登录账号`, visible: true },
  { key: 'nickName', label: `用户昵称`, visible: true },
  { key: 'deptName', label: `部门`, visible: true },
  { key: 'phonenumber', label: `手机号码`, visible: true },
  { key: 'status', label: `状态`, visible: false },
  { key: 'createTime', label: `创建时间`, visible: false }
])

watch(deptName, (val) => {
  tree.value.filter(val)
})

watch(() => props.selectValues, (newVal) => {
  if (StrUtil.isNotBlank(newVal)) {
    if (newVal instanceof Number) {
      radioSelected.value = newVal
    } else {
      selectUserList.value = newVal
    }
  }
}, { immediate: true })

watch(userList, (newVal) => {
  if (StrUtil.isNotBlank(newVal) && selectUserList.value.length > 0) {
    nextTick(() => {
      dataTable.value.clearSelection()
      selectUserList.value?.split(',').forEach(key => {
        dataTable.value.toggleRowSelection(newVal.find(
          item => key == item.userId
        ), true)
      })
    })
  }
})

onMounted(() => {
  getList()
  getDeptTree()
})

/** 查询用户列表 */
function getList() {
  loading.value = true
  listUser(queryParams).then(response => {
    userList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 查询部门下拉树结构 */
function getDeptTree() {
  deptTreeSelect().then(response => {
    deptOptions.value = response.data
  })
}

// 保存选中的数据id,row-key就是要指定一个key标识这一行的数据
function getRowKey(row) {
  return row.id
}

// 筛选节点
function filterNode(value, data) {
  if (!value) return true
  return data.label.indexOf(value) !== -1
}

// 节点单击事件
function handleNodeClick(data) {
  queryParams.deptId = data.id
  handleQuery()
}

// 多选框选中数据
function handleMultipleUserSelect(selection) {
  emit('handleUserSelect', selection)
}

// 单选框选中数据
function handleSingleUserSelect(selection) {
  radioSelected.value = selection.userId // 点击当前行时,radio同样有选中效果
  emit('handleUserSelect', selection)
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.dateRange = []
  proxy.resetForm('queryForm')
  queryParams.deptId = undefined
  tree.value.setCurrentKey(null)
  handleQuery()
}
</script>
<style>
/*隐藏radio展示的label及本身自带的样式*/
/*.el-radio__label{*/
/*  display:none;*/
/*}*/
</style>
