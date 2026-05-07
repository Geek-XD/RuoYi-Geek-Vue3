<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header class="clearfix">
        <span class="el-icon-document">待办任务</span>
        <el-tag style="margin-left:10px">发起人:{{ startUser }}</el-tag>
        <el-tag>任务节点:{{ taskName }}</el-tag>
        <el-button style="float: right;" size="small" type="danger" @click="goBack">关闭</el-button>
      </template>
      <el-tabs tab-position="top" v-model="activeName" @tab-click="handleClick">
        <!--表单信息-->
        <el-tab-pane label="表单信息" name="1">
          <el-col :span="16" :offset="4">
            <v-form-render ref="vFormRef" />
            <div style="display: flex;justify-content: center; gap: 10px; margin-top: 20px;">
              <el-button type="primary" @click="handleComplete">审 批</el-button>
              <el-button type="warning" @click="handleReturn">退 回</el-button>
              <el-button type="danger" @click="handleReject">驳 回</el-button>
            </div>
          </el-col>
        </el-tab-pane>

        <!--流程流转记录-->
        <el-tab-pane label="流转记录" name="2">
          <!--flowRecordList-->
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
        <!--流程图-->
        <el-tab-pane label="流程图" name="3">
          <bpmn-viewer :flowData="flowData" :procInsId="taskForm.procInsId" />
        </el-tab-pane>
      </el-tabs>
      <!--审批任务-->
      <el-dialog :title="completeTitle" v-model="completeOpen" width="60%" append-to-body>
        <el-form ref="completeTaskFormRef" :model="taskForm">
          <el-form-item prop="targetKey">
            <flow-user v-if="checkSendUser" :checkType="checkType" @handleUserSelect="handleUserSelect"></flow-user>
            <flow-role v-if="checkSendRole" @handleRoleSelect="handleRoleSelect"></flow-role>
          </el-form-item>
          <el-form-item label="处理意见" label-width="80px" prop="comment"
            :rules="[{ required: true, message: '请输入处理意见', trigger: 'blur' }]">
            <el-input type="textarea" v-model="taskForm.comment" placeholder="请输入处理意见" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="completeOpen = false">取 消</el-button>
            <el-button type="primary" @click="taskComplete">确 定</el-button>
          </span>
        </template>
      </el-dialog>
      <!--退回流程-->
      <el-dialog :title="returnTitle" v-model="returnOpen" width="40%" append-to-body>
        <el-form ref="returnTaskFormRef" :model="taskForm" label-width="80px">
          <el-form-item label="退回节点" prop="targetKey">
            <el-radio-group v-model="taskForm.targetKey">
              <el-radio-button v-for="item in returnTaskList" :key="item.id" :label="item.id">{{ item.name }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="退回意见" prop="comment" :rules="[{ required: true, message: '请输入意见', trigger: 'blur' }]">
            <el-input style="width: 50%" type="textarea" v-model="taskForm.comment" placeholder="请输入意见" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="returnOpen = false">取 消</el-button>
            <el-button type="primary" @click="taskReturn">确 定</el-button>
          </span>
        </template>
      </el-dialog>
      <!--驳回流程-->
      <el-dialog :title="rejectTitle" v-model="rejectOpen" width="40%" append-to-body>
        <el-form ref="rejectTaskFormRef" :model="taskForm" label-width="80px">
          <el-form-item label="驳回意见" prop="comment" :rules="[{ required: true, message: '请输入意见', trigger: 'blur' }]">
            <el-input style="width: 50%" type="textarea" v-model="taskForm.comment" placeholder="请输入意见" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="rejectOpen = false">取 消</el-button>
            <el-button type="primary" @click="taskReject">确 定</el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { flowRecord } from '@ruoyi/module-flowable/api/finished'
import FlowUser from '@ruoyi/module-flowable/components/Flow/User'
import FlowRole from '@ruoyi/module-flowable/components/Flow/Role'
import { flowXmlAndNode } from '@ruoyi/module-flowable/api/definition'
import { complete, rejectTask, returnList, returnTask, getNextFlowNode, delegate, flowTaskForm } from '@ruoyi/module-flowable/api/todo'
import BpmnViewer from '@ruoyi/module-flowable/components/Process/viewer'

defineOptions({ name: 'Record' })

const proxy = getCurrentInstance()?.proxy
const route = useRoute()
const vFormRef = ref()
const completeTaskFormRef = ref()
const returnTaskFormRef = ref()
const rejectTaskFormRef = ref()

const eventName = ref('click')
const flowData = ref({})
const activeName = ref('1')
const loading = ref(true)
const flowRecordList = ref([])
const rules = reactive({})
const taskForm = reactive({
  returnTaskShow: false,
  delegateTaskShow: false,
  defaultTaskShow: true,
  comment: '',
  procInsId: '',
  instanceId: '',
  deployId: '',
  taskId: '',
  procDefId: '',
  targetKey: '',
  variables: {},
})
const returnTaskList = ref([])
const completeTitle = ref(null)
const completeOpen = ref(false)
const returnTitle = ref(null)
const returnOpen = ref(false)
const rejectOpen = ref(false)
const rejectTitle = ref(null)
const checkSendUser = ref(false)
const checkSendRole = ref(false)
const checkType = ref('single')
const taskName = ref(null)
const startUser = ref(null)
const multiInstanceVars = ref('')
const formJson = ref({})

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

function handleUserSelect(selection) {
  if (selection) {
    if (selection instanceof Array) {
      const selectVal = selection.map(item => item.userId.toString())
      if (multiInstanceVars.value) {
        taskForm.variables[multiInstanceVars.value] = selectVal
      } else {
        taskForm.variables.approval = selectVal.join(',')
      }
    } else {
      taskForm.variables.approval = selection.userId.toString()
    }
  }
}

function handleRoleSelect(selection) {
  if (selection) {
    if (selection instanceof Array) {
      const selectVal = selection.map(item => item.roleId.toString())
      taskForm.variables.approval = selectVal.join(',')
    } else {
      taskForm.variables.approval = selection
    }
  }
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

/** 流程节点表单 */
function getFlowTaskForm(taskId) {
  if (taskId) {
    flowTaskForm({ taskId: taskId }).then(res => {
      vFormRef.value?.setFormJson(res.data.formJson)
      formJson.value = res.data.formJson
      nextTick(() => {
        vFormRef.value?.setFormData(res.data)
      })
    })
  }
}

/** 委派任务 */
function handleDelegate() {
  taskForm.delegateTaskShow = true
  taskForm.defaultTaskShow = false
}

function handleAssign() {
}

/** 返回页面 */
function goBack() {
  const obj = { path: '/task/todo', query: { t: Date.now() } }
  proxy?.$tab?.closeOpenPage(obj)
}

/** 驳回任务 */
function handleReject() {
  rejectOpen.value = true
  rejectTitle.value = '驳回流程'
}

function taskReject() {
  rejectTaskFormRef.value?.validate(valid => {
    if (valid) {
      rejectTask(taskForm).then(res => {
        proxy?.$modal?.msgSuccess(res.msg)
        goBack()
      })
    }
  })
}

/** 可退回任务列表 */
function handleReturn() {
  returnOpen.value = true
  returnTitle.value = '退回流程'
  returnList(taskForm).then(res => {
    returnTaskList.value = res.data
  })
}

/** 提交退回任务 */
function taskReturn() {
  returnTaskFormRef.value?.validate(valid => {
    if (valid) {
      returnTask(taskForm).then(res => {
        proxy?.$modal?.msgSuccess(res.msg)
        goBack()
      })
    }
  })
}

function cancelTask() {
  taskForm.returnTaskShow = false
  taskForm.defaultTaskShow = true
  returnTaskList.value = []
}

/** 委派任务 */
function submitDeleteTask() {
  completeTaskFormRef.value?.validate(valid => {
    if (valid) {
      delegate(taskForm).then(response => {
        proxy?.$modal?.msgSuccess(response.msg)
        goBack()
      })
    }
  })
}

function cancelDelegateTask() {
  taskForm.delegateTaskShow = false
  taskForm.defaultTaskShow = true
  returnTaskList.value = []
}

/** 加载审批任务弹框 */
function handleComplete() {
  completeOpen.value = true
  completeTitle.value = '流程审批'
  submitForm()
}

/** 用户审批任务 */
function taskComplete() {
  if (!taskForm.variables && checkSendUser.value) {
    proxy?.$modal?.msgError('请选择流程接收人员!')
    return
  }
  if (!taskForm.variables && checkSendRole.value) {
    proxy?.$modal?.msgError('请选择流程接收角色组!')
    return
  }
  if (!taskForm.comment) {
    proxy?.$modal?.msgError('请输入审批意见!')
    return
  }
  if (taskForm) {
    complete(taskForm).then(response => {
      proxy?.$modal?.msgSuccess(response.msg)
      goBack()
    })
  } else {
    complete(taskForm).then(response => {
      proxy?.$modal?.msgSuccess(response.msg)
      goBack()
    })
  }
}

/** 申请流程表单数据提交 */
function submitForm() {
  const params = { taskId: taskForm.taskId }
  getNextFlowNode(params).then(res => {
    vFormRef.value?.getFormData().then(formData => {
      Object.assign(taskForm.variables, formData)
      taskForm.variables.formJson = formJson.value
      console.log(taskForm, '流程审批提交表单数据1')
    }).catch(() => {
    })
    const data = res.data
    if (data) {
      if (data.dataType === 'dynamic') {
        if (data.type === 'assignee') {
          checkSendUser.value = true
          checkType.value = 'single'
        } else if (data.type === 'candidateUsers') {
          checkSendUser.value = true
          checkType.value = 'multiple'
        } else if (data.type === 'candidateGroups') {
          checkSendRole.value = true
        } else {
          multiInstanceVars.value = data.vars
          checkSendUser.value = true
          checkType.value = 'multiple'
        }
      }
    }
  })
}

function handleButtonClick(method) {
  const actionMap = {
    handleComplete,
    handleReturn,
    handleReject,
    handleDelegate,
    handleAssign,
    cancelTask,
    submitDeleteTask,
    cancelDelegateTask,
    taskComplete,
    taskReturn,
    taskReject,
    submitForm,
  }
  actionMap[method]?.()
}

onMounted(() => {
  taskName.value = getSingleQueryValue(route.query.taskName)
  startUser.value = getSingleQueryValue(route.query.startUser)
  taskForm.deployId = getSingleQueryValue(route.query.deployId)
  taskForm.taskId = getSingleQueryValue(route.query.taskId)
  taskForm.procInsId = getSingleQueryValue(route.query.procInsId)
  taskForm.executionId = getSingleQueryValue(route.query.executionId)
  taskForm.instanceId = getSingleQueryValue(route.query.procInsId)
  if (taskForm.taskId) {
    getFlowTaskForm(taskForm.taskId)
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
