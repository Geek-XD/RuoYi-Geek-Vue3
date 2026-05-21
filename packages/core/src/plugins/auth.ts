import usePermissionStore from '@ruoyi/core/store/modules/permission'

export default {
  /**
   * 验证用户是否具备某权限
   * @param permission 权限符
   */
  hasPermi(permission: string): boolean {
    return permission.length > 0 && usePermissionStore().hasAnyPermission([permission]);
  },
  /**
   * 验证用户是否含有指定权限，只需包含其中一个
   * @param permissions 权限符数组
   */
  hasPermiOr(permissions: Array<string>): boolean {
    return usePermissionStore().hasAnyPermission(permissions)
  },
  /**
   * 验证用户是否含有指定权限，必须全部拥有
   * @param permissions 权限符数组
   */
  hasPermiAnd(permissions: Array<string>): boolean {
    return usePermissionStore().hasAllPermissions(permissions)
  },
  /**
   * 验证用户是否具备某角色
   * @param role 角色
   */
  hasRole(role: string): boolean {
    return role.length > 0 && usePermissionStore().hasAnyRole([role]);
  },
  /**
   * 验证用户是否含有指定角色，只需包含其中一个
   * @param roles 角色数组
   */
  hasRoleOr(roles: Array<string>): boolean {
    return usePermissionStore().hasAnyRole(roles)
  },
  /**
   * 验证用户是否含有指定角色，必须全部拥有
   * @param roles 角色数组
   */
  hasRoleAnd(roles: Array<string>): boolean {
    return usePermissionStore().hasAllRoles(roles)
  },
};
