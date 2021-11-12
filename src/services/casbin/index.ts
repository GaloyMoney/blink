import path from "path"
import { UnknownAuthorizationServiceError } from "@domain/authorization"
import { newEnforcer } from "casbin"
import { MongooseAdapter } from "casbin-mongoose-adapter"
import { getMongoDBConfig } from "@config/app"

const model = path.resolve(__dirname, "./casbin.conf")
export const CasbinService = async (): Promise<IAuthorizationService> => {
  const adapter = await MongooseAdapter.newFilteredAdapter(getMongoDBConfig().path)
  const enforcer = await newEnforcer(model, adapter)

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

  const addPermissionToRole = async ({
    role,
    scope,
    resourceId,
    permission,
  }: AddPermissionToRoleArgs): Promise<true | AuthorizationError> => {
    try {
      await enforcer.addPolicy(role, scope, resourceId, permission)
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
      const filter = {
        $or: [
          { p_type: "g", v0: userId },
          { p_type: "p", v2: resourceId, v3: permission },
        ],
      }
      await enforcer.loadFilteredPolicy(filter)
      return await enforcer.enforce(userId, resourceId, permission)
    } catch (error) {
      return new UnknownAuthorizationServiceError(error.message)
    }
  }

  return {
    addRoleToUser,
    addPermissionToRole,
    checkPermission,
  }
}
