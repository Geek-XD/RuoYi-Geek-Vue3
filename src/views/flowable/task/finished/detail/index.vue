<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header class="clearfix">
        <span class="el-icon-document">已办任务</span>
        <el-button style="float: right;" size="small" type="danger" @click="goBack">关闭</el-button>
      </template>
      <el-tabs tab-position="top" v-model="activeName" @tab-click="handleClick">
        <!--表单信息-->
        <el-tab-pane label="表单信息" name="1">
          <el-col :span="16" :offset="4">
            <v-form-render ref="vFormRef" />
          </el-col>
        </el-tab-pane>
        <!--流程流转记录-->
        <el-tab-pane label="流转记录" name="2">
          <el-col :span="16" :offset="4">
            <div class="block">
              <el-timeline>
                <el-timeline-item v-for="(item, index) in flowRecordList" :key="index" :icon="setIcon(item.finishTime)"
                  :color="setColor(item.finishTime)">
                  <p style="font-weight: 700">{{ item.taskName }}</p>
                  <el-card :body-style="{ padding: '10px' }">
                    <el-descriptions class="margin-top" :column="1" size="small" border>
                      <el-descriptions-item v-if="item.assigneeName" label-class-name="my-label">
                        <template #label><i class="el-icon-user"></i>办理人</template>
                        {{ item.assigneeName }}
                        <el-tag type="info" size="small">{{ item.deptName }}</el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item v-if="item.candidate" label-class-name="my-label">
                        <template #label><i class="el-icon-user"></i>候选办理</template>
                        {{ item.candidate }}
                      </el-descriptions-item>
                      <el-descriptions-item label-class-name="my-label">
                        <template #label><i class="el-icon-date"></i>接收时间</template>
                        {{ item.createTime }}
                      </el-descriptions-item>
                      <el-descriptions-item v-if="item.finishTime" label-class-name="my-label">
                        <template #label><i class="el-icon-date"></i>处理时间</template>
                        {{ item.finishTime }}
                      </el-descriptions-item>
                      <el-descriptions-item v-if="item.duration" label-class-name="my-label">
                        <template #label><i class="el-icon-time"></i>耗时</template>
                        {{ item.duration }}
                      </el-descriptions-item>
                      <el-descriptions-item v-if="item.comment" label-class-name="my-label">
                        <template #label><i class="el-icon-tickets"></i>处理意见</template>
                        {{ item.comment.comment }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-col>
        </el-tab-pane>
        <el-tab-pane label="流程图" name="3">
          <Bpmn-viewer :flowData="flowData" :procInsId="taskForm.procInsId" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { flowRecord } from "@/api/flowable/finished";
import { getProcessVariables, flowXmlAndNode } from "@/api/flowable/definition";
import BpmnViewer from '@/components/Process/viewer';

export default {
  name: "Record",
  components: {
    BpmnViewer,
  },
  props: {},
  data() {
    return {
      // 模型xml数据
      flowData: {},
      activeName: '1',
      // 查询参数
      queryParams: {
        deptId: undefined
      },
      // 遮罩层
      loading: true,
      flowRecordList: [], // 流程流转数据
      taskForm: {
        multiple: false,
        comment: "", // 意见内容
        procInsId: "", // 流程实例编号
        instanceId: "", // 流程实例编号
        deployId: "",  // 流程定义编号
        taskId: "",// 流程任务编号
        procDefId: "",  // 流程编号
        vars: "",
      },
    };
  },
  created() {
    this.taskForm.deployId = this.$route.query && this.$route.query.deployId;
    this.taskForm.taskId = this.$route.query && this.$route.query.taskId;
    this.taskForm.procInsId = this.$route.query && this.$route.query.procInsId;
    // 流程任务重获取变量表单
    if (this.taskForm.taskId) {
      this.processVariables(this.taskForm.taskId)
    }
    this.getFlowRecordList(this.taskForm.procInsId, this.taskForm.deployId);
  },
  methods: {
    handleClick(tab, event) {
      if (tab.index === '2') {
        flowXmlAndNode({ procInsId: this.taskForm.procInsId, deployId: this.taskForm.deployId }).then(res => {
          this.flowData = res.data;
        })
      }
    },
    setIcon(val) {
      if (val) {
        return "el-icon-check";
      } else {
        return "el-icon-time";
      }
    },
    setColor(val) {
      if (val) {
        return "#2bc418";
      } else {
        return "#b3bdbb";
      }
    },
    /** 流程流转记录 */
    getFlowRecordList(procInsId, deployId) {
      const that = this
      const params = { procInsId: procInsId, deployId: deployId }
      flowRecord(params).then(res => {
        that.flowRecordList = res.data.flowList;
      }).catch(res => {
        this.goBack();
      })
    },
    /** 获取流程变量内容 */
    processVariables(taskId) {
      if (taskId) {
        // 提交流程申请时填写的表单存入了流程变量中后续任务处理时需要展示
        getProcessVariables(taskId).then(res => {
          // 回显表单
          this.$nextTick(() => {
            this.$refs.vFormRef.setFormJson(res.data.formJson);
            this.$nextTick(() => {
              // 加载表单填写的数据
              this.$refs.vFormRef.setFormData(res.data);
              this.$nextTick(() => {
                // 表单禁用
                this.$refs.vFormRef.disableForm();
              })
            })
          })
        });
      }
    },
    /** 返回页面 */
    goBack() {
      // 关闭当前标签页并返回上个页面
      const obj = { path: "/task/finished", query: { t: Date.now() } };
      this.$tab.closeOpenPage(obj);
    },
  }
};
</script>
<style lang="scss" scoped>
.test-form {
  margin: 15px auto;
  width: 800px;
  padding: 15px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}

.clearfix:after {
  clear: both
}

.box-card {
  width: 100%;
  margin-bottom: 20px;
}

.el-tag+.el-tag {
  margin-left: 10px;
}

.my-label {
  background: #E1F3D8;
}
</style>
