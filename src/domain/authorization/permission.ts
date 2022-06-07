import {
  UserAttribute,
  AuthAction,
  AccountAttribute,
  AuthResourceType,
} from "./primitives"

const permissionUri = ({
  type,
  attr,
  action,
}: {
  type: AuthResourceType
  attr: string
  action: string
}) => `/${type}/${attr}/${action}`

export const Permission = <
  RType extends keyof AuthPermissions,
  Attr extends keyof AuthPermissions[RType],
>({
  type,
  attr,
  action,
}: AuthPermissionArgs<RType, Attr>): AuthPermission<RType, Attr> => {
  return {
    type,
    attr,
    action,
    uri: permissionUri({
      type,
      attr: attr as unknown as string,
      action: action as unknown as string,
    }),
  }
}

export const AccountPermission = <Attr extends keyof AccountPermissions>({
  attr,
  action,
}: AccountPermissionArgs<Attr>): AuthPermission<
  typeof AuthResourceType.Account,
  Attr
> => {
  return {
    type: AuthResourceType.Account,
    attr,
    action,
    uri: permissionUri({
      type: AuthResourceType.Account,
      attr: attr as unknown as string,
      action: action as unknown as string,
    }),
  }
}

export const UserPermission = <Attr extends keyof UserPermissions>({
  attr,
  action,
}: UserPermissionArgs<Attr>): AuthPermission<typeof AuthResourceType.User, Attr> => {
  return {
    type: AuthResourceType.User,
    attr,
    action,
    uri: permissionUri({
      type: AuthResourceType.User,
      attr: attr as unknown as string,
      action: action as unknown as string,
    }),
  }
}

export const AuthPermissions = {
  [AuthResourceType.Account]: {
    [AccountAttribute.Status]: [AuthAction.Read, AuthAction.Update],
  },
  [AuthResourceType.User]: {
    [UserAttribute.SupportRole]: [AuthAction.Read, AuthAction.Update, AuthAction.Delete],
  },
}
