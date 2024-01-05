import { defineStore } from "pinia";
type DictKey = string | null;
type DictValue = {
  createBy: string,
  createTime: string,
  updateBy: string|null,
  updateTime: string|null,
  remark: string|null,
  dictCode: string,
  dictSort: number,
  dictLabel: string,
  dictValue: string,
  dictType: string,
  cssClass: null|string,
  listClass: 'primary'| 'success'| 'warning'| 'danger'| 'info'| 'text',
  isDefault: "N"|"Y",
  status: "0"|"1",
  default: boolean
}
const useDictStore = defineStore(
  'dict',
  {
    state: () => ({
      dict: new Array<{key: DictKey, value: DictValue}>()
    }),
    actions: {
      // 获取字典
      getDict(_key: DictKey) {
        if (_key == null && _key == "") {
          return null;
        }
        try {
          for (let i = 0; i < this.dict.length; i++) {
            if (this.dict[i].key == _key) {
              return this.dict[i].value;
            }
          }
        } catch (e) {
          return null;
        }
      },
      // 设置字典
      setDict(_key: DictKey, value:DictValue) {
        if (_key !== null && _key !== "") {
          this.dict.push({
            key: _key,
            value: value
          });
        }
      },
      // 删除字典
      removeDict(_key: DictKey) {
        var bln = false;
        try {
          for (let i = 0; i < this.dict.length; i++) {
            if (this.dict[i].key == _key) {
              this.dict.splice(i, 1);
              return true;
            }
          }
        } catch (e) {
          bln = false;
        }
        return bln;
      },
      // 清空字典
      cleanDict() {
        this.dict = new Array();
      },
      // 初始字典
      initDict() {
      }
    }
  })

export default useDictStore
