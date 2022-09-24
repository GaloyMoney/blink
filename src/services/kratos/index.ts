import { getKratosConfig, getKratosMasterPhonePassword } from "@config"
import {
  AuthenticationKratosError,
  IncompatibleSchemaUpgradeError,
  KratosError,
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
  UnknownKratosError,
} from "@domain/users/errors"
import {
  AdminUpdateIdentityBody,
  Configuration,
  Identity,
  Session,
  SuccessfulSelfServiceLoginWithoutBrowser,
  SuccessfulSelfServiceRegistrationWithoutBrowser,
  V0alpha2Api,
  V0alpha2ApiInterface,
} from "@ory/client"

import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

const { publicApi, adminApi } = getKratosConfig()

const KratosSdk: (kratosEndpoint: string) => V0alpha2ApiInterface = (kratosEndpoint) =>
  new V0alpha2Api(new Configuration({ basePath: kratosEndpoint }))

export const kratosPublic = KratosSdk(publicApi)
export const kratosAdmin = KratosSdk(adminApi)

// login with phone
const password = getKratosMasterPhonePassword()

export const loginForPhoneNoPasswordSchema = async (
  phone: PhoneNumber,
): Promise<LoginForPhoneNoPasswordSchemaResponse | KratosError> => {
  const flow = await kratosPublic.initializeSelfServiceLoginFlowWithoutBrowser()

  const identifier = phone
  const method = "password"

  let result: AxiosResponse<SuccessfulSelfServiceLoginWithoutBrowser>

  try {
    result = await kratosPublic.submitSelfServiceLoginFlow(flow.data.id, {
      identifier,
      method,
      password,
    })
  } catch (err) {
    if (err.message === "Request failed with status code 400") {
      return new LikelyNoUserWithThisPhoneExistError(err)
    }

    if (err.message === "Request failed with status code 401") {
      return new AuthenticationKratosError(err)
    }

    return new UnknownKratosError(err)
  }

  const sessionToken = result.data.session_token as KratosSessionToken
  const kratosUserId = result.data.session.identity.id as KratosUserId
  return { sessionToken, kratosUserId }
}

export const createKratosUserForPhoneNoPasswordSchema = async (
  phone: PhoneNumber,
): Promise<CreateKratosUserForPhoneNoPasswordSchemaResponse | KratosError> => {
  const flow = await kratosPublic.initializeSelfServiceRegistrationFlowWithoutBrowser()

  const traits = { phone }
  const method = "password"

  let result: AxiosResponse<SuccessfulSelfServiceRegistrationWithoutBrowser>

  try {
    result = await kratosPublic.submitSelfServiceRegistrationFlow(flow.data.id, {
      traits,
      method,
      password,
    })
  } catch (err) {
    if (err.message === "Request failed with status code 400") {
      return new LikelyUserAlreadyExistError(err)
    }

    return new UnknownKratosError(err)
  }

  const sessionToken = result.data.session_token as KratosSessionToken
  const kratosUserId = result.data.identity.id as KratosUserId

  return { sessionToken, kratosUserId }
}

export const upgradeUserToPasswordSchema = async ({
  kratosUserId,
  password,
}: {
  kratosUserId: KratosUserId
  password: string
}) => {
  const { data: identity } = await kratosAdmin.adminGetIdentity(kratosUserId)

  if (identity.schema_id !== "phone_v0") {
    return new IncompatibleSchemaUpgradeError()
  }

  const adminIdentity: AdminUpdateIdentityBody = {
    ...identity,
    credentials: { password: { config: { password } } },
    state: "active",
    schema_id: "phone_with_password_v0",
  }

  const { data: newIdentity } = await kratosAdmin.adminUpdateIdentity(
    kratosUserId,
    adminIdentity,
  )
  return newIdentity
}

export const validateKratosToken = async (
  KratosSessionToken: KratosSessionToken,
): Promise<KratosUserId | KratosError> => {
  let session: Session

  try {
    const { data } = await kratosPublic.toSession(KratosSessionToken)
    session = data
  } catch (err) {
    if (err.message === "Request failed with status code 401") {
      return new AuthenticationKratosError(err)
    }
    return new UnknownKratosError(err)
  }

  // TODO active: true

  return session.identity.id as KratosUserId
}

export const activateUser = async (
  kratosUserId: KratosUserId,
): Promise<void | KratosError> => {
  let identity: Identity
  try {
    const res = await kratosAdmin.adminGetIdentity(kratosUserId)
    identity = res.data
  } catch (err) {
    return new UnknownKratosError(err)
  }

  try {
    await kratosAdmin.adminUpdateIdentity(kratosUserId, {
      ...identity,
      state: "active",
    })
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const deactivateUser = async (
  kratosUserId: KratosUserId,
): Promise<void | KratosError> => {
  let identity: Identity
  try {
    const res = await kratosAdmin.adminGetIdentity(kratosUserId)
    identity = res.data
  } catch (err) {
    return new UnknownKratosError(err)
  }

  try {
    await kratosAdmin.adminUpdateIdentity(kratosUserId, {
      ...identity,
      state: "inactive",
    })
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const revokeSessions = async (
  kratosUserId: KratosUserId,
): Promise<void | KratosError> => {
  try {
    await kratosAdmin.adminDeleteIdentitySessions(kratosUserId)
  } catch (err) {
    return new UnknownKratosError(err)
  }
}
