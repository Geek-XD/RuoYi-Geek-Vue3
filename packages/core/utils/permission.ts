import useUserStore from '@ruoyi/core/store/modules/user'

const ALL_PERMISSION = '*:*:*'
const SUPER_ADMIN = 'admin'

export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (userPermissions.includes(ALL_PERMISSION)) return true
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (userPermissions.includes(ALL_PERMISSION)) return true
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (userRoles.includes(SUPER_ADMIN)) return true
  return requiredRoles.some(role => userRoles.includes(role))
}

export function hasAllRoles(userRoles: string[], requiredRoles: string[]): boolean {
  if (userRoles.includes(SUPER_ADMIN)) return true
  return requiredRoles.every(role => userRoles.includes(role))
}

/**
 * 字符权限校验
 * @param {Array} value 校验值
 * @returns {Boolean}
 */
export function checkPermi(value: Array<string>) {
  if (value && value instanceof Array && value.length > 0) {
    return hasAnyPermission(useUserStore().permissions, value)
  } else {
    console.error(`need permissions! Like checkPermi="['system:user:add','system:user:edit']"`)
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
    return hasAnyRole(useUserStore().roles, value)
  } else {
    console.error(`need roles! Like checkRole="['admin','editor']"`)
    return false
  }
}
