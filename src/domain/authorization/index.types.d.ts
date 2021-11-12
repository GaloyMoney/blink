type AuthorizationServiceError = import("./errors").AuthorizationServiceError

type Role = typeof import("./primitives").Role[keyof typeof import("./primitives").Role]

type AuthorizationScope =
  typeof import("./primitives").AuthorizationScope[keyof typeof import("./primitives").AuthorizationScope]

type Permission =
  typeof import("./primitives").Permission[keyof typeof import("./primitives").Permission]

declare const resourceIdSymbol: unique symbol
type ResourceId = string & { [resourceIdSymbol]: never }

type AddRoleToUserArgs = {
  userId: UserId
  scope: AuthorizationScope
  role: Role
}

type AddPermissionToRoleArgs = {
  role: Role
  scope: AuthorizationScope
  resourceId: ResourceId
  permission: Permission
}

type CheckPermissionArgs = {
  userId: UserId
  resourceId: ResourceId
  permission: Permission
}

type IAuthorizationService = {
  addRoleToUser(AddRoleToUserArgs): Promise<true | AuthorizationError>

  addPermissionToRole(AddPermissionToRoleArgs): Promise<true | AuthorizationError>

  checkPermission(CheckPermissionArgs): Promise<true | AuthorizationError>
}
