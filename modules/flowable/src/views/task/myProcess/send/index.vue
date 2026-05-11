<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header class="clearfix">
        <span class="el-icon-document">发起任务</span>
        <el-button style="float: right;" size="small" type="danger" @click="goBack">关闭</el-button>
      </template>
      <el-tabs tab-position="top" v-model="activeName" @tab-click="handleClick">
        <!--表单信息-->
        <el-tab-pane label="表单信息" name="1">
          <!--初始化流程加载表单信息-->
          <el-col :span="16" :offset="4">
            <v-form-render :form-data="formRenderData" ref="vFormRef" />
            <div style="display: flex;justify-content: center;">
              <el-button type="primary" @click="submitForm">提 交</el-button>
              <el-button type="primary" @click="resetForm">重 置</el-button>
            </div>
          </el-col>
        </el-tab-pane>
        <!--流程图-->
        <el-tab-pane label="流程图" name="2">
          <bpmn-viewer :flowData="flowData" />
        </el-tab-pane>
      </el-tabs>
      <!--选择流程接收人-->
      <el-dialog :title="taskTitle" v-model="taskOpen" width="65%" append-to-body>
        <flow-user v-if="checkSendUser" :checkType="checkType" @handleUserSelect="handleUserSelect" />
        <flow-role v-if="checkSendRole" @handleRoleSelect="handleRoleSelect" />
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="taskOpen = false">取 消</el-button>
            <el-button type="primary" @click="submitTask">提 交</el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { definitionStart, flowXmlAndNode } from '@ruoyi/module-flowable/api/definition'
import BpmnViewer from '@ruoyi/module-flowable/components/Process/viewer'
import { flowFormData } from '@ruoyi/module-flowable/api/process'
import { getNextFlowNodeByStart } from '@ruoyi/module-flowable/api/todo'
import FlowUser from '@ruoyi/module-flowable/components/Flow/User'
import FlowRole from '@ruoyi/module-flowable/components/Flow/Role'

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
const deployId = ref('')
const procDefId = ref('')
const formRenderData = ref({})
const variables = ref([])
const taskTitle = ref(null)
const taskOpen = ref(false)
const checkSendUser = ref(false)
const checkSendRole = ref(false)
const checkType = ref('')
const checkValues = ref(null)
const formData = ref({})
const multiInstanceVars = ref('')
const formJson = ref({})

function getSingleQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return typeof value === 'string' ? value : ''
}

function handleClick(tab) {
  if (tab.index === '1') {
    flowXmlAndNode({ deployId: deployId.value }).then(res => {
      flowData.value = res.data
    })
  }
}

/** 流程表单数据 */
function getFlowFormData(currentDeployId) {
  const params = { deployId: currentDeployId }
  flowFormData(params).then(res => {
    nextTick(() => {
      vFormRef.value?.setFormJson(res.data)
      formJson.value = res.data
    })
  }).catch(() => {
    goBack()
  })
}

/** 返回页面 */
function goBack() {
  const obj = { path: '/task/process', query: { t: Date.now() } }
  proxy?.$tab?.closeOpenPage(obj)
}

/** 申请流程表单数据提交 */
function submitForm() {
  vFormRef.value?.getFormData().then(currentFormData => {
    getNextFlowNodeByStart({ deploymentId: deployId.value, variables: currentFormData }).then(res => {
      const data = res.data
      if (data) {
        formData.value = currentFormData
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
          taskOpen.value = true
          taskTitle.value = '选择任务接收'
        } else {
          if (procDefId.value) {
            const param = {
              formJson: formJson.value,
            }
            Object.assign(param, currentFormData)
            definitionStart(procDefId.value, param).then(res => {
              proxy?.$modal?.msgSuccess(res.msg)
              goBack()
            })
          }
        }
      }
    })
  }).catch(() => {
  })
}

/** 重置表单 */
function resetForm() {
  vFormRef.value?.resetForm()
}

/** 提交流程 */
function submitTask() {
  if (!checkValues.value && checkSendUser.value) {
    proxy?.$modal?.msgError('请选择任务接收!')
    return
  }
  if (!checkValues.value && checkSendRole.value) {
    proxy?.$modal?.msgError('请选择流程接收角色组!')
    return
  }
  if (formData.value) {
    const param = {
      formJson: formJson.value,
    }
    Object.assign(param, formData.value)
    if (multiInstanceVars.value) {
      param[multiInstanceVars.value] = checkValues.value
    } else {
      param.approval = checkValues.value
    }
    definitionStart(procDefId.value, param).then(res => {
      proxy?.$modal?.msgSuccess(res.msg)
      goBack()
    })
  }
}

function handleUserSelect(selection) {
  if (selection) {
    if (selection instanceof Array) {
      const selectVal = selection.map(item => item.userId)
      if (multiInstanceVars.value) {
        checkValues.value = selectVal
      } else {
        checkValues.value = selectVal.join(',')
      }
    } else {
      checkValues.value = selection.userId
    }
  }
}

function handleRoleSelect(selection) {
  if (selection) {
    if (selection instanceof Array) {
      const selectVal = selection.map(item => item.roleId)
      checkValues.value = selectVal.join(',')
    } else {
      checkValues.value = selection
    }
  }
}

onMounted(() => {
  deployId.value = getSingleQueryValue(route.query.deployId)
  procDefId.value = getSingleQueryValue(route.query.procDefId)
  getFlowFormData(deployId.value)
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
