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
              <el-radio v-model="radioSelected" :label="scope.row.userId">{{ '' }}</el-radio>
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

<script>
import { listUser, deptTreeSelect } from "@/api/system/user";
import { StrUtil } from '@/utils/StrUtil'

export default {
  name: "FlowUser",
  // 接受父组件的值
  props: {
    // 回显数据传值
    selectValues: {
      type: [Number, String, Array],
      default: null,
      required: false
    },
    // 表格类型
    checkType: {
      type: String,
      default: 'multiple',
      required: true
    },
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
      // 用户表格数据
      userList: [],
      // 弹出层标题
      title: "",
      // 部门树选项
      deptOptions: undefined,
      // 是否显示弹出层
      open: false,
      // 部门名称
      deptName: undefined,
      // 表单参数
      form: {},
      defaultProps: {
        children: "children",
        label: "label"
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 5,
        userName: undefined,
        phonenumber: undefined,
        status: undefined,
        deptId: undefined
      },
      // 列信息
      columns: [
        { key: 'userId', label: `用户编号`, visible: true },
        { key: 'userName', label: `登录账号`, visible: true },
        { key: 'nickName', label: `用户昵称`, visible: true },
        { key: 'deptName', label: `部门`, visible: true },
        { key: 'phonenumber', label: `手机号码`, visible: true },
        { key: 'status', label: `状态`, visible: false },
        { key: 'createTime', label: `创建时间`, visible: false }
      ],
      radioSelected: 0, // 单选框传值
      selectUserList: [] // 回显数据传值
    };
  },
  watch: {
    // 根据名称筛选部门树
    deptName(val) {
      this.$refs.tree.filter(val);
    },
    selectValues: {
      handler(newVal) {
        if (StrUtil.isNotBlank(newVal)) {
          if (newVal instanceof Number) {
            this.radioSelected = newVal
          } else {
            this.selectUserList = newVal;
          }
        }
      },
      immediate: true
    },
    userList: {
      handler(newVal) {
        if (StrUtil.isNotBlank(newVal) && this.selectUserList.length > 0) {
          this.$nextTick(() => {
            this.$refs.dataTable.clearSelection();
            this.selectUserList?.split(',').forEach(key => {
              this.$refs.dataTable.toggleRowSelection(newVal.find(
                item => key == item.userId
              ), true)
            });
          });
        }
      }
    }
  },
  created() {
    this.getList();
    this.getDeptTree();
  },
  methods: {
    /** 查询用户列表 */
    getList() {
      this.loading = true;
      listUser(this.queryParams).then(response => {
        this.userList = response.rows;
        this.total = response.total;
        this.loading = false;
      }
      );
    },
    /** 查询部门下拉树结构 */
    getDeptTree() {
      deptTreeSelect().then(response => {
        this.deptOptions = response.data;
      });
    },
    // 保存选中的数据id,row-key就是要指定一个key标识这一行的数据
    getRowKey(row) {
      return row.id
    },
    // 筛选节点
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    // 节点单击事件
    handleNodeClick(data) {
      this.queryParams.deptId = data.id;
      this.handleQuery();
    },
    // 多选框选中数据
    handleMultipleUserSelect(selection) {
      this.$emit('handleUserSelect', selection);
    },
    // 单选框选中数据
    handleSingleUserSelect(selection) {
      this.radioSelected = selection.userId;//点击当前行时,radio同样有选中效果
      this.$emit('handleUserSelect', selection);
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.queryParams.deptId = undefined;
      this.$refs.tree.setCurrentKey(null);
      this.handleQuery();
    },
  }
};
</script>
<style>
/*隐藏radio展示的label及本身自带的样式*/
/*.el-radio__label{*/
/*  display:none;*/
/*}*/
</style>
