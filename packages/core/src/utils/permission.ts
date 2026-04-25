import auth from '@ruoyi/core/plugins/auth'

/**
 * 字符权限校验
 * @param {Array} value 校验值
 * @returns {Boolean}
 */
export function checkPermi(value: Array<string>) {
  if (value && value instanceof Array && value.length > 0) {
    if (!auth.hasPermiOr(value)) {
      return false
    }
    return true
  } else {
    console.error(`need roles! Like checkPermi="['system:user:add','system:user:edit']"`)
    return false
  }
}

/**
 * 角色权限校验
 * @param {Array} value 校验值
 * @returns {Boolean}
 */
export function checkRole(value: Array<string>) {
  if (value && value instanceof Array && value.length > 0) {
    if (!auth.hasRoleOr(value)) {
      return false
    }
    return true
  } else {
    console.error(`need roles! Like checkRole="['admin','editor']"`)
    return false
  }
}