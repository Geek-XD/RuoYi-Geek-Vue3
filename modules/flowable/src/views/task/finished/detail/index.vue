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

<script setup>
import { getCurrentInstance, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { flowRecord } from '@ruoyi/module-flowable/api/finished'
import { getProcessVariables, flowXmlAndNode } from '@ruoyi/module-flowable/api/definition'
import BpmnViewer from '@ruoyi/module-flowable/components/Process/viewer'

defineOptions({ name: 'Record' })

const proxy = getCurrentInstance()?.proxy
const route = useRoute()
const vFormRef = ref()

const flowData = ref({})
const activeName = ref('1')
const queryParams = reactive({
  deptId: undefined
})
const loading = ref(true)
const flowRecordList = ref([])
const taskForm = reactive({
  multiple: false,
  comment: '',
  procInsId: '',
  instanceId: '',
  deployId: '',
  taskId: '',
  procDefId: '',
  vars: '',
})

function getSingleQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return typeof value === 'string' ? value : ''
}

function handleClick(tab) {
  if (tab.index === '2') {
    flowXmlAndNode({ procInsId: taskForm.procInsId, deployId: taskForm.deployId }).then(res => {
      flowData.value = res.data
    })
  }
}

function setIcon(val) {
  if (val) {
    return 'el-icon-check'
  }
  return 'el-icon-time'
}

function setColor(val) {
  if (val) {
    return '#2bc418'
  }
  return '#b3bdbb'
}

/** 流程流转记录 */
function getFlowRecordList(procInsId, deployId) {
  const params = { procInsId: procInsId, deployId: deployId }
  flowRecord(params).then(res => {
    flowRecordList.value = res.data.flowList
  }).catch(() => {
    goBack()
  })
}

/** 获取流程变量内容 */
function processVariables(taskId) {
  if (taskId) {
    getProcessVariables(taskId).then(res => {
      nextTick(() => {
        vFormRef.value?.setFormJson(res.data.formJson)
        nextTick(() => {
          vFormRef.value?.setFormData(res.data)
          nextTick(() => {
            vFormRef.value?.disableForm()
          })
        })
      })
    })
  }
}

/** 返回页面 */
function goBack() {
  const obj = { path: '/task/finished', query: { t: Date.now() } }
  proxy?.$tab?.closeOpenPage(obj)
}

onMounted(() => {
  taskForm.deployId = getSingleQueryValue(route.query.deployId)
  taskForm.taskId = getSingleQueryValue(route.query.taskId)
  taskForm.procInsId = getSingleQueryValue(route.query.procInsId)
  if (taskForm.taskId) {
    processVariables(taskForm.taskId)
  }
  getFlowRecordList(taskForm.procInsId, taskForm.deployId)
})
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
