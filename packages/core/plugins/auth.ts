import useUserStore from '@ruoyi/core/store/modules/user'
import { hasAnyPermission, hasAnyRole, hasAllPermissions, hasAllRoles } from '@ruoyi/core/utils/permission'

function authPermission(permission: string): boolean {
  return permission.length > 0 && hasAnyPermission(useUserStore().permissions, [permission])
}

function authRole(role: string): boolean {
  return role.length > 0 && hasAnyRole(useUserStore().roles, [role])
}

export default {
  /**
   * 验证用户是否具备某权限
   * @param permission 权限符
   * @returns
   */
  hasPermi(permission: string): boolean {
    return authPermission(permission);
  },
  /**
   * 验证用户是否含有指定权限，只需包含其中一个
   * @param permissions 权限符数组
   * @returns
   */
  hasPermiOr(permissions: Array<string>): boolean {
    return hasAnyPermission(useUserStore().permissions, permissions)
  },
  /**
   * 验证用户是否含有指定权限，必须全部拥有
   * @param permissions 权限符数组
   * @returns
   */
  hasPermiAnd(permissions: Array<string>): boolean {
    return hasAllPermissions(useUserStore().permissions, permissions)
  },
  /**
   * 验证用户是否具备某角色
   * @param role 角色
   * @returns
   */
  hasRole(role: string): boolean {
    return authRole(role);
  },
  /**
   * 验证用户是否含有指定角色，只需包含其中一个
   * @param roles 角色数组
   * @returns
   */
  hasRoleOr(roles: Array<string>): boolean {
    return hasAnyRole(useUserStore().roles, roles)
  },
  /**
   * 验证用户是否含有指定角色，必须全部拥有
   * @param roles 角色数组
   * @returns
   */
  hasRoleAnd(roles: Array<string>): boolean {
    return hasAllRoles(useUserStore().roles, roles)
  },
};
