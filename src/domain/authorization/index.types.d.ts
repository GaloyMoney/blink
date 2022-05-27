type AuthorizationServiceError = import("./errors").AuthorizationServiceError

type Role = typeof import("./primitives").Role[keyof typeof import("./primitives").Role]

declare const authorizationScopeSymbol: unique symbol
type AuthorizationScope = string & { [authorizationScopeSymbol]: never }

type WalletPermission =
  typeof import("./primitives").WalletPermission[keyof typeof import("./primitives").WalletPermission]

type Permission = WalletPermission

declare const resourceIdSymbol: unique symbol
type ResourceId = string & { [resourceIdSymbol]: never }

type AddRoleToUserArgs = {
  userId: UserId
  scope: AuthorizationScope
  role: Role
}

type AddPermissionsToRoleArgs = {
  role: Role
  scope: AuthorizationScope
  resourceId: ResourceId
  permissions: Permission[]
}

type CheckPermissionArgs = {
  userId: UserId
  resourceId: ResourceId
  permission: Permission
}

type IAuthorizationService = {
  addRoleToUser(AddRoleToUserArgs): Promise<true | AuthorizationServiceError>

  addPermissionsToRole(
    AddPermissionsToRoleArgs,
  ): Promise<true | AuthorizationServiceError>

  checkPermission(CheckPermissionArgs): Promise<boolean | AuthorizationServiceError>
}
