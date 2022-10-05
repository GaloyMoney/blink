import { getKratosConfig } from "@config"
import {
  AuthenticationKratosError,
  KratosError,
  LikelyNoUserWithThisPhoneExistError,
  MissingTotpKratosError,
  UnknownKratosError,
} from "@domain/authentication/errors"
import {
  Configuration,
  SuccessfulSelfServiceLoginWithoutBrowser,
  V0alpha2Api,
  V0alpha2ApiInterface,
} from "@ory/client"
import { authenticator } from "otplib"

import { baseLogger } from "@services/logger"
import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

export * from "./auth-phone-no-password"

const { publicApi, adminApi } = getKratosConfig()

const KratosSdk: (kratosEndpoint: string) => V0alpha2ApiInterface = (kratosEndpoint) =>
  new V0alpha2Api(new Configuration({ basePath: kratosEndpoint }))

export const kratosPublic = KratosSdk(publicApi)
export const kratosAdmin = KratosSdk(adminApi)

export const LoginWithPhoneAndPasswordSchema = async ({
  phone,
  password,
}: {
  phone: PhoneNumber
  password: KratosPassword
}): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
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

export const addTotp = async (token: KratosSessionToken) => {
  interface TotpAttributes {
    text: {
      text: string
    }
    id: string
  }

  try {
    const res = await kratosPublic.initializeSelfServiceSettingsFlowWithoutBrowser(token)
    const totpAttributes = res.data.ui.nodes.find(
      (node) => (node.attributes as TotpAttributes).id === "totp_secret_key",
    )
    if (!totpAttributes) {
      return new MissingTotpKratosError()
    }

    const totpSecret = (totpAttributes.attributes as TotpAttributes).text.text
    const totp_code = authenticator.generate(totpSecret)

    const res2 = await kratosPublic.submitSelfServiceSettingsFlow(
      res.data.id,
      {
        method: "totp",
        totp_code,
      },
      token,
    )
    baseLogger.error(res2.data, "submitSelfService")

    return totpSecret
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const validateKratosToken = async (
  KratosSessionToken: KratosSessionToken,
): Promise<ValidateKratosTokenResult | KratosError> => {
  let session: Session

  try {
    const { data } = await kratosPublic.toSession(KratosSessionToken)
    session = toDomainSession(data)
  } catch (err) {
    if (err.message === "Request failed with status code 401") {
      return new AuthenticationKratosError(err)
    }
    return new UnknownKratosError(err)
  }

  // TODO: should return aal level also
  return {
    kratosUserId: session.identity.id,
    session,
  }
}

export const activateUser = async (
  kratosUserId: KratosUserId,
): Promise<void | KratosError> => {
  let identity: IdentityKratos
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
  let identity: IdentityKratos
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

export const listSessions = async (
  userId: KratosUserId,
): Promise<Session[] | KratosError> => {
  try {
    const res = await kratosAdmin.adminListIdentitySessions(userId)
    if (res.data === null) return []
    return res.data.map(toDomainSession)
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const listUsers = async (): Promise<Identity[] | KratosError> => {
  try {
    const res = await kratosAdmin.adminListIdentities()
    return res.data.map((item) => ({
      ...item,
      id: item.id as KratosUserId,
    }))
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const extendSessions = async (
  schemaIds: SchemaId[],
): Promise<void | KratosError> => {
  const users = await listUsers()
  if (users instanceof Error) return users

  for (const user of users) {
    const sessions = await listSessions(user.id)
    if (sessions instanceof Error) return sessions

    for (const session of sessions) {
      await extendSession({ session, schemaIds })
    }
  }
}

// not all identities need to be extended
// a schemaId attached to an itentity with Phone may need to be
// because login back with a phone number + code is both costly and have variable delivery time
// whereas a schemasId attached to an email + password may not need to have long session time
export const extendSession = async ({
  session,
  schemaIds,
}: {
  session: Session
  schemaIds: SchemaId[]
}): Promise<void | KratosError> => {
  if (!schemaIds.includes(session.identity.schema_id as SchemaId)) return

  await kratosAdmin.adminExtendSession(session.id)
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

export const elevatingSessionWithTotp = async ({
  session,
  code,
  password,
}: {
  session: KratosSessionToken
  code: string
  password: string
}): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
  const flow = await kratosPublic.initializeSelfServiceLoginFlowWithoutBrowser(
    undefined, // refresh?
    "aal2",
    session,
  )

  const method = "totp"

  let result: AxiosResponse<SuccessfulSelfServiceLoginWithoutBrowser>

  try {
    result = await kratosPublic.submitSelfServiceLoginFlow(flow.data.id, {
      method,
      totp_code: code,
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

const toDomainSession = (session: SessionKratos): Session => {
  return {
    ...session,
    id: session.id as SessionId,
    identity: {
      ...session.identity,
      id: session.identity.id as KratosUserId,
    },
  }
}
