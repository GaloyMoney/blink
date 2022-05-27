import path from "path"
import { UnknownAuthorizationServiceError } from "@domain/authorization"
import { newEnforcer } from "casbin"
import { getCasbinPgCreds } from "@config"
import PostgresAdapter from "casbin-pg-adapter"

let adapter: PostgresAdapter
const lazyGetAdaptor = async () => {
  if (!adapter) {
    adapter = await PostgresAdapter.newAdapter(getCasbinPgCreds())
  }
  return adapter
}
const model = path.resolve(__dirname, "./casbin.conf")
export const CasbinService = async (): Promise<IAuthorizationService> => {
  const enforcer = await newEnforcer(model, await lazyGetAdaptor())

  const addRoleToUser = async ({
    userId,
    scope,
    role,
  }: AddRoleToUserArgs): Promise<true | AuthorizationError> => {
    try {
      await enforcer.addRoleForUser(userId, role, scope)
      return true
    } catch (error) {
      return new UnknownAuthorizationServiceError(error.message)
    }
  }

  const addPermissionsToRole = async ({
    role,
    scope,
    resourceId,
    permissions,
  }: AddPermissionsToRoleArgs): Promise<true | AuthorizationError> => {
    try {
      for (const p of permissions) {
        await enforcer.addPermissionForUser(role, scope, resourceId, p)
      }
      return true
    } catch (error) {
      return new UnknownAuthorizationServiceError(error.message)
    }
  }

  const checkPermission = async ({
    userId,
    resourceId,
    permission,
  }: CheckPermissionArgs): Promise<boolean | AuthorizationError> => {
    try {
      await enforcer.loadFilteredPolicy({
        g: [userId],
        p: ["", "", resourceId, permission],
      })
      return await enforcer.enforce(userId, resourceId, permission)
    } catch (error) {
      return new UnknownAuthorizationServiceError(error.message)
    }
  }

  return {
    addRoleToUser,
    addPermissionsToRole,
    checkPermission,
  }
}
