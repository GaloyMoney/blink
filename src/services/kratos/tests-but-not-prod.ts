import { IdentityState, SuccessfulNativeLogin } from "@ory/client"
import { LikelyNoUserWithThisPhoneExistError } from "@domain/authentication/errors"
import { authenticator } from "otplib"

import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

import { baseLogger } from "@services/logger"

import { kratosAdmin, kratosPublic } from "./private"
import {
  AuthenticationKratosError,
  MissingTotpKratosError,
  UnknownKratosError,
} from "./errors"

export const LoginWithPhoneAndPasswordSchema = async ({
  phone,
  password,
}: {
  phone: PhoneNumber
  password: IdentityPassword
}): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
  const flow = await kratosPublic.createNativeLoginFlow()

  const identifier = phone
  const method = "password"

  let result: AxiosResponse<SuccessfulNativeLogin>

  try {
    result = await kratosPublic.updateLoginFlow({
      flow: flow.data.id,
      updateLoginFlowBody: {
        identifier,
        method,
        password,
      },
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
  const kratosUserId = result.data.session.identity.id as UserId

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
    const res = await kratosPublic.createNativeSettingsFlow({ xSessionToken: token })
    const totpAttributes = res.data.ui.nodes.find(
      (node) => (node.attributes as TotpAttributes).id === "totp_secret_key",
    )
    if (!totpAttributes) {
      return new MissingTotpKratosError()
    }

    const totpSecret = (totpAttributes.attributes as TotpAttributes).text.text
    const totp_code = authenticator.generate(totpSecret)

    await kratosPublic.updateSettingsFlow({
      flow: res.data.id,
      updateSettingsFlowBody: {
        method: "totp",
        totp_code,
      },
      xSessionToken: token,
    })

    return totpSecret
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

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
    baseLogger.warn({ identity }, "identity")
    const res = await kratosAdmin.updateIdentity({
      id: kratosUserId,
      updateIdentityBody: {
        ...identity,
        state: IdentityState.Inactive,
      },
    })
    console.log({ res }, "res")
  } catch (err) {
    console.log({ err }, "err1")
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

export const elevatingSessionWithTotp = async ({
  session,
  code,
  password,
}: {
  session: SessionToken
  code: string
  password: string
}): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
  const flow = await kratosPublic.createNativeLoginFlow({
    refresh: false,
    aal: "aal2",
    xSessionToken: session,
  })

  const method = "totp"

  let result: AxiosResponse<SuccessfulNativeLogin>

  try {
    result = await kratosPublic.updateLoginFlow({
      flow: flow.data.id,
      updateLoginFlowBody: {
        method,
        totp_code: code,
        password,
      },
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
  const kratosUserId = result.data.session.identity.id as UserId
  return { sessionToken, kratosUserId }
}
