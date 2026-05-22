<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch">
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable style="width: 240px"
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
        <el-button icon="refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-show="checkType === 'multiple'" ref="dataTable" v-loading="loading" :data="roleList"
      @selection-change="handleMultipleRoleSelect">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="角色编号" prop="roleId" />
      <el-table-column label="角色名称" prop="roleName" :show-overflow-tooltip="true" />
      <el-table-column label="权限字符" prop="roleKey" :show-overflow-tooltip="true" />
      <el-table-column label="显示顺序" prop="roleSort" />
      <el-table-column label="创建时间" align="center" prop="createTime">
        <template v-slot="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
    </el-table>
    <el-table v-show="checkType === 'single'" v-loading="loading" :data="roleList"
      @current-change="handleSingleRoleSelect">
      <el-table-column width="55" align="center">
        <template v-slot="scope">
          <!-- 可以手动的修改label的值，从而控制选择哪一项 -->
          <el-radio v-model="radioSelected" :value="scope.row.roleId">{{ '' }}</el-radio>
        </template>
      </el-table-column>
      <el-table-column label="角色编号" prop="roleId" />
      <el-table-column label="角色名称" prop="roleName" :show-overflow-tooltip="true" />
      <el-table-column label="权限字符" prop="roleKey" :show-overflow-tooltip="true" />
      <el-table-column label="显示顺序" prop="roleSort" />
      <el-table-column label="创建时间" align="center" prop="createTime">
        <template v-slot="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page-sizes="[5, 10]" layout="prev, pager, next"
      v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { listRole } from '@/api/system/role'
import { StrUtil } from '@ruoyi/core/utils/StrUtil'

defineOptions({ name: 'FlowRole' })

const props = defineProps({
  selectValues: {
    type: [Number, String, Array],
    default: null,
    required: false
  },
  checkType: {
    type: String,
    default: 'multiple',
    required: false
  },
})

const emit = defineEmits(['handleRoleSelect'])
const { proxy } = getCurrentInstance()
const dataTable = ref(null)

const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const showSearch = ref(true)
const total = ref(0)
const roleList = ref([])
const title = ref('')
const open = ref(false)
const radioSelected = ref(0)
const selectRoleList = ref([])
const queryParams = reactive({
  pageNum: 1,
  pageSize: 5,
  roleName: undefined,
  roleKey: undefined,
  status: undefined
})
const form = reactive({})

watch(() => props.selectValues, (newVal) => {
  if (StrUtil.isNotBlank(newVal)) {
    if (newVal instanceof Number || newVal instanceof String) {
      radioSelected.value = newVal
    } else {
      selectRoleList.value = newVal
    }
  }
}, { immediate: true })

watch(roleList, (newVal) => {
  if (StrUtil.isNotBlank(newVal) && selectRoleList.value.length > 0) {
    nextTick(() => {
      dataTable.value.clearSelection()
      if (typeof selectRoleList.value === 'string') {
        selectRoleList.value = selectRoleList.value.split(',')
      }
      selectRoleList.value?.forEach(key => {
        dataTable.value.toggleRowSelection(newVal.find(
          item => key == item.roleId
        ), true)
      })
    })
  }
})

onMounted(() => {
  getList()
})

/** 查询角色列表 */
function getList() {
  loading.value = true
  listRole(queryParams).then(response => {
    roleList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

// 多选框选中数据
function handleMultipleRoleSelect(selection) {
  const idList = selection.map(item => item.roleId)
  const nameList = selection.map(item => item.roleName)
  emit('handleRoleSelect', idList.join(','), nameList.join(','))
}

// 单选框选中数据
function handleSingleRoleSelect(selection) {
  radioSelected.value = selection.roleId
  const roleName = selection.roleName
  emit('handleRoleSelect', radioSelected.value.toString(), roleName)
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  handleQuery()
}
</script>
<style>
/*隐藏radio展示的label及本身自带的样式*/
/*.el-radio__label{*/
/*  display:none;*/
/*}*/
</style>
