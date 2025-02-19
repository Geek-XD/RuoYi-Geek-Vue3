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
            <el-select v-model="selectTables" multiple value-key="tableId" placeholder="" clearable filterable remote
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
      <el-form v-for="(join, index) in joins" :key="index" label-width="150px"
        style="margin: 1px;padding: 1px; border: 1px solid #dcdfe6;">
        <el-row :gutter="10">
          <el-col :span="6">
            <el-form-item label="左表">
              <el-select v-model="join.leftTableId" @change="(val) => handleMainTableChange(val, index)"
                placeholder="选择关联表">
                <el-option v-for="table in selectTables" :key="table.tableId" :label="table.tableName"
                  :value="table.tableId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="左表别名">
              <el-input v-model="join.leftTableAlias" placeholder="请输入左表别名" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="左表关联键">
              <el-select v-model="join.leftTableFk" placeholder="选择左表关联键">
                <el-option v-for="column in tableDict[join.leftTableId]?.columns || []" :key="column.columnId"
                  :label="column.columnName" :value="column.columnId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="关联类型">
              <el-select v-model="join.joinType" placeholder="选择关联类型">
                <el-option v-for="type in ['left', 'right', 'inner']" :key="type" :label="type" :value="type" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="右表">
              <el-select v-model="join.rightTableId" @change="(val) => handleJoinTableChange(val, index)"
                placeholder="选择右表">
                <el-option v-for="table in selectTables" :key="table.tableId" :label="table.tableName"
                  :value="table.tableId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="右表别名">
              <el-input v-model="join.rightTableAlias" placeholder="请输入右表别名" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="右表关联键">
              <el-select v-model="join.rightTableFk" placeholder="选择右表关联键">
                <el-option v-for="column in tableDict[join.rightTableId]?.columns || []" :key="column.columnId"
                  :label="column.columnName" :value="column.columnId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="关联顺序">
              <el-input v-model="join.orderNum" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="新表">
              <el-select v-model="join.newTableId" value-key="tableId" placeholder="">
                <el-option v-for="item in [tableDict[join.leftTableId], tableDict[join.rightTableId]]"
                  :key="item?.tableId" :label="item?.tableName" :value="item?.tableId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="添加字段">
              <el-select v-model="join.joinColumns" multiple value-key="tableId" placeholder="">
                <el-option v-for="column in tableDict[join.newTableId]?.columns || []" :key="column.columnId"
                  :label="column.columnName" :value="column.columnName" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6" style="display: flex;  justify-content: center;">
            <el-button style="width: 50%;height: 50%;" type="danger" @click="() => removeJoin(index)">删除</el-button>
          </el-col>
        </el-row>

      </el-form>
    </el-form>
  </div>
</template>

<script setup>
import { listTable, getGenTable } from "@/api/tool/gen";
import { onMounted, reactive, ref, watch } from 'vue'; // import ref to be used for value and options

const props = defineProps({
  info: {
    type: Object,
    default: null
  }
});
const joins = defineModel("joins", { type: Array, default: () => [] });
const tables = defineModel("tables", { type: Array, default: () => [] });
const tableDict = defineModel("tableDict", { type: Object, default: () => ({}) });
async function getTable(tableId) {
  if (tableDict.value[tableId]) return tableDict.value[tableId]
  else {
    const table = await getGenTable(tableId).then(res => res.data.table);
    tableDict.value[tableId] = table;
    return table;
  }
}
const options = ref([])
watch(tables, () => {
  tables.value?.forEach(item => {
    tableDict.value[item.tableId] = item
  });
  options.value = tables.value?.map(item => ({ value: item, label: item.tableName }));
  selectTables.value = tables.value;
})
const selectTables = ref([])
// 表单校验
const rules = ref({
  tableName: [{ required: true, message: "请输入表名称", trigger: "blur" }],
  tableComment: [{ required: true, message: "请输入表描述", trigger: "blur" }],
  className: [{ required: true, message: "请输入实体类名称", trigger: "blur" }],
  functionAuthor: [{ required: true, message: "请输入作者", trigger: "blur" }]
});

const loading = ref(false);
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
    options.value = tables.value.map(table => ({ value: table.tableId, label: table.tableName }));
  }
}
// 添加关联关系
const addJoin = () => {
  joins.value.push({
    tableId: props.info.tableId,
    rightTableId: '',
    leftTableId: props.info.tableId,
    leftTableAlias: props.info.tableAlias,
    rightTableAlias: '',
    rightTableFk: null,
    leftTableFk: null,
    joinType: 'left',
    joinColumns: [],
  });
};

// 删除关联关系
const removeJoin = (index) => {
  joins.value.splice(index, 1);
};


// 处理关联表选择变化
const handleMainTableChange = async (tableId, index) => {
  joins.value[index].tableId = props.info.tableId;
  const table = await getTable(tableId);
  joins.value[index].leftTableAlias = table.tableAlias;
  joins.value[index].leftTableId = table.tableId;
};
// 处理关联表选择变化
const handleJoinTableChange = async (tableId, index) => {
  joins.value[index].tableId = props.info.tableId;
  const table = await getTable(tableId);
  joins.value[index].rightTableAlias = table.tableAlias;
  joins.value[index].rightTableId = table.tableId;

};

</script>
