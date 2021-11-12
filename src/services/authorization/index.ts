export const CasbinService = (): IAuthorizationService => {
  const addRoleToUser = async ({
    userId,
    scope,
    role,
  }: AddRoleToUserArgs): Promise<true | AuthorizationError> => {
    return true
  }

  const addPermissionToRole = async ({
    role,
    scope,
    permission,
  }: AddPermissionToRoleArgs): Promise<true | AuthorizationError> => {
    return true
  }

  const checkPermission = async ({
    userId,
    resourceId,
    permission,
  }: CheckPermissionArgs): Promise<true | AuthorizationError> => {
    return true
  }
  return {
    addRoleToUser,
    addPermissionToRole,
    checkPermission,
  }
}
