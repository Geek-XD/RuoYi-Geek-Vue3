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

<script>
import { listExpression } from "@/api/flowable/expression";
import { StrUtil } from "@/utils/StrUtil";

export default {
  name: "Expression",
  setup() {
    const { proxy } = getCurrentInstance();
    const { exp_data_type, sys_common_status } = proxy.useDict("exp_data_type", "sys_common_status");
    return {
      // 引入字典
      exp_data_type,
      sys_common_status,
    };
  },
  // 接受父组件的值
  props: {
    // 回显数据传值
    selectValues: {
      type: [Number, String],
      default: null,
      required: false
    }
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 流程达式表格数据
      expressionList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        expression: null,
        status: null,
      },
      radioSelected: null // 单选框传值
    };
  },
  watch: {
    selectValues: {
      handler(newVal) {
        if (StrUtil.isNotBlank(newVal)) {
          this.radioSelected = newVal
        }
      },
      immediate: true,
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询流程达式列表 */
    getList() {
      this.loading = true;
      listExpression(this.queryParams).then(response => {
        this.expressionList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 单选框选中数据
    handleSingleExpSelect(selection) {
      this.radioSelected = selection.id;//点击当前行时,radio同样有选中效果
      this.$emit('handleSingleExpSelect', selection);
    },
  }
};
</script>
