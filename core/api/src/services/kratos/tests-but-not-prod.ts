import { IdentityState } from "@ory/client"

import { UnknownKratosError } from "./errors"
import { kratosAdmin } from "./private"

import { baseLogger } from "@/services/logger"

export const activateUser = async (kratosUserId: UserId): Promise<void | KratosError> => {
  let identity: KratosIdentity
  try {
    const res = await kratosAdmin.getIdentity({ id: kratosUserId })
    identity = res.data
  } catch (err) {
    return new UnknownKratosError(err)
  }

  try {
    await kratosAdmin.updateIdentity({
      id: kratosUserId,
      updateIdentityBody: {
        ...identity,
        state: IdentityState.Active,
      },
    })
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

// this function from kratos is not implemented
export const deactivateUser = async (
  kratosUserId: UserId,
): Promise<void | KratosError> => {
  let identity: KratosIdentity
  try {
    const res = await kratosAdmin.getIdentity({ id: kratosUserId })
    identity = res.data
  } catch (err) {
    return new UnknownKratosError(err)
  }

  try {
    const res = await kratosAdmin.updateIdentity({
      id: kratosUserId,
      updateIdentityBody: {
        ...identity,
        state: IdentityState.Inactive,
      },
    })

    baseLogger.info(res, "deactivateUser result")
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const revokeSessions = async (
  kratosUserId: UserId,
): Promise<void | KratosError> => {
  try {
    await kratosAdmin.deleteIdentitySessions({ id: kratosUserId })
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const listIdentitySchemas = async (): Promise<
  IdentitySchemaContainer[] | KratosError
> => {
  try {
    const res = await kratosAdmin.listIdentitySchemas()
    return res.data
  } catch (err) {
    return new UnknownKratosError(err)
  }
}
