/**
* v-hasRole 角色权限处理
* Copyright (c) 2019 ruoyi
*/

import auth from '@ruoyi/core/plugins/auth'
import type { Directive } from "vue";
const vHasRole: Directive = {
  mounted(el, binding, vnode) {
    const { value } = binding

    if (value && value instanceof Array && value.length > 0) {
      if (!auth.hasRoleOr(value)) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(`请设置角色权限标签值`)
    }
  }
}

export default vHasRole;