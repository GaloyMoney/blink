import { SuccessfulSelfServiceLoginWithoutBrowser } from "@ory/client"
import {
  AuthenticationKratosError,
  KratosError,
  LikelyNoUserWithThisPhoneExistError,
  MissingTotpKratosError,
  UnknownKratosError,
} from "@domain/authentication/errors"
import { authenticator } from "otplib"

import { baseLogger } from "@services/logger"
import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

import { kratosAdmin, kratosPublic } from "./private"

export const LoginWithPhoneAndPasswordSchema = async ({
  phone,
  password,
}: {
  phone: PhoneNumber
  password: IdentityPassword
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

  const sessionToken = result.data.session_token as SessionToken
  const kratosUserId = result.data.session.identity.id as KratosUserId

  return { sessionToken, kratosUserId }
}

export const addTotp = async (token: SessionToken) => {
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

export const activateUser = async (
  kratosUserId: KratosUserId,
): Promise<void | KratosError> => {
  let identity: KratosIdentity
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
  let identity: KratosIdentity
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
  session: SessionToken
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

  const sessionToken = result.data.session_token as SessionToken
  const kratosUserId = result.data.session.identity.id as KratosUserId
  return { sessionToken, kratosUserId }
}
