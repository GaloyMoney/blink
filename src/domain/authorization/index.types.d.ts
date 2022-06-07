type AuthorizationServiceError = import("./errors").AuthorizationServiceError
type AuthorizationError = import("./errors").AuthorizationError

type AuthorizedAction =
  typeof import("./primitives").AuthAction[keyof typeof import("./primitives").AuthAction]

type AuthResourceType =
  typeof import("./primitives").AuthResourceType[keyof typeof import("./primitives").AuthResourceType]

type AccountAttribute =
  typeof import("./primitives").AccountAttribute[keyof typeof import("./primitives").AccountAttribute]

type AuthPermissions = typeof import("./permission").AuthPermissions
type AccountPermissions = AuthPermissions["account"]
type UserPermissions = AuthPermissions["user"]

type AuthPermission<
  RType extends keyof AuthPermissions,
  Attribute extends keyof AuthPermissions[RType],
> = {
  type: RType
  attr: Attribute
  action: AuthPermissions[RType][Attribute][keyof AuthPermissions[RType][Attribute]]
  uri: string
}

type AuthResource = {
  type: AuthResourceType
  id: string
  uri: string
}

type Role = typeof import("./primitives").Role[keyof typeof import("./primitives").Role]

declare const subjectIdSymbol: unique symbol
type SubjectId = (string & { [subjectIdSymbol]: never }) | Role
declare const authorizationScopeSymbol: unique symbol
type AuthorizationScope = string & { [authorizationScopeSymbol]: never }

type AuthPermissionArgs<
  RType extends keyof AuthPermissions,
  Attribute extends keyof AuthPermissions[RType],
> = {
  type: RType
  attr: Attribute
  action: AuthPermissions[RType][Attribute][keyof AuthPermissions[RType][Attribute]]
}

type AccountPermissionArgs<Attribute extends keyof AccountPermissions> = {
  attr: Attribute
  action: AccountPermissions[Attribute][keyof AccountPermissions[Attribute]]
}

type UserPermissionArgs<Attribute extends keyof UserPermissions> = {
  attr: Attribute
  action: UserPermissions[Attribute][keyof UserPermissions[Attribute]]
}

type AddRoleToSubjectArgs = {
  subjectId: SubjectId
  scope: AuthorizationScope
  role: Role
}

type AddPermissionToRoleArgs<
  RType extends keyof AuthPermissions,
  Attribute extends keyof AuthPermissions[RType],
> = {
  role: Role
  scope: AuthorizationScope
  resource: AuthResource
  permission: AuthPermission<RType, Attribute>
}

type CheckPermissionArgs<
  RType extends keyof AuthPermissions,
  Attribute extends keyof AuthPermissions[RType],
> = {
  subjectId: SubjectId
  resource: AuthResource
  permission: AuthPermission<RType, Attribute>
}

type IAuthorizationService = {
  addRoleToSubject(AddRoleToSubjectArgs): Promise<true | AuthorizationServiceError>

  addPermissionsToRole(
    AddPermissionsToRoleArgs,
  ): Promise<true | AuthorizationServiceError>

  checkPermission(CheckPermissionArgs): Promise<boolean | AuthorizationServiceError>
}
