<template>
  <div class="panel-tab__content">
    <el-table :data="elementListenersList" border size="small">
      <el-table-column label="序号" width="50px" type="index" />
      <el-table-column label="类型" width="60px" show-overflow-tooltip
        :formatter="row => listenerEventTypeObject[row.event]" />
      <el-table-column label="监听类型" width="85px" show-overflow-tooltip
        :formatter="row => listenerTypeObject[row.listenerType]" />
      <el-table-column label="操作">
        <template v-slot="scope">
          <el-button size="small" type="primary" @click="openListenerForm(scope.row, scope.$index)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-button size="small" type="danger" @click="removeListener(scope.row, scope.$index)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="element-drawer__button_save">
      <el-button type="primary" icon="plus" size="small" @click="listenerSystemVisible = true">内置监听器</el-button>
      <el-button type="primary" icon="plus" size="small" @click="openListenerForm(null)">自定义监听器</el-button>
    </div>

    <!-- 监听器 编辑/创建 部分 -->
    <el-drawer v-model="listenerFormModelVisible" title="任务监听器" size="480px" append-to-body destroy-on-close>
      <el-form :model="listenerForm" size="small" label-width="110px" ref="listenerFormRef" @submit.native.prevent>
        <el-form-item prop="event" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <template #label>
            <span>
              事件类型
              <el-tooltip placement="top">
                <template #content>
                  <div>
                    create（创建）：当任务已经创建，并且所有任务参数都已经设置时触发。
                    <br />assignment（指派）：当任务已经指派给某人时触发。请注意：当流程执行到达用户任务时，
                    <br />在触发create事件之前，会首先触发assignment事件。这顺序看起来不太自然，
                    <br />但是有实际原因的：当收到create事件时，我们通常希望能看到任务的所有参数，包括办理人。
                    <br />complete（完成）：当任务已经完成，从运行时数据中删除前触发。
                    <br />delete（删除）：在任务即将被删除前触发。请注意任务由completeTask正常完成时也会触发。
                  </div>
                </template>
                <el-icon>
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="listenerForm.event">
            <el-option v-for="i in Object.keys(listenerEventTypeObject)" :key="i" :label="listenerEventTypeObject[i]"
              :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="监听器类型" prop="listenerType" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <template #label>
            <span>
              监听类型
              <el-tooltip placement="top">
                <template #content>
                  <div>
                    class：需要调用的委托类。这个类必须实现org.flowable.engine.delegate.TaskListener接口。
                    <br />assignment（指派）：当任务已经指派给某人时触发。请注意：当流程执行到达用户任务时，
                    <br /> 在触发create事件之前，会首先触发assignment事件。这顺序看起来不太自然，
                    <br /> 但是有实际原因的：当收到create事件时，我们通常希望能看到任务的所有参数，包括办理人。
                    <br />complete（完成）：当任务已经完成，从运行时数据中删除前触发。
                    <br />delete（删除）：在任务即将被删除前触发。请注意任务由completeTask正常完成时也会触发。
                  </div>
                </template>
                <i class="el-icon-question" />
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="listenerForm.listenerType">
            <el-option v-for="i in Object.keys(listenerTypeObject)" :key="i" :label="listenerTypeObject[i]"
              :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="listenerForm.listenerType === 'classListener'" label="Java类" prop="class"
          key="listener-class" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerForm.class" clearable />
        </el-form-item>
        <el-form-item v-if="listenerForm.listenerType === 'expressionListener'" label="表达式" prop="expression"
          key="listener-expression" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerForm.expression" clearable />
        </el-form-item>
        <el-form-item v-if="listenerForm.listenerType === 'delegateExpressionListener'" label="代理表达式"
          prop="delegateExpression" key="listener-delegate" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerForm.delegateExpression" clearable />
        </el-form-item>
        <template v-if="listenerForm.listenerType === 'scriptListener'">
          <el-form-item label="脚本格式" prop="scriptFormat" key="listener-script-format"
            :rules="{ required: true, trigger: ['blur', 'change'], message: '请填写脚本格式' }">
            <el-select v-model="listenerForm.scriptFormat">
              <el-option label="JavaScript" value="JavaScript" />
              <el-option label="groovy" value="groovy" />
              <el-option label="juel" value="juel" />
            </el-select>
          </el-form-item>
          <el-form-item label="脚本类型" prop="scriptType" key="listener-script-type"
            :rules="{ required: true, trigger: ['blur', 'change'], message: '请选择脚本类型' }">
            <el-select v-model="listenerForm.scriptType">
              <el-option label="内联脚本" value="inlineScript" />
              <el-option label="外部脚本" value="externalScript" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="listenerForm.scriptType === 'inlineScript'" label="脚本内容" prop="value"
            key="listener-script" :rules="{ required: true, trigger: ['blur', 'change'], message: '请填写脚本内容' }">
            <el-input v-model="listenerForm.value" type="textarea" clearable />
          </el-form-item>
          <el-form-item v-if="listenerForm.scriptType === 'externalScript'" label="资源地址" prop="resource"
            key="listener-resource" :rules="{ required: true, trigger: ['blur', 'change'], message: '请填写资源地址' }">
            <el-input v-model="listenerForm.resource" clearable />
          </el-form-item>
        </template>

        <template v-if="listenerForm.event === 'timeout'">
          <el-form-item label="定时器类型" prop="eventDefinitionType" key="eventDefinitionType">
            <el-select v-model="listenerForm.eventDefinitionType">
              <el-option label="日期" value="date" />
              <el-option label="持续时长" value="duration" />
              <el-option label="循环" value="cycle" />
              <el-option label="无" value="null" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="!!listenerForm.eventDefinitionType && listenerForm.eventDefinitionType !== 'null'"
            label="定时器" prop="eventTimeDefinitions" key="eventTimeDefinitions"
            :rules="{ required: true, trigger: ['blur', 'change'], message: '请填写定时器配置' }">
            <el-input v-model="listenerForm.eventTimeDefinitions" clearable />
          </el-form-item>
        </template>
      </el-form>

      <el-divider />
      <p class="listener-filed__title">
        <span><i class="el-icon-menu"></i>注入字段：</span>
        <el-button size="small" type="primary" @click="openListenerFieldForm(null)">添加字段</el-button>
      </p>
      <el-table :data="fieldsListOfListener" size="small" max-height="240" border fit style="flex: none">
        <el-table-column label="序号" width="50px" type="index" />
        <el-table-column label="字段名称" width="80px" prop="name" />
        <el-table-column label="字段类型" width="80px" show-overflow-tooltip
          :formatter="row => fieldTypeObject[row.fieldType]" />
        <el-table-column label="值内容" width="80px" show-overflow-tooltip
          :formatter="row => row.string || row.expression" />
        <el-table-column label="操作">
          <template v-slot="scope">
            <el-button size="small" type="primary"
              @click="openListenerFieldForm(scope.row, scope.$index)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button size="small" type="danger" @click="removeListenerField(scope.row, scope.$index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="element-drawer__button">
        <el-button size="small" @click="listenerFormModelVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="saveListenerConfig">保 存</el-button>
      </div>
    </el-drawer>

    <!-- 注入字段 编辑/创建 部分 -->
    <el-dialog title="字段配置" v-model="listenerFieldFormModelVisible" width="600px" append-to-body destroy-on-close>
      <el-form :model="listenerFieldForm" label-width="96px" ref="listenerFieldFormRef" style="height: 136px"
        @submit.native.prevent>
        <el-form-item label="字段名称：" prop="name" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerFieldForm.name" clearable />
        </el-form-item>
        <el-form-item label="字段类型：" prop="fieldType" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-select v-model="listenerFieldForm.fieldType">
            <el-option v-for="i in Object.keys(fieldTypeObject)" :key="i" :label="fieldTypeObject[i]" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="listenerFieldForm.fieldType === 'string'" label="字段值：" prop="string" key="field-string"
          :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerFieldForm.string" clearable />
        </el-form-item>
        <el-form-item v-if="listenerFieldForm.fieldType === 'expression'" label="表达式：" prop="expression"
          key="field-expression" :rules="{ required: true, trigger: ['blur', 'change'] }">
          <el-input v-model="listenerFieldForm.expression" clearable />
        </el-form-item>
      </el-form>
      <template #footer class="dialog-footer">
        <el-button size="small" @click="listenerFieldFormModelVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="saveListenerFiled">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 内置监听器 -->
    <el-drawer v-model="listenerSystemVisible" title="任务监听器" size="580px" append-to-body destroy-on-close>
      <el-table v-loading="loading" :data="listenerList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="名称" align="center" prop="name" />
        <el-table-column label="类型" align="center" prop="eventType" />
        <el-table-column label="监听类型" align="center" prop="valueType">
          <template v-slot="scope">
            <dict-tag :options="sys_listener_value_type" :value="scope.row.valueType" />
          </template>
        </el-table-column>
        <el-table-column label="执行内容" align="center" prop="value" :show-overflow-tooltip="true" />
      </el-table>

      <pagination v-show="total > 0" :total="total" layout="prev, pager, next" v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize" @pagination="getList" />

      <div class="element-drawer__button">
        <el-button size="small" @click="listenerSystemVisible = false">取 消</el-button>
        <el-button size="small" type="primary" :disabled="listenerSystemChecked" @click="saveSystemListener">保
          存</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, reactive, ref, watch } from "vue";
import { listListener } from "@ruoyi/module-flowable/api/listener";
import {
  changeListenerObject,
  createListenerObject,
  createSystemListenerObject,
  updateElementExtensions
} from "../common/bpmnUtils";
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'
import { StrUtil } from "@ruoyi/core/utils/StrUtil";

defineOptions({ name: "TaskListener" })

type PanelProxy = {
  useDict?: (...args: string[]) => { sys_listener_value_type?: unknown[]; sys_listener_event_type?: unknown[] }
  $confirm?: (message: string, title: string, options: { confirmButtonText: string; cancelButtonText: string }) => Promise<void>
}

const emit = defineEmits<{
  (e: 'getTaskListenerCount', count: number): void
}>()

const props = defineProps({
  id: {
    type: String,
    required: true
  },
})

const proxy = getCurrentInstance()?.proxy as PanelProxy | undefined
const { sys_listener_value_type, sys_listener_event_type } = proxy?.useDict?.("sys_listener_value_type", "sys_listener_event_type") ?? {}

const listenerFormRef = ref()
const listenerFieldFormRef = ref()
const elementListenersList = ref<any[]>([])
const listenerForm = ref<Record<string, any>>({})
const listenerFormModelVisible = ref(false)
const fieldsListOfListener = ref<any[]>([])
const bpmnElementListeners = ref<any[]>([])
const otherExtensionList = ref<any[]>([])
const listenerFieldForm = ref<Record<string, any>>({})
const listenerFieldFormModelVisible = ref(false)
const editingListenerIndex = ref(-1)
const editingListenerFieldIndex = ref(-1)
const listenerList = ref<any[]>([])
const checkedListenerData = ref<any[]>([])
const listenerSystemVisible = ref(false)
const listenerSystemChecked = ref(true)
const loading = ref(true)
const total = ref(0)
const listenerTypeObject = {
  classListener: "Java 类",
  expressionListener: "表达式",
  delegateExpressionListener: "代理表达式",
  scriptListener: "脚本"
}
const listenerEventTypeObject = {
  create: "创建",
  assignment: "指派",
  complete: "完成",
  delete: "删除",
}
const fieldTypeObject = {
  string: "字符串",
  expression: "表达式"
}
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  type: 1,
})

const resetListenersList = () => {
  bpmnElementListeners.value = modelerStore.element.businessObject?.extensionElements?.values?.filter(ex => ex.$type === `flowable:TaskListener`) ?? [];
  elementListenersList.value = bpmnElementListeners.value.map(listener => initListenerType(listener));
  emit('getTaskListenerCount', elementListenersList.value.length)
}

const openListenerForm = (listener, index) => {
  if (listener) {
    listenerForm.value = initListenerForm(listener);
    editingListenerIndex.value = index;
  } else {
    listenerForm.value = {};
    editingListenerIndex.value = -1;
  }
  if (listener && listener.fields) {
    fieldsListOfListener.value = listener.fields.map(field => ({
      ...field,
      fieldType: field.string ? "string" : "expression"
    }));
  } else {
    fieldsListOfListener.value = [];
    listenerForm.value["fields"] = [];
  }
  listenerFormModelVisible.value = true;
  nextTick(() => {
    if (listenerFormRef.value) listenerFormRef.value.clearValidate();
  });
}

const openListenerFieldForm = (field, index) => {
  listenerFieldForm.value = field ? JSON.parse(JSON.stringify(field)) : {};
  editingListenerFieldIndex.value = field ? index : -1;
  listenerFieldFormModelVisible.value = true;
  nextTick(() => {
    if (listenerFieldFormRef.value) listenerFieldFormRef.value.clearValidate();
  });
}

const saveListenerFiled = async () => {
  let validateStatus = await listenerFieldFormRef.value.validate();
  if (!validateStatus) return;
  if (editingListenerFieldIndex.value === -1) {
    fieldsListOfListener.value.push(listenerFieldForm.value);
    listenerForm.value.fields.push(listenerFieldForm.value);
  } else {
    fieldsListOfListener.value.splice(editingListenerFieldIndex.value, 1, listenerFieldForm.value);
    listenerForm.value.fields.splice(editingListenerFieldIndex.value, 1, listenerFieldForm.value);
  }
  listenerFieldFormModelVisible.value = false;
  nextTick(() => (listenerFieldForm.value = {}));
}

const removeListenerField = (field, index) => {
  proxy?.$confirm?.("确认移除该字段吗？", "提示", {
    confirmButtonText: "确 认",
    cancelButtonText: "取 消"
  }).then(() => {
    fieldsListOfListener.value.splice(index, 1);
    listenerForm.value.fields.splice(index, 1);
  }).catch(() => console.info("操作取消"));
}

const removeListener = (listener, index) => {
  proxy?.$confirm?.("确认移除该监听器吗？", "提示", {
    confirmButtonText: "确 认",
    cancelButtonText: "取 消"
  }).then(() => {
    bpmnElementListeners.value.splice(index, 1);
    elementListenersList.value.splice(index, 1);
    updateElementExtensions(modelerStore.moddle, modelerStore.modeling, modelerStore.element, otherExtensionList.value.concat(bpmnElementListeners.value));
    emit('getTaskListenerCount', elementListenersList.value.length)
  }).catch((r) => console.info(r, "操作取消"));
}

const saveListenerConfig = async () => {
  let validateStatus = await listenerFormRef.value.validate();
  if (!validateStatus) return;
  const listenerObject = createListenerObject(modelerStore.moddle, listenerForm.value, true, "flowable");
  if (editingListenerIndex.value === -1) {
    bpmnElementListeners.value.push(listenerObject);
    elementListenersList.value.push(listenerForm.value);
  } else {
    bpmnElementListeners.value.splice(editingListenerIndex.value, 1, listenerObject);
    elementListenersList.value.splice(editingListenerIndex.value, 1, listenerForm.value);
  }
  otherExtensionList.value = modelerStore.element.businessObject?.extensionElements?.values?.filter(ex => ex.$type !== `flowable:TaskListener`) ?? [];
  updateElementExtensions(modelerStore.moddle, modelerStore.modeling, modelerStore.element, otherExtensionList.value.concat(bpmnElementListeners.value));
  emit('getTaskListenerCount', elementListenersList.value.length)
  listenerFormModelVisible.value = false;
  listenerForm.value = {};
}

const initListenerType = (listener) => {
  let listenerType;
  if (listener.class) listenerType = "classListener";
  if (listener.expression) listenerType = "expressionListener";
  if (listener.delegateExpression) listenerType = "delegateExpressionListener";
  if (listener.script) listenerType = "scriptListener";
  return {
    ...JSON.parse(JSON.stringify(listener)),
    ...(listener.script ?? {}),
    listenerType: listenerType
  };
}

const initListenerForm = (listener) => {
  let self = { ...listener };
  if (listener.script) {
    self = {
      ...listener,
      ...listener.script,
      scriptType: listener.script.resource ? "externalScript" : "inlineScript"
    };
  }
  if (listener.event === "timeout" && listener.eventDefinitions) {
    if (listener.eventDefinitions.length) {
      let k = "";
      for (let key in listener.eventDefinitions[0]) {
        if (key.indexOf("time") !== -1) {
          k = key;
          self.eventDefinitionType = key.replace("time", "").toLowerCase();
        }
      }
      self.eventTimeDefinitions = listener.eventDefinitions[0][k].body;
    }
  }
  return self;
}

const getList = () => {
  loading.value = true;
  listListener(queryParams).then(response => {
    listenerList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

const handleSelectionChange = (selection) => {
  checkedListenerData.value = selection;
  listenerSystemChecked.value = selection.length !== 1;
}

const saveSystemListener = () => {
  if (checkedListenerData.value.length > 0) {
    checkedListenerData.value.forEach(value => {
      const listenerObject = createSystemListenerObject(modelerStore.moddle, value, true, "flowable");
      bpmnElementListeners.value.push(listenerObject);
      elementListenersList.value.push(changeListenerObject(value));
      otherExtensionList.value = modelerStore.element.businessObject?.extensionElements?.values?.filter(ex => ex.$type !== `flowable:TaskListener`) ?? [];
      updateElementExtensions(modelerStore.moddle, modelerStore.modeling, modelerStore.element, otherExtensionList.value.concat(bpmnElementListeners.value));
    })
    emit('getTaskListenerCount', elementListenersList.value.length)
  }
  checkedListenerData.value = [];
  listenerSystemChecked.value = true;
  listenerSystemVisible.value = false;
}

watch(
  () => props.id,
  (newVal) => {
    if (StrUtil.isNotBlank(newVal)) {
      resetListenersList();
    }
  },
  { immediate: true }
)

getList();
</script>

<style lang="scss">
@use '../style/process-panel' as *;

.flow-containers .el-badge__content.is-fixed {
  top: 18px;
}

.dialog-footer button:first-child {
  margin-right: 10px;
}
</style>
