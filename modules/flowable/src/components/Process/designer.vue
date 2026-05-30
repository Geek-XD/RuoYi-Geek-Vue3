<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>{{ translateNodeName(elementType) }}</span>
      </div>
    </template>

    <el-divider content-position="left">常规功能</el-divider>
    <el-collapse v-model="regularActiveNames">
      <el-collapse-item name="common">
        <template #title><i class="el-icon-info"></i> 常规信息</template>
        <common-panel :id="elementId" />
      </el-collapse-item>

      <el-collapse-item name="userTask" v-if="isUserTask">
        <template #title><i class="el-icon-s-claim"></i> 任务配置</template>
        <user-task-panel :id="elementId" />
      </el-collapse-item>

      <el-collapse-item name="serviceTaskLike" v-if="isServiceTaskLike">
        <template #title><i class="el-icon-s-operation"></i> 服务配置</template>
        <service-task-like-panel :id="elementId" />
      </el-collapse-item>

      <el-collapse-item name="scriptTask" v-if="isScriptTask">
        <template #title><i class="el-icon-document"></i> 脚本配置</template>
        <script-task-panel :id="elementId" />
      </el-collapse-item>

      <el-collapse-item name="callActivity" v-if="isCallActivity">
        <template #title><i class="el-icon-refresh-right"></i> 调用配置</template>
        <call-activity-panel :id="elementId" />
      </el-collapse-item>

      <el-collapse-item name="form" v-if="formVisible">
        <template #title><i class="el-icon-s-order"></i> 表单配置</template>
        <form-panel :id="elementId" />
      </el-collapse-item>

      <el-collapse-item name="condition" v-if="conditionVisible">
        <template #title><i class="el-icon-share"></i> 流转条件</template>
        <condition-panel :id="elementId" />
      </el-collapse-item>
    </el-collapse>

    <el-divider content-position="left">高级功能</el-divider>
    <el-collapse v-model="advancedActiveNames">
      <el-collapse-item name="executionListener">
        <template #title><i class="el-icon-s-promotion"></i> 执行监听器
          <el-badge :value="executionListenerCount" class="item" type="primary" />
        </template>
        <execution-listener :id="elementId" @getExecutionListenerCount="getExecutionListenerCount" />
      </el-collapse-item>

      <el-collapse-item name="taskListener" v-if="isUserTask">
        <template #title><i class="el-icon-s-flag"></i> 任务监听器
          <el-badge :value="taskListenerCount" class="item" type="primary" />
        </template>
        <task-listener :id="elementId" @getTaskListenerCount="getTaskListenerCount" />
      </el-collapse-item>

      <el-collapse-item name="multiInstance" v-if="multiInstanceVisible">
        <template #title><i class="el-icon-s-grid"></i> 多实例</template>
        <multi-instance :id="elementId" />
      </el-collapse-item>

      <el-collapse-item name="properties">
        <template #title><i class="el-icon-circle-plus"></i> 扩展属性</template>
        <properties-panel :id="elementId" />
      </el-collapse-item>

      <el-collapse-item name="other">
        <template #title><i class="el-icon-circle-plus"></i> 其他</template>
        <other-panel :id="elementId" />
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ExecutionListener from './panel/executionListener'
import TaskListener from './panel/taskListener'
import MultiInstance from './panel/multiInstance'
import CommonPanel from './panel/commonPanel'
import UserTaskPanel from './panel/taskPanel'
import ServiceTaskLikePanel from './panel/serviceTaskLikePanel'
import ScriptTaskPanel from './panel/scriptTaskPanel'
import CallActivityPanel from './panel/callActivityPanel'
import ConditionPanel from './panel/conditionPanel'
import FormPanel from './panel/formPanel'
import PropertiesPanel from './panel/PropertiesPanel'
import OtherPanel from './panel/otherPanel'
import { translateNodeName } from './common/bpmnUtils'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'
import type {
  BpmnElementLike,
  ElementChangedEvent,
  SelectionChangedEvent
} from './common/types'

defineOptions({ name: 'Designer' })

const regularActiveNames = ref<string[]>(['common'])
const advancedActiveNames = ref<string[]>([])
const executionListenerCount = ref(0)
const taskListenerCount = ref(0)
const elementId = ref('')
const elementType = ref('')
const conditionVisible = ref(false) // 流转条件设置
const formVisible = ref(false) // 表单配置

const isUserTask = computed(() => elementType.value === 'UserTask')
const isServiceTaskLike = computed(() => ['ServiceTask', 'SendTask', 'BusinessRuleTask'].includes(elementType.value))
const isScriptTask = computed(() => elementType.value === 'ScriptTask')
const isCallActivity = computed(() => elementType.value === 'CallActivity')
const multiInstanceVisible = computed(() => elementType.value.includes('Task') || elementType.value === 'CallActivity')

watch(elementId, () => {
  regularActiveNames.value = ['common']
  advancedActiveNames.value = []
})

function resolveDefaultElement(): BpmnElementLike | null {
  const registry = modelerStore.elRegistry
  if (!registry) return null

  return registry.find(el => el.type === 'bpmn:Process')
    ?? registry.find(el => el.type === 'bpmn:Collaboration')
    ?? null
}

// 初始化数据
function initFormOnChanged(element: BpmnElementLike | null): void {
  let activatedElement = element
  if (!activatedElement) {
    activatedElement = resolveDefaultElement()
  }
  if (!activatedElement) return

  modelerStore.element = activatedElement
  elementId.value = activatedElement.id ?? ''
  elementType.value = activatedElement.type?.split(':')[1] ?? ''
  conditionVisible.value = !!(
    elementType.value === 'SequenceFlow' &&
    activatedElement.source &&
    !activatedElement.source.type?.includes('StartEvent')
  )
  formVisible.value = elementType.value === 'UserTask' || elementType.value === 'StartEvent'
}

// 注册节点事件
function getActiveElement(): void {
  // 初始第一个选中元素 bpmn:Process
  initFormOnChanged(null)
  if (!modelerStore.modeler) return

  modelerStore.modeler.on('import.done', () => {
    initFormOnChanged(null)
  })
  // 监听选择事件，修改当前激活的元素以及表单
  modelerStore.modeler.on('selection.changed', ({ newSelection }: SelectionChangedEvent) => {
    initFormOnChanged(newSelection?.[0] ?? null)
  })
  modelerStore.modeler.on('element.changed', ({ element }: ElementChangedEvent) => {
    // 保证 修改 "默认流转路径" 类似需要修改多个元素的事件发生的时候，更新表单的元素与原选中元素不一致。
    if (element && element.id === elementId.value) {
      initFormOnChanged(element)
    }
  })
}

function getExecutionListenerCount(value: number): void {
  executionListenerCount.value = value
}

function getTaskListenerCount(value: number): void {
  taskListenerCount.value = value
}

onMounted(() => {
  getActiveElement()
})
</script>
