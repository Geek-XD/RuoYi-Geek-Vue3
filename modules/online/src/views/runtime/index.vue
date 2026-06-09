<script setup lang="ts">
import { getRuntimePage } from '@ruoyi/module-online/api/page'
import { getDicts } from '@ruoyi/core/api/dict'
import request from '@ruoyi/core/utils/request'
import { useRoute } from 'vue-router'
import type { DictValue } from '@ruoyi/core/types/dict'
import type { FormInstance, FormRules } from 'element-plus'

type FieldSpec = {
  field: string
  column: string
  label: string
  javaType: string
  htmlType: string
  queryType: string
  dictType?: string
  required: boolean
  primaryKey: boolean
  insertable: boolean
  editable: boolean
}

type ApiConfig = {
  listPath: string
  getPath: string
  addPath: string
  updatePath: string
  deletePath: string
}

const route = useRoute()
const { proxy } = getCurrentInstance()!
const formRef = ref<FormInstance>()

const loading = ref(false)
const saving = ref(false)
const showSearch = ref(true)
const open = ref(false)
const title = ref('')
const rows = ref<any[]>([])
const total = ref(0)
const ids = ref<Array<string | number>>([])
const single = ref(true)
const multiple = ref(true)
const pageName = ref('在线页面')
const queryFields = ref<FieldSpec[]>([])
const tableFields = ref<FieldSpec[]>([])
const formFields = ref<FieldSpec[]>([])
const apiConfig = ref<ApiConfig | null>(null)
const primaryKeyField = ref('id')
const queryParams = ref<Record<string, any>>({ pageNum: 1, pageSize: 10 })
const form = ref<Record<string, any>>({})
const dictOptions = ref<Record<string, DictValue[]>>({})

const isEditMode = computed(() => form.value[primaryKeyField.value] != null)

const visibleFormFields = computed(() => {
  return formFields.value.filter(field => {
    if (field.primaryKey) {
      return isEditMode.value
    }
    return isEditMode.value ? field.editable : field.insertable
  })
})

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}
  visibleFormFields.value.forEach(field => {
    if (!field.required) {
      return
    }
    const trigger = field.htmlType === 'select' || field.htmlType === 'radio' || field.htmlType === 'checkbox' || field.htmlType === 'date' || field.htmlType === 'datetime'
      ? 'change'
      : 'blur'
    rules[field.field] = [{
      required: true,
      message: `请填写${field.label}`,
      trigger,
      type: field.htmlType === 'checkbox' ? 'array' : 'string'
    }]
  })
  return rules
})

function parseJson<T>(text: string, fallback: T): T {
  return text ? JSON.parse(text) as T : fallback
}

function getPlaceholder(field: FieldSpec) {
  return '请输入' + field.label
}

function getDateValueFormat(field: FieldSpec) {
  return field.htmlType === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
}

function getBetweenFieldBounds(field: FieldSpec) {
  const suffix = field.field.charAt(0).toUpperCase() + field.field.slice(1)
  return {
    beginKey: `begin${suffix}`,
    endKey: `end${suffix}`
  }
}

function getFieldOptions(field: FieldSpec) {
  return field.dictType ? (dictOptions.value[field.dictType] ?? []) : []
}

function normalizeCheckboxValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string' && value.length > 0) {
    return value.split(',').filter(Boolean)
  }
  return []
}

function resetFormData() {
  const next: Record<string, any> = {}
  formFields.value.forEach(field => {
    next[field.field] = field.htmlType === 'checkbox' ? [] : null
  })
  form.value = next
}

function hydrateFormData() {
  formFields.value.forEach(field => {
    if (field.htmlType === 'checkbox') {
      form.value[field.field] = normalizeCheckboxValue(form.value[field.field])
    }
  })
}

function normalizeSubmitValue(field: FieldSpec, value: unknown) {
  if (field.htmlType === 'checkbox') {
    return Array.isArray(value) ? value.join(',') : value
  }
  return value
}

function buildSubmitForm() {
  const payload: Record<string, any> = { ...form.value }
  formFields.value.forEach(field => {
    payload[field.field] = normalizeSubmitValue(field, payload[field.field])
  })
  return payload
}

function getRequestPath(path: string, row?: Record<string, any>) {
  return path.replace(/\{(.*?)\}/g, (_, key) => String((row ?? form.value)[key] ?? ''))
}

function handleSelectionChange(selection: Record<string, any>[]) {
  ids.value = selection.map(item => item[primaryKeyField.value])
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  resetFormData()
  open.value = true
  title.value = '新增' + pageName.value
}

function resetQuery() {
  const pageNum = queryParams.value.pageNum
  const pageSize = queryParams.value.pageSize
  queryParams.value = { pageNum, pageSize }
  queryFields.value.forEach(field => {
    queryParams.value[field.field] = field.htmlType === 'checkbox' ? [] : field.queryType === 'BETWEEN' ? [] : null
  })
  return handleQuery()
}

function handleQuery() {
  queryParams.value.pageNum = 1
  return fetchList()
}

async function loadDictOptions(fields: FieldSpec[]) {
  const dictTypes = Array.from(new Set(fields.map(field => field.dictType).filter(Boolean))) as string[]
  if (dictTypes.length === 0) {
    dictOptions.value = {}
    return
  }
  const entries = await Promise.all(dictTypes.map(async dictType => {
    const response = await getDicts(dictType)
    return [dictType, response.data.map(item => ({
      label: item.dictLabel,
      value: item.dictValue,
      elTagType: item.listClass,
      elTagClass: item.cssClass
    }))] as const
  }))
  dictOptions.value = Object.fromEntries(entries)
}

async function loadPage() {
  const pageCode = route.params.pageCode as string
  const response = await getRuntimePage(pageCode)
  const page = response.data
  pageName.value = page.pageName
  queryFields.value = parseJson<FieldSpec[]>(page.querySchemaJson, [])
  tableFields.value = parseJson<FieldSpec[]>(page.tableSchemaJson, [])
  formFields.value = parseJson<FieldSpec[]>(page.formSchemaJson, [])
  apiConfig.value = parseJson<ApiConfig | null>(page.apiConfigJson, null)
  const pk = formFields.value.find(item => item.primaryKey)
  primaryKeyField.value = pk?.field ?? 'id'
  queryParams.value = { pageNum: 1, pageSize: 10 }
  queryFields.value.forEach(field => {
    queryParams.value[field.field] = field.htmlType === 'checkbox' ? [] : field.queryType === 'BETWEEN' ? [] : null
  })
  await loadDictOptions([...queryFields.value, ...tableFields.value, ...formFields.value])
  resetFormData()
}

function buildListRequestParams() {
  const params: Record<string, any> = {
    pageNum: queryParams.value.pageNum,
    pageSize: queryParams.value.pageSize,
    params: {}
  }
  queryFields.value.forEach(field => {
    const value = queryParams.value[field.field]
    if (field.queryType === 'BETWEEN') {
      const { beginKey, endKey } = getBetweenFieldBounds(field)
      const values = Array.isArray(value) ? value : []
      if (values[0]) {
        params.params[beginKey] = values[0]
      }
      if (values[1]) {
        params.params[endKey] = values[1]
      }
      return
    }
    if (field.htmlType === 'checkbox') {
      if (Array.isArray(value) && value.length > 0) {
        params[field.field] = value.join(',')
      }
      return
    }
    if (value !== null && value !== undefined && value !== '') {
      params[field.field] = value
    }
  })
  if (Object.keys(params.params).length === 0) {
    delete params.params
  }
  return params
}

async function fetchList() {
  if (!apiConfig.value) return
  loading.value = true
  try {
    const response = await request({
      url: '/online/api' + apiConfig.value.listPath,
      method: 'get',
      params: buildListRequestParams()
    })
    rows.value = response.rows ?? []
    total.value = Number(response.total ?? 0)
  } finally {
    loading.value = false
  }
}

async function handleEdit(row?: Record<string, any>) {
  if (!apiConfig.value) return
  const current = row ?? rows.value.find(item => item[primaryKeyField.value] === ids.value[0])
  if (!current) return
  const response = await request({
    url: '/online/api' + getRequestPath(apiConfig.value.getPath, current),
    method: 'get'
  })
  form.value = { ...response.data }
  hydrateFormData()
  open.value = true
  title.value = '修改' + pageName.value
}

async function submitForm() {
  if (!apiConfig.value) return
  if (formRef.value) {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) {
      return
    }
  }
  saving.value = true
  try {
    const payload = buildSubmitForm()
    if (form.value[primaryKeyField.value] != null) {
      await request({ url: '/online/api' + apiConfig.value.updatePath, method: 'put', data: payload })
      proxy?.$modal.msgSuccess('修改成功')
    } else {
      await request({ url: '/online/api' + apiConfig.value.addPath, method: 'post', data: payload })
      proxy?.$modal.msgSuccess('新增成功')
    }
    open.value = false
    await fetchList()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row?: Record<string, any>) {
  if (!apiConfig.value) return
  const current = row ?? rows.value.find(item => item[primaryKeyField.value] === ids.value[0])
  if (!current) return
  await proxy?.$modal.confirm('是否确认删除当前数据项？')
  await request({
    url: '/online/api' + getRequestPath(apiConfig.value.deletePath, current),
    method: 'delete'
  })
  proxy?.$modal.msgSuccess('删除成功')
  await fetchList()
}

function displayValue(row: Record<string, any>, field: FieldSpec) {
  const value = row[field.field]
  if (!field.dictType) {
    return value
  }
  if (field.htmlType === 'checkbox') {
    const selected = normalizeCheckboxValue(value)
    return getFieldOptions(field)
      .filter(option => selected.includes(option.value))
      .map(option => option.label)
      .join('、')
  }
  return getFieldOptions(field).find(option => option.value === value)?.label ?? value
}

onMounted(async () => {
  await loadPage()
  await fetchList()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" body-class="search-card">
      <el-form :model="queryParams" inline v-show="showSearch" label-width="100px">
        <el-form-item v-for="field in queryFields" :key="field.field" :label="field.label">
          <el-select v-if="field.htmlType === 'select' || field.htmlType === 'radio'" v-model="queryParams[field.field]" :placeholder="getPlaceholder(field)" clearable style="width: 100%">
            <el-option v-for="option in getFieldOptions(field)" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <el-checkbox-group v-else-if="field.htmlType === 'checkbox'" v-model="queryParams[field.field]">
            <el-checkbox v-for="option in getFieldOptions(field)" :key="option.value" :label="option.value">{{ option.label }}</el-checkbox>
          </el-checkbox-group>
          <el-date-picker v-else-if="field.queryType === 'BETWEEN'" v-model="queryParams[field.field]" type="daterange" :value-format="getDateValueFormat(field)" start-placeholder="开始时间" end-placeholder="结束时间" clearable style="width: 100%" />
          <el-date-picker v-else-if="field.htmlType === 'date' || field.htmlType === 'datetime'" v-model="queryParams[field.field]" :type="field.htmlType === 'datetime' ? 'datetime' : 'date'" :value-format="getDateValueFormat(field)" clearable style="width: 100%" />
          <el-input v-else v-model="queryParams[field.field]" :type="field.htmlType === 'textarea' ? 'textarea' : 'text'" :placeholder="getPlaceholder(field)" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt10">
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="success" plain icon="Edit" :disabled="single" @click="() => handleEdit()">修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="() => handleDelete()">删除</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="fetchList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="rows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-for="field in tableFields" :key="field.field" :label="field.label" :prop="field.field" align="center">
          <template #default="scope">
            <dict-tag v-if="field.dictType && field.htmlType !== 'checkbox'" :options="getFieldOptions(field)" :value="scope.row[field.field]" />
            <span v-else>{{ displayValue(scope.row, field) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="160">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleEdit(scope.row)">修改</el-button>
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="fetchList" />
    </el-card>

      <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item v-for="field in visibleFormFields" :key="field.field" :label="field.label" :prop="field.field" :required="field.required">
          <el-select v-if="field.htmlType === 'select'" v-model="form[field.field]" :placeholder="getPlaceholder(field)" clearable style="width: 100%">
            <el-option v-for="option in getFieldOptions(field)" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <el-radio-group v-else-if="field.htmlType === 'radio'" v-model="form[field.field]">
            <el-radio v-for="option in getFieldOptions(field)" :key="option.value" :label="option.value">{{ option.label }}</el-radio>
          </el-radio-group>
          <el-checkbox-group v-else-if="field.htmlType === 'checkbox'" v-model="form[field.field]">
            <el-checkbox v-for="option in getFieldOptions(field)" :key="option.value" :label="option.value">{{ option.label }}</el-checkbox>
          </el-checkbox-group>
          <el-date-picker v-else-if="field.htmlType === 'date' || field.htmlType === 'datetime'" v-model="form[field.field]" :type="field.htmlType === 'datetime' ? 'datetime' : 'date'" :value-format="getDateValueFormat(field)" style="width: 100%" />
          <image-upload v-else-if="field.htmlType === 'imageUpload'" v-model="form[field.field]" />
          <file-upload v-else-if="field.htmlType === 'fileUpload'" v-model="form[field.field]" />
          <editor v-else-if="field.htmlType === 'editor'" v-model="form[field.field]" />
          <el-input v-else v-model="form[field.field]" :type="field.htmlType === 'textarea' ? 'textarea' : 'text'" :placeholder="getPlaceholder(field)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="saving" @click="submitForm">确 定</el-button>
          <el-button @click="open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
