import { getGenTable, updateGenTable } from "@ruoyi/module-gen/api/gen";
import { modal } from "@ruoyi/core/plugins";
import { createGlobalState } from "@vueuse/core";
import { ref } from "vue";
import { GenColumn, GenJoin, GenTable } from "../types";



export const genTableState = createGlobalState(() => {
  const info = ref<GenTable>(new GenTable());
  const tables = ref<GenTable[]>([]);
  const joins = ref<GenJoin[]>([]);
  const columns = ref<GenColumn[]>([]);
  const tableDict = ref<any>({});

  const initGenTableVo = (tableId: string) => {
    getGenTable(tableId).then(res => {
      columns.value = res.data.columns;
      info.value = res.data.table;
      tables.value = res.data.joinTables;
      joins.value = res.data.joinTablesMate;
    });
  }
  const updateGenTableVo = () => {
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
      joinTablesMate: joins.value
    }).then(res => {
      modal.msgSuccess(res.msg);
      if (res.code === 200) {
        close();
      }
    });
  }
  return { info, tables, joins, columns, tableDict, initGenTableVo, updateGenTableVo };
})