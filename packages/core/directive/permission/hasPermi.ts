/**
* v-hasPermi 操作权限处理
* Copyright (c) 2019 ruoyi
*/

import useUserStore from '@ruoyi/core/store/modules/user'
import { hasAnyPermission } from '@ruoyi/core/utils/permission'

import type { Directive } from "vue";
const vHasPermi: Directive = {
  mounted(el, binding, vnode) {
    const { value } = binding

    if (value && value instanceof Array && value.length > 0) {
      const hasPermissions = hasAnyPermission(useUserStore().permissions, value)

      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(`请设置操作权限标签值`)
    }
  }
}
export default vHasPermi
