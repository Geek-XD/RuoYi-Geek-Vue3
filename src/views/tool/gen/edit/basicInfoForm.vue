<script setup lang="ts">
import { ref } from 'vue';
import { GenTable } from '.';
defineProps<{
  info: GenTable
}>();
// 表单校验
const rules = ref({
  tableName: [{ required: true, message: "请输入表名称", trigger: "blur" }],
  tableAlias: [{ required: true, message: "请输入表别名", trigger: "blur" }],
  tableComment: [{ required: true, message: "请输入表描述", trigger: "blur" }],
  className: [{ required: true, message: "请输入实体类名称", trigger: "blur" }],
  functionAuthor: [{ required: true, message: "请输入作者", trigger: "blur" }]
});


</script>
<template>
  <div>
    <el-form ref="basicInfoForm" :model="info" :rules="rules" label-width="150px">
      <el-row>
        <el-col :span="6">
          <el-form-item label="表名称" prop="tableName">
            <el-input placeholder="请输入仓库名称" v-model="info.tableName" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="表别名" prop="tableAlias">
            <el-input placeholder="请输入仓库名称" v-model="info.tableAlias" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="表描述" prop="tableComment">
            <el-input placeholder="请输入" v-model="info.tableComment" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="实体类名称" prop="className">
            <el-input placeholder="请输入" v-model="info.className" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="作者" prop="functionAuthor">
            <el-input placeholder="请输入" v-model="info.functionAuthor" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" :rows="3" v-model="info.remark"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
