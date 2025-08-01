<template>
  <div class="app-container">
    <el-card shadow="never" body-class="search-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="开始时间" prop="deployTime">
          <el-date-picker clearable v-model="queryParams.deployTime" type="date" value-format="yyyy-MM-dd"
            placeholder="选择时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt10">
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="upload" @click="handleImport">导入</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="plus" @click="handleLoadXml">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="delete" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['system:deployment:remove']">删除</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>
      <el-alert title="流程表达式注意项" type="success">
        <div>1、XML文件中的流程定义id属性用作流程定义的key参数。</div>
        <div>2、XML文件中的流程定义name属性用作流程定义的name参数。如果未给定name属性，会使用id作为name。</div>
        <div>3、当每个唯一key的流程第一次部署时，指定版本为1。对其后所有使用相同key的流程定义，部署时版本会在该key当前已部署的最高版本号基础上加1。key参数用于区分流程定义。</div>
        <div>
          4、id参数设置为{processDefinitionKey}:{processDefinitionVersion}:{generated-id}，其中generated-id是一个唯一数字，用以保证在集群环境下，流程定义缓存中，流程id的唯一性。
        </div>
      </el-alert>
      <el-table v-loading="loading" fit :data="definitionList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="流程编号" align="center" prop="deploymentId" :show-overflow-tooltip="true" />
        <el-table-column label="流程标识" align="center" prop="flowKey" :show-overflow-tooltip="true" />
        <el-table-column label="流程分类" align="center" prop="category" />
        <el-table-column label="流程名称" align="center" width="120" :show-overflow-tooltip="true">
          <template v-slot="scope">
            <el-button link type="primary" @click="handleReadImage(scope.row.deploymentId)">
              <span>{{ scope.row.name }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="业务表单" align="center" :show-overflow-tooltip="true">
          <template v-slot="scope">
            <el-button link v-if="scope.row.formId" type="primary" @click="handleForm(scope.row.formId)">
              <span>{{ scope.row.formName }}</span>
            </el-button>
            <label v-else>暂无表单</label>
          </template>
        </el-table-column>
        <el-table-column label="流程版本" align="center">
          <template v-slot="scope">
            <el-tag size="default">v{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="150">
          <template v-slot="scope">
            <el-tag type="success" v-if="scope.row.suspensionState === 1">激活</el-tag>
            <el-tag type="warning" v-if="scope.row.suspensionState === 2">挂起</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="部署时间" align="center" prop="deploymentTime" width="180" />
        <el-table-column label="操作" align="center" width="350" fixed="right" class-name="small-padding fixed-width">
          <template v-slot="scope">
            <el-button link @click="handleLoadXml(scope.row)" icon="edit" type="primary">设计</el-button>
            <el-button link @click="handleAddForm(scope.row)" icon="promotion" type="primary">配置主表单</el-button>
            <el-button link @click="handleUpdateSuspensionState(scope.row)" icon="video-pause" type="warning"
              v-if="scope.row.suspensionState === 1">挂起</el-button>
            <el-button link @click="handleUpdateSuspensionState(scope.row)" icon="video-play" type="success"
              v-if="scope.row.suspensionState === 2">激活</el-button>
            <el-button link @click="handleDelete(scope.row)" icon="delete" type="danger"
              v-hasPermi="['system:deployment:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- bpmn20.xml导入对话框 -->
    <el-dialog :title="upload.title" v-model="upload.open" width="400px" append-to-body>
      <el-upload ref="upload" :limit="1" accept=".xml" :headers="upload.headers"
        :action="upload.url + '?name=' + upload.name + '&category=' + upload.category" :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress" :on-success="handleFileSuccess" :auto-upload="false" drag>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          将文件拖到此处，或
          <em>点击上传</em>
        </div>
        <template #tip>
          流程名称：<el-input v-model="upload.name" />
          流程分类：
          <div>
            <!-- <el-input v-model="upload.category" /> -->
            <el-select v-model="upload.category" placeholder="请选择流程分类">
              <el-option v-for="dict in sys_process_category" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </div>
          <span style="color:red">
            提示：仅允许导入“bpmn20.xml”格式文件！
          </span>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
          <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 流程图 -->
    <el-dialog :title="readImage.title" v-model="readImage.open" width="70%" append-to-body>
      <!-- <el-image :src="readImage.src"></el-image> -->
      <bpmn-viewer :flowData="flowData" />
    </el-dialog>

    <!--表单配置详情-->
    <el-dialog :title="formTitle" v-model="formConfOpen" width="50%" append-to-body>
      <div class="test-form">
        <v-form-render :form-data="formData" ref="vFormRef" />
      </div>
    </el-dialog>

    <!--挂载表单-->
    <el-dialog :title="formDeployTitle" v-model="formDeployOpen" width="60%" append-to-body>
      <el-row :gutter="24">
        <el-col :span="10" :xs="24">
          <el-table ref="singleTable" :data="formList" border highlight-current-row
            @current-change="handleCurrentChange" style="width: 100%" height="400px">
            <el-table-column label="表单编号" align="center" prop="formId" />
            <el-table-column label="表单名称" align="center" prop="formName" />
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
              <template v-slot="scope">
                <el-button link type="primary" @click="submitFormDeploy(scope.row)">确定</el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination small layout="prev, pager, next" v-show="formTotal > 0" :total="formTotal"
            v-model:page="formQueryParams.pageNum" v-model:limit="formQueryParams.pageSize"
            @pagination="ListFormDeploy" />
        </el-col>
        <el-col :span="14" :xs="24">
          <el-card header="表单预览">
            <div class="test-form">
              <v-form-render :form-data="formData" ref="vFormCurrentRowRef" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-dialog>

    <!--    &lt;!&ndash;流程设计器&ndash;&gt;-->
    <!-- <el-dialog title="流程配置" v-model="dialogVisible" :close-on-press-escape="false" :fullscreen=true
      :before-close="handleClose" append-to-body>
      <Model :deployId="deployId" />
    </el-dialog> -->
  </div>
</template>

<script>
import { listDefinition, updateState, delDeployment, definitionStart, flowXmlAndNode } from "@/api/flowable/definition";
import { getToken } from "@/utils/auth";
import { getForm, addDeployForm, listForm } from "@/api/flowable/form";
import BpmnViewer from '@/components/Process/viewer';
import Model from './model';

export default {
  name: "Definition",
  setup() {
    const { proxy } = getCurrentInstance();
    const { sys_process_category } = proxy.useDict("sys_process_category");
    return {
      // 引入字典
      sys_process_category,
    };
  },
  components: {
    BpmnViewer,
    Model
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      dialogVisible: false,
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
      // 流程定义表格数据
      definitionList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      formConfOpen: false,
      formTitle: "",
      formDeployOpen: false,
      formDeployTitle: "",
      formList: [],
      formTotal: 0,
      formData: {}, // 默认表单数据
      readImage: {
        open: false,
        src: "",
      },
      // bpmn.xml 导入
      upload: {
        // 是否显示弹出层（xml导入）
        open: false,
        // 弹出层标题（xml导入）
        title: "",
        // 是否禁用上传
        isUploading: false,
        name: null,
        category: null,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: import.meta.env.VITE_APP_BASE_API + "/flowable/definition/import"
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        category: null,
        key: null,
        tenantId: null,
        deployTime: null,
        derivedFrom: null,
        derivedFromRoot: null,
        parentDeploymentId: null,
        engineVersion: null
      },
      formQueryParams: {
        pageNum: 1,
        pageSize: 10,
      },
      // 挂载表单到流程实例
      formDeployParam: {
        formId: null,
        deployId: null
      },
      deployId: '',
      currentRow: null,
      // xml
      flowData: {},
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  activated() {
    const time = this.$route.query.t;
    if (time != null) {
      this.getList();
    }
  },
  methods: {
    /** 查询流程定义列表 */
    getList() {
      this.loading = true;
      listDefinition(this.queryParams).then(response => {
        this.definitionList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    handleClose(done) {
      this.$confirm('确定要关闭吗？关闭未保存的修改都会丢失？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        done();
      }).catch(() => { });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        name: null,
        category: null,
        key: null,
        tenantId: null,
        deployTime: null,
        derivedFrom: null,
        derivedFromRoot: null,
        parentDeploymentId: null,
        engineVersion: null
      };
      this.resetForm("form");
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
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.deploymentId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 跳转到流程设计页面 */
    handleLoadXml(row) {
      // this.dialogVisible = true;
      // this.deployId = row.deploymentId;
      this.$router.push({ path: '/flowable/definition/model', query: { deployId: row.deploymentId } })
    },
    /** 流程图查看 */
    handleReadImage(deployId) {
      this.readImage.title = "流程图";
      this.readImage.open = true;
      // this.readImage.src = import.meta.env.VITE_APP_BASE_API + "/flowable/definition/readImage/" + deploymentId;
      flowXmlAndNode({ deployId: deployId }).then(res => {
        this.flowData = res.data;
      })
    },
    /** 表单查看 */
    handleForm(formId) {
      getForm(formId).then(res => {
        this.formTitle = "表单详情";
        this.formConfOpen = true;
        this.$nextTick(() => {
          // 回显数据
          this.$refs.vFormRef.setFormJson(JSON.parse(res.data.formSchema))
          this.$nextTick(() => {
            // 表单禁用
            this.$refs.vFormRef.disableForm();
          })
        })
      })
    },
    /** 启动流程 */
    handleDefinitionStart(row) {
      definitionStart(row.id).then(res => {
        this.$modal.msgSuccess(res.msg);
      })
    },
    /** 挂载表单弹框 */
    handleAddForm(row) {
      this.formDeployParam.deployId = row.deploymentId
      this.ListFormDeploy()
    },
    /** 挂载表单列表 */
    ListFormDeploy() {
      listForm(this.formQueryParams).then(res => {
        this.formList = res.rows;
        this.formTotal = res.total;
        this.formDeployOpen = true;
        this.formDeployTitle = "挂载表单";
      })
    },
    /** 挂载表单 */
    submitFormDeploy(row) {
      this.formDeployParam.formId = row.formId;
      addDeployForm(this.formDeployParam).then(res => {
        this.$modal.msgSuccess(res.msg);
        this.formDeployOpen = false;
        this.getList();
      })
    },
    handleCurrentChange(data) {
      if (data) {
        this.$nextTick(() => {
          // 回显数据
          this.$refs.vFormCurrentRowRef.setFormJson(JSON.parse(data.formSchema))
          this.$nextTick(() => {
            // 表单禁用
            this.$refs.vFormCurrentRowRef.disableForm();
          })
        })
      }
    },
    /** 挂起/激活流程 */
    handleUpdateSuspensionState(row) {
      let state = 1;
      if (row.suspensionState === 1) {
        state = 2
      }
      const params = {
        deployId: row.deploymentId,
        state: state
      }
      updateState(params).then(res => {
        this.$modal.msgSuccess(res.msg);
        this.getList();
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const deploymentIds = row.deploymentId || this.ids;
      this.$confirm('是否确认删除流程定义编号为"' + deploymentIds + '"的数据项?', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(function () {
        return delDeployment(deploymentIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      })
    },
    /** 导入bpmn.xml文件 */
    handleImport() {
      this.upload.title = "bpmn20.xml文件导入";
      this.upload.open = true;
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true;
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.open = false;
      this.upload.isUploading = false;
      this.$refs.upload.clearFiles();
      this.$message(response.msg);
      this.getList();
    },
    // 提交上传文件
    submitFileForm() {
      this.$refs.upload.submit();
    }
  }
};
</script>