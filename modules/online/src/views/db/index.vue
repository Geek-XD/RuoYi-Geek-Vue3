<script setup>
import { listDbColumn, listDbTable } from '@ruoyi/module-online/api/db';
import { reactive } from 'vue';
const total = ref(0);
const queryParams = ref({
    pageNum: 1,
    pageSize: 10,
})
const tables = ref([])
const columns = reactive({})

function readField(row, ...keys) {
    for (const key of keys) {
        if (row && row[key] !== undefined && row[key] !== null) {
            return row[key]
        }
    }
    return ''
}

function getList() {
    listDbTable(queryParams.value).then(res => {
        tables.value = res.rows
        total.value = res.total
    })
}

function collapseChange(name) {
    columns[name] = []
    listDbColumn(name).then(res => {
        columns[name] = res.rows
    })
}
function expandChange(row, expandedRows) {
    collapseChange(readField(row, 'TABLE_NAME', 'table_name', 'tableName'))
}
getList()
</script>

<template>
    <div class="app-container">
        <el-card shadow="never">
            <el-table :data="tables" border style="width: 100%" @expand-change="expandChange">
                <el-table-column type="expand">
                    <template #default="props">
                        <el-table :data="columns[readField(props.row, 'TABLE_NAME', 'table_name', 'tableName')]" border height="300">
                            <el-table-column label="COLUMN_NAME">
                                <template #default="scope">
                                    {{ readField(scope.row, 'COLUMN_NAME', 'column_name', 'columnName') }}
                                </template>
                            </el-table-column>
                            <el-table-column label="COLUMN_TYPE">
                                <template #default="scope">
                                    {{ readField(scope.row, 'COLUMN_TYPE', 'column_type', 'columnType') }}
                                </template>
                            </el-table-column>
                            <el-table-column label="COLUMN_COMMENT">
                                <template #default="scope">
                                    {{ readField(scope.row, 'COLUMN_COMMENT', 'column_comment', 'columnComment') }}
                                </template>
                            </el-table-column>
                        </el-table>
                    </template>
                </el-table-column>
                <el-table-column label="TABLE_NAME">
                    <template #default="scope">
                        {{ readField(scope.row, 'TABLE_NAME', 'table_name', 'tableName') }}
                    </template>
                </el-table-column>
                <el-table-column label="TABLE_COLLATION">
                    <template #default="scope">
                        {{ readField(scope.row, 'TABLE_COLLATION', 'table_collation', 'tableCollation') }}
                    </template>
                </el-table-column>
                <el-table-column label="TABLE_COMMENT">
                    <template #default="scope">
                        {{ readField(scope.row, 'TABLE_COMMENT', 'table_comment', 'tableComment') }}
                    </template>
                </el-table-column>
                <el-table-column label="CREATE_TIME">
                    <template #default="scope">
                        {{ readField(scope.row, 'CREATE_TIME', 'create_time', 'createTime') }}
                    </template>
                </el-table-column>
                <el-table-column label="UPDATE_TIME">
                    <template #default="scope">
                        {{ readField(scope.row, 'UPDATE_TIME', 'update_time', 'updateTime') }}
                    </template>
                </el-table-column>
            </el-table>
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>
    </div>
</template>
