import path from "path"
import {
  // subjectIdFromUserId,
  subjectIdFromRole,
  UnknownAuthorizationServiceError,
} from "@domain/authorization"
import { newEnforcer, Enforcer, Util } from "casbin"
import { getCasbinPgCreds } from "@config"
import PostgresAdapter from "casbin-pg-adapter"

let cachedEnforcer: Enforcer
const lazyGetEnforcer = async () => {
  if (!cachedEnforcer) {
    const adapter = await PostgresAdapter.newAdapter(getCasbinPgCreds())
    cachedEnforcer = await newEnforcer(model, adapter)
  }
  cachedEnforcer.addNamedDomainMatchingFunc("g", Util.keyMatchFunc)
  return cachedEnforcer
}
const model = path.resolve(__dirname, "./casbin.conf")
export const CasbinService = (): IAuthorizationService => {
  const addRoleToSubject = async ({
    subjectId,
    scope,
    role,
  }: AddRoleToSubjectArgs): Promise<true | AuthorizationError> => {
    try {
      const enforcer = await lazyGetEnforcer()
      await enforcer.addRoleForUser(subjectId, role, scope)
      return true
    } catch (error) {
      return new UnknownAuthorizationServiceError(error.message)
    }
  }

  const addPermissionsToRole = async <
    RType extends keyof AuthPermissions,
    Attribute extends keyof AuthPermissions[RType],
  >({
    role,
    scope,
    resource,
    permission,
  }: AddPermissionToRoleArgs<RType, Attribute>): Promise<true | AuthorizationError> => {
    try {
      const enforcer = await lazyGetEnforcer()
      await enforcer.addPermissionForUser(role, scope, resource.uri, permission.uri)
      return true
    } catch (error) {
      return new UnknownAuthorizationServiceError(error.message)
    }
  }

  const checkPermission = async <
    RType extends keyof AuthPermissions,
    Attribute extends keyof AuthPermissions[RType],
  >({
    subjectId,
    resource,
    permission,
  }: CheckPermissionArgs<RType, Attribute>): Promise<boolean | AuthorizationError> => {
    try {
      const enforcer = await lazyGetEnforcer()
      await enforcer.loadFilteredPolicy({
        g: [""],
        p: ["", "", resource.uri, permission.uri],
      })
      return await enforcer.enforce(subjectId, resource.uri, permission.uri)
    } catch (error) {
      return new UnknownAuthorizationServiceError(error.message)
    }
  }

  return {
    addRoleToSubject,
    addPermissionsToRole,
    checkPermission,
  }
}
