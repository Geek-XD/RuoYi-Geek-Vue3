<template>
  <div>
    <el-form label-width="80px">
      <el-form-item label="异步">
        <el-switch v-model="bpmnFormData.async" active-text="是" inactive-text="否"
          @change="updateElementTask('async')" />
      </el-form-item>
      <el-form-item label="用户类型">
        <el-select v-model="bpmnFormData.userType" placeholder="选择人员" @change="updateUserType">
          <el-option v-for="item in userTypeOption" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="指定人员" v-if="bpmnFormData.userType === 'assignee'">
        <el-input-tag v-model="bpmnFormData.assignee" :value="bpmnFormData.assignee" />
        <el-button-group class="ml-4" style="margin-top: 4px">
          <el-tooltip class="box-item" effect="dark" content="指定人员" placement="bottom">
            <el-button type="primary" icon="user" @click="singleUserCheck" />
          </el-tooltip>
          <el-tooltip class="box-item" effect="dark" content="选择表达式" placement="bottom">
            <el-button type="warning" icon="postcard" @click="singleExpCheck" />
          </el-tooltip>
        </el-button-group>
      </el-form-item>

      <el-form-item label="候选人员" v-else-if="bpmnFormData.userType === 'candidateUsers'">
        <el-input-tag v-model="bpmnFormData.candidateUsers" :value="bpmnFormData.candidateUsers" />
        <el-button-group class="ml-4" style="margin-top: 4px">
          <el-tooltip class="box-item" effect="dark" content="候选人员" placement="bottom">
            <el-button type="primary" icon="user" @click="multipleUserCheck" />
          </el-tooltip>
          <el-tooltip class="box-item" effect="dark" content="选择表达式" placement="bottom">
            <el-button type="warning" icon="postcard" @click="singleExpCheck" />
          </el-tooltip>
        </el-button-group>
      </el-form-item>

      <el-form-item label="候选角色" v-else>
        <el-input-tag v-model="bpmnFormData.candidateGroups" :value="bpmnFormData.candidateGroups" />
        <el-button-group class="ml-4" style="margin-top: 4px">
          <el-tooltip class="box-item" effect="dark" content="候选角色" placement="bottom">
            <el-button type="primary" icon="user" @click="multipleRoleCheck" />
          </el-tooltip>
          <el-tooltip class="box-item" effect="dark" content="选择表达式" placement="bottom">
            <el-button type="warning" icon="postcard" @click="singleExpCheck" />
          </el-tooltip>
        </el-button-group>
      </el-form-item>

      <el-form-item label="优先级">
        <el-input v-model="bpmnFormData.priority" @change="updateElementTask('priority')" />
      </el-form-item>
      <el-form-item label="到期时间">
        <el-input v-model="bpmnFormData.dueDate" @change="updateElementTask('dueDate')" />
      </el-form-item>
    </el-form>

    <el-dialog title="选择人员" v-model="userVisible" width="60%" :close-on-press-escape="false" :show-close="false">
      <flow-user v-if="userVisible" :checkType="checkType"
        :selectValues="selectData.assignee || selectData.candidateUsers" @handleUserSelect="userSelect" />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="userVisible = false">取 消</el-button>
          <el-button type="primary" @click="checkUserComplete">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="选择候选角色" v-model="roleVisible" width="60%" :close-on-press-escape="false" :show-close="false">
      <flow-role v-if="roleVisible" :selectValues="selectData.candidateGroups" @handleRoleSelect="roleSelect" />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="roleVisible = false">取 消</el-button>
          <el-button type="primary" @click="checkRoleComplete">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="选择表达式" v-model="expVisible" width="60%" :close-on-press-escape="false" :show-close="false">
      <flow-exp v-if="expVisible" :selectValues="selectData.exp" @handleSingleExpSelect="expSelect" />
      <template #footer class="dialog-footer">
        <div class="dialog-footer">
          <el-button @click="expVisible = false">取 消</el-button>
          <el-button type="primary" @click="checkExpComplete">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FlowUser from '@ruoyi/module-flowable/components/Flow/User'
import FlowRole from '@ruoyi/module-flowable/components/Flow/Role'
import FlowExp from '@ruoyi/module-flowable/components/Flow/Expression'
import ElInputTag from '@ruoyi/module-flowable/components/Flow/ElInputTag'
import { StrUtil } from '@ruoyi/core/utils/StrUtil'
import modelerStore from '@ruoyi/module-flowable/components/Process/common/global'

defineOptions({ name: "TaskPanel" })

const props = defineProps({
  id: {
    type: String,
    required: true
  },
})

const userVisible = ref(false)
const roleVisible = ref(false)
const expVisible = ref(false)
const isIndeterminate = ref(true)
const checkType = ref('single')
const userType = ref('')
const userTypeOption = [
  { label: '指定人员', value: 'assignee' },
  { label: '候选人员', value: 'candidateUsers' },
  { label: '候选角色', value: 'candidateGroups' }
]
const checkAll = ref(false)
const bpmnFormData = ref<Record<string, any>>({
  userType: "",
  assignee: "",
  candidateUsers: "",
  candidateGroups: "",
  dueDate: "",
  priority: "",
  dataType: "",
  expId: "",
})
const selectData = ref<Record<string, any>>({
  assignee: null,
  candidateUsers: null,
  candidateGroups: null,
  exp: null,
})
const otherExtensionList = ref<any[]>([])

const resetTaskForm = () => {
  bpmnFormData.value = {
    userType: "",
    assignee: "",
    candidateUsers: "",
    candidateGroups: "",
    dueDate: "",
    priority: "",
    dataType: "",
    expId: "",
  }
  selectData.value = {
    assignee: null,
    candidateUsers: null,
    candidateGroups: null,
    exp: null,
  }
  for (let key in bpmnFormData.value) {
    const value = modelerStore.element?.businessObject[key] || bpmnFormData.value[key];
    bpmnFormData.value[key] = value;
  }
  checkValuesEcho(bpmnFormData.value);
}

const updateElementTask = (key) => {
  const taskAttr = Object.create(null);
  taskAttr[key] = bpmnFormData.value[key] || "";
  modelerStore.modeling.updateProperties(modelerStore.element, taskAttr);
}

const updateCustomElement = (key, value) => {
  const taskAttr = Object.create(null);
  taskAttr[key] = value;
  modelerStore.modeling.updateProperties(modelerStore.element, taskAttr);
}

const updateUserType = (val) => {
  deleteFlowAttar();
  delete modelerStore.element.businessObject[`userType`]
  bpmnFormData.value[val] = null;
  selectData.value = {
    assignee: null,
    candidateUsers: null,
    candidateGroups: null,
    exp: null,
  }
  updateCustomElement('userType', val);
}

const checkValuesEcho = (formData) => {
  if (StrUtil.isNotBlank(formData.expId)) {
    getExpList(formData.expId, formData.userType);
  } else {
    if ("candidateGroups" === formData.userType) {
      getRoleList(formData[formData.userType], formData.userType);
    } else {
      getUserList(formData[formData.userType], formData.userType);
    }
  }
}

const getExpList = (val, key) => {
  if (StrUtil.isNotBlank(val)) {
    const matchedExp = modelerStore.expList?.find(item => item.id?.toString() === val);
    bpmnFormData.value[key] = matchedExp?.name ?? val;
    selectData.value.exp = matchedExp?.id ?? null;
  }
}

const getUserList = (val, key) => {
  if (StrUtil.isNotBlank(val)) {
    const newArr = modelerStore.userList?.filter(i => val.split(',').includes(i.userId.toString()))
    bpmnFormData.value[key] = newArr.length ? newArr.map(item => item.nickName).join(',') : val;
    if ('assignee' === key) {
      const matchedUser = newArr.find(item => item.userId.toString() === val);
      selectData.value[key] = matchedUser?.userId ?? null;
    } else {
      selectData.value[key] = newArr.map(item => item.userId);
    }
  }
}

const getRoleList = (val, key) => {
  if (StrUtil.isNotBlank(val)) {
    const newArr = modelerStore.roleList?.filter(i => val.split(',').includes(i.roleId.toString()))
    bpmnFormData.value[key] = newArr.length ? newArr.map(item => item.roleName).join(',') : val;
    if ('assignee' === key) {
      const matchedRole = newArr.find(item => item.roleId.toString() === val);
      selectData.value[key] = matchedRole?.roleId ?? null;
    } else {
      selectData.value[key] = newArr.map(item => item.roleId);
    }
  }
}

const singleUserCheck = () => {
  userVisible.value = true;
  checkType.value = "single";
}

const multipleUserCheck = () => {
  userVisible.value = true;
  checkType.value = "multiple";
}

const singleRoleCheck = () => {
  roleVisible.value = true;
  checkType.value = "single";
}

const multipleRoleCheck = () => {
  roleVisible.value = true;
}

const singleExpCheck = () => {
  expVisible.value = true;
}

const expSelect = (selection) => {
  if (selection) {
    deleteFlowAttar();
    bpmnFormData.value[bpmnFormData.value.userType] = selection.name;
    updateCustomElement('dataType', selection.dataType);
    updateCustomElement('expId', selection.id.toString());
    updateCustomElement(bpmnFormData.value.userType, selection.expression);
    handleSelectData("exp", selection.id);
  }
}

const userSelect = (selection) => {
  if (selection) {
    deleteFlowAttar();
    updateCustomElement('dataType', 'fixed');
    if (selection instanceof Array) {
      const userIds = selection.map(item => item.userId);
      const nickName = selection.map(item => item.nickName);
      bpmnFormData.value[bpmnFormData.value.userType] = nickName.join(',');
      updateCustomElement(bpmnFormData.value.userType, userIds.join(','));
      handleSelectData(bpmnFormData.value.userType, userIds);
    } else {
      bpmnFormData.value[bpmnFormData.value.userType] = selection.nickName;
      updateCustomElement(bpmnFormData.value.userType, selection.userId);
      handleSelectData(bpmnFormData.value.userType, selection.userId);
    }
  }
}

const roleSelect = (selection, name) => {
  if (selection && name) {
    deleteFlowAttar();
    bpmnFormData.value[bpmnFormData.value.userType] = name;
    updateCustomElement('dataType', 'fixed');
    updateCustomElement(bpmnFormData.value.userType, selection);
    handleSelectData(bpmnFormData.value.userType, selection);
  }
}

const handleSelectData = (key, value) => {
  for (let oldKey in selectData.value) {
    if (key !== oldKey) {
      selectData.value[oldKey] = null;
    } else {
      selectData.value[oldKey] = value;
    }
  }
}

const checkUserComplete = () => {
  userVisible.value = false;
  checkType.value = "";
}

const checkRoleComplete = () => {
  roleVisible.value = false;
}

const checkExpComplete = () => {
  expVisible.value = false;
}

const deleteFlowAttar = () => {
  delete modelerStore.element.businessObject[`dataType`]
  delete modelerStore.element.businessObject[`expId`]
  delete modelerStore.element.businessObject[`assignee`]
  delete modelerStore.element.businessObject[`candidateUsers`]
  delete modelerStore.element.businessObject[`candidateGroups`]
}

const unique = (arr, code) => {
  const res = new Map();
  return arr.filter((item) => !res.has(item[code]) && res.set(item[code], 1));
}

const updateElementExtensions = (properties) => {
  const extensions = modelerStore.moddle.create("bpmn:ExtensionElements", {
    values: otherExtensionList.value.concat([properties])
  });

  modelerStore.modeling.updateProperties(modelerStore.element, {
    extensionElements: extensions
  });
}

watch(
  () => props.id,
  (newVal) => {
    if (StrUtil.isNotBlank(newVal)) {
      resetTaskForm();
    }
  },
  { immediate: true }
)
</script>
