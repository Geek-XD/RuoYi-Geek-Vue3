<script setup lang="ts">
import { getGenTable, updateGenTable } from "@/api/tool/gen";
import { onMounted, ref, useTemplateRef } from "vue";
import basicInfoForm from "./basicInfoForm.vue";
import genInfoForm from "./genInfoForm.vue";
import joinTableForm from "./joinTableForm.vue";
import editTableForm from "./editTableForm.vue";
import { useRoute } from "vue-router";
import { modal, tab } from "@/plugins";
import { GenJoinTable, GenTable, GenTableColumn } from ".";
import { FormInstance } from "element-plus";
const route = useRoute();
const activeName = ref("columnInfo");
const tables = ref<GenTable[]>([]);
const tableDict = ref({});
const joinTablesMate = ref<GenJoinTable[]>([]);
const columns = ref<GenTableColumn[]>([]);
const info = ref<GenTable>(new GenTable());

function getFormPromise(form: FormInstance) {
  return new Promise((resolve, reject) => {
    form.validate((res, error) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}
const basicInfo = useTemplateRef("basicInfo");
const genInfo = useTemplateRef("genInfo");
/** 提交按钮 */
function submitForm() {
  Promise.all([
    basicInfo.value!.$refs.basicInfoForm as FormInstance,
    genInfo.value!.$refs.genInfoForm as FormInstance
  ].map(getFormPromise)).then(res => {
    const validateResult = res.every(item => !!item);
    if (validateResult) {
      const genTable = Object.assign({}, info.value);
      genTable.columns = columns.value;
      genTable.params = {
        treeCode: info.value.treeCode,
        treeName: info.value.treeName,
        treeParentCode: info.value.treeParentCode,
        parentMenuId: info.value.parentMenuId
      };
      updateGenTable({
        table: genTable,
        columns: columns.value,
        joinTables: tables.value,
        joinColumns: [],
        joinTablesMate: joinTablesMate.value
      }).then(res => {
        modal.msgSuccess(res.msg);
        if (res.code === 200) {
          close();
        }
      });
    } else {
      modal.msgError("表单校验未通过，请重新检查提交内容");
    }
  }).catch(error => {
    for (const errKey in error) {
      for (const err in error[errKey]) {
        modal.msgError(error[errKey][err].message);
      }
    }
  });
}

onMounted(() => {
  const tableId = route.params && route.params.tableId;
  if (tableId) {
    // 获取表详细信息
    getGenTable(tableId).then(res => {
      columns.value = res.data.columns;
      info.value = res.data.table;
      tables.value = res.data.joinTables;
      joinTablesMate.value = res.data.joinTablesMate;
    });
  }
})

function close() {
  const obj = { path: "/tool/gen", query: { t: Date.now(), pageNum: route.query.pageNum } };
  tab.closeOpenPage(obj);
}
</script>
<template>
  <el-card>
    <el-tabs v-model="activeName">
      <el-tab-pane label="基本信息" name="basic">
        <basic-info-form ref="basicInfo" :info="info" :tables="tables" />
      </el-tab-pane>
      <el-tab-pane label="关联表" name="joinTable">
        <join-table-form ref="joinTable" :info="info" :tables="tables" v-model:joins="joinTablesMate"
          v-model="tableDict" />
      </el-tab-pane>
      <el-tab-pane label="字段信息" name="columnInfo">
        <edit-table-form ref="editTable" v-model:info="info" v-model:columns="columns" v-model:tables="tables" />
      </el-tab-pane>
      <el-tab-pane label="生成信息" name="genInfo">
        <gen-info-form ref="genInfo" :info="info" :tables="tables" />
      </el-tab-pane>
    </el-tabs>
    <el-form label-width="100px">
      <div style="text-align: center;margin-left:-100px;margin-top:10px;">
        <el-button type="primary" @click="submitForm()">提交</el-button>
        <el-button @click="close()">返回</el-button>
      </div>
    </el-form>
  </el-card>
</template>