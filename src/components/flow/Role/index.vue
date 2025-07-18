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
          <el-radio v-model="radioSelected" :label="scope.row.roleId">{{ '' }}</el-radio>
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

<script>
import { listRole } from "@/api/system/role";
import { StrUtil } from "@/utils/StrUtil";

export default {
  name: "FlowRole",
  // 接受父组件的值
  props: {
    // 回显数据传值
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
      // 角色表格数据
      roleList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 5,
        roleName: undefined,
        roleKey: undefined,
        status: undefined
      },
      // 表单参数
      form: {},
      radioSelected: 0, // 单选框传值
      selectRoleList: [] // 回显数据传值
    };
  },
  watch: {
    selectValues: {
      handler(newVal) {
        if (StrUtil.isNotBlank(newVal)) {
          if (newVal instanceof Number || newVal instanceof String) {
            this.radioSelected = newVal
          } else {
            this.selectRoleList = newVal;
          }
        }
      },
      immediate: true
    },
    roleList: {
      handler(newVal) {
        if (StrUtil.isNotBlank(newVal) && this.selectRoleList.length > 0) {
          this.$nextTick(() => {
            this.$refs.dataTable.clearSelection();
            if (typeof this.selectRoleList === 'string') {
              this.selectRoleList = this.selectRoleList.split(',');
            }
            this.selectRoleList?.forEach(key => {
              this.$refs.dataTable.toggleRowSelection(newVal.find(
                item => key == item.roleId
              ), true)
            });
          });
        }
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询角色列表 */
    getList() {
      this.loading = true;
      listRole(this.queryParams).then(response => {
        this.roleList = response.rows;
        this.total = response.total;
        this.loading = false;
      }
      );
    },
    // 多选框选中数据
    handleMultipleRoleSelect(selection) {
      const idList = selection.map(item => item.roleId);
      const nameList = selection.map(item => item.roleName);
      this.$emit('handleRoleSelect', idList.join(','), nameList.join(','));
    },
    // 单选框选中数据
    handleSingleRoleSelect(selection) {
      this.radioSelected = selection.roleId;
      const roleName = selection.roleName;
      this.$emit('handleRoleSelect', this.radioSelected.toString(), roleName);
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
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
