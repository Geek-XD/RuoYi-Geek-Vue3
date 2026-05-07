<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入表达式名称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
        <el-button icon="refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="expressionList" @current-change="handleSingleExpSelect">
      <el-table-column width="55" align="center">
        <template v-slot="scope">
          <!-- 可以手动的修改label的值，从而控制选择哪一项 -->
          <el-radio v-model="radioSelected" :label="scope.row.id">{{ '' }}</el-radio>
        </template>
      </el-table-column>
      <el-table-column label="名称" align="center" prop="name" />
      <el-table-column label="表达式内容" align="center" prop="expression" />
      <el-table-column label="表达式类型" align="center" prop="dataType">
        <template v-slot="scope">
          <dict-tag :options="exp_data_type" :value="scope.row.dataType" />
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page-sizes="[5, 10]" layout="prev, pager, next"
      v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup>
import { getCurrentInstance, onMounted, reactive, ref, watch } from 'vue'
import { listExpression } from '@ruoyi/module-flowable/api/expression'
import { StrUtil } from '@ruoyi/core/utils/StrUtil'

defineOptions({ name: 'Expression' })

const props = defineProps({
  selectValues: {
    type: [Number, String],
    default: null,
    required: false
  }
})

const emit = defineEmits(['handleSingleExpSelect'])
const { proxy } = getCurrentInstance()
const { exp_data_type, sys_common_status } = proxy.useDict('exp_data_type', 'sys_common_status')

const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const showSearch = ref(true)
const total = ref(0)
const expressionList = ref([])
const title = ref('')
const open = ref(false)
const radioSelected = ref(null)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: null,
  expression: null,
  status: null,
})

watch(() => props.selectValues, (newVal) => {
  if (StrUtil.isNotBlank(newVal)) {
    radioSelected.value = newVal
  }
}, { immediate: true })

onMounted(() => {
  getList()
})

/** 查询流程达式列表 */
function getList() {
  loading.value = true
  listExpression(queryParams).then(response => {
    expressionList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm('queryForm')
  handleQuery()
}

// 单选框选中数据
function handleSingleExpSelect(selection) {
  radioSelected.value = selection.id // 点击当前行时,radio同样有选中效果
  emit('handleSingleExpSelect', selection)
}
</script>

