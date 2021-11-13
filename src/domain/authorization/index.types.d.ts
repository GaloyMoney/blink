type AuthorizationServiceError = import("./errors").AuthorizationServiceError

type Role = typeof import("./primitives").Role[keyof typeof import("./primitives").Role]

declare const authorizationScopeSymbol: unique symbol
type AuthorizationScope = string & { [authorizationScopeSymbol]: never }

type Permission =
  typeof import("./primitives").Permission[keyof typeof import("./primitives").Permission]

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
  addRoleToUser(AddRoleToUserArgs): Promise<true | AuthorizationError>

  addPermissionsToRole(AddPermissionsToRoleArgs): Promise<true | AuthorizationError>

  checkPermission(CheckPermissionArgs): Promise<boolean | AuthorizationError>
}
