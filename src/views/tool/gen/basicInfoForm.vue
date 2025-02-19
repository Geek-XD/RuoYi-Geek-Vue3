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
    <el-form label-width="150px">

      <el-row>
        <el-col :span="16">
          <el-form-item label="添加可选择关联表">
            <el-select v-model="tables" multiple value-key="tableId" placeholder="" clearable filterable remote
              :remote-method="remoteMethod" :loading="loading">
              <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item>
            <el-button type="primary" @click="addJoin">添加关联关系</el-button>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form v-for="(join, index) in joins" :key="index" label-width="150px">
        <el-row>
          <el-col :span="22">
            <el-row :gutter="10">
              <el-col :span="8">
                <el-form-item label="主表">
                  <el-select v-model="join.mainTableId" value-key="tableId"
                    @change="(val) => handleMainTableChange(val, index)" placeholder="选择关联表">
                    <el-option v-for="table in tables" :key="table.tableId" :label="table.tableName"
                      :value="table.tableId" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="主表别名">
                  <el-input v-model="join.mainTableAlias" placeholder="请输入关联表别名" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="主表关联键">
                  <el-select v-model="join.mainTableFk" value-key="columnId" placeholder="选择主表关联键">
                    <el-option v-for="column in join.mainColumns" :key="column.columnId" :label="column.columnName"
                      :value="column.columnId" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="关联表">
                  <el-select v-model="join.joinTableId" value-key="tableId"
                    @change="(val) => handleJoinTableChange(val, index)" placeholder="选择关联表">
                    <el-option v-for="table in tables" :key="table.tableId" :label="table.tableName"
                      :value="table.tableId" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="关联表别名">
                  <el-input v-model="join.joinTableAlias" placeholder="请输入关联表别名" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="关联表外键">
                  <el-select v-model="join.joinTableFk" value-key="columnId" placeholder="选择关联表外键">
                    <el-option v-for="column in join.joinColumns" :key="column.columnId" :label="column.columnName"
                      :value="column.columnId" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-col>
          <el-col :span="2">
            <div style="display: flex;align-items: center;justify-content: center;height: 100%;">
              <el-button style="width: 50%;height: 50%;" type="danger" @click="() => removeJoin(index)">删除</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-form>
  </div>
</template>

<script setup>
import { listTable, getGenTable } from "@/api/tool/gen";
import { ref } from 'vue'; // import ref to be used for value and options

const props = defineProps({
  info: {
    type: Object,
    default: null
  },
  tables: {
    type: Array,
    default: null
  }
});
const joins = defineModel("joins", { type: Array, default: () => [] });
// 表单校验
const rules = ref({
  tableName: [{ required: true, message: "请输入表名称", trigger: "blur" }],
  tableComment: [{ required: true, message: "请输入表描述", trigger: "blur" }],
  className: [{ required: true, message: "请输入实体类名称", trigger: "blur" }],
  functionAuthor: [{ required: true, message: "请输入作者", trigger: "blur" }]
});
const options = ref([]);
const loading = ref(false);
const tables = ref([]);
const remoteMethod = (query) => {
  if (query) {
    loading.value = true;
    listTable({ tableName: query }).then((response) => {
      loading.value = false;
      options.value = response.rows.map((item) => {
        return { value: item, label: item.tableName };
      });
    });
  } else {
    options.value = [];
  }
}
// 添加关联关系
const addJoin = () => {
  joins.value.push({
    joinTable: null,
    joinTableId: '',
    mainTableId: props.info.tableId,
    mainTableAlias: props.info.tableAlias,
    joinTableAlias: '',
    joinColumns: [],
    joinTableFk: null,
    mainTableFk: null
  });
};

// 删除关联关系
const removeJoin = (index) => {
  joins.value.splice(index, 1);
};

// 处理关联表选择变化
const handleMainTableChange = async (tableId, index) => {
  joins.value[index].tableId = props.info.tableId;
  const table = await getGenTable(tableId).then(res => res.data.table);
  if (table) {
    // 设置关联表详细信息
    joins.value[index].mainTableAlias = table.tableAlias;
    joins.value[index].mainTableId = table.tableId;
    joins.value[index].mainColumns = table.columns || [];
  } else {
    joins.value[index].mainColumns = [];
  }
  console.log(joins.value[index].mainColumns);
};
// 处理关联表选择变化
const handleJoinTableChange = async (tableId, index) => {
  joins.value[index].tableId = props.info.tableId;
  const table = await getGenTable(tableId).then(res => res.data.table);
  if (table) {
    // 设置关联表详细信息
    joins.value[index].joinTableAlias = table.tableAlias;
    joins.value[index].joinTableId = table.tableId;
    joins.value[index].joinColumns = table.columns || [];
  } else {
    joins.value[index].joinColumns = [];
  }
};

</script>
