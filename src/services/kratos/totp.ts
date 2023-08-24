import { LikelyNoUserWithThisPhoneExistError } from "@domain/authentication/errors"
import { UiNodeTextAttributes } from "@ory/client"

import { isAxiosError } from "axios"

import { KRATOS_MASTER_USER_PASSWORD } from "@config"

import {
  AuthenticationKratosError,
  MissingTotpKratosError,
  SessionRefreshRequiredError,
  UnknownKratosError,
} from "./errors"
import { kratosPublic } from "./private"

export const kratosInitiateTotp = async (token: AuthToken) => {
  try {
    const res = await kratosPublic.createNativeSettingsFlow({ xSessionToken: token })
    const totpAttributes = res.data.ui.nodes.find(
      (node) => (node.attributes as UiNodeTextAttributes).id === "totp_secret_key",
    )
    if (!totpAttributes) {
      return new MissingTotpKratosError()
    }

    const totpSecret = (totpAttributes.attributes as UiNodeTextAttributes).text
      .text as TotpSecret
    return { totpSecret, totpRegistrationId: res.data.id as TotpRegistrationId }
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const kratosValidateTotp = async ({
  authToken,
  totpCode,
  totpRegistrationId: flow,
}: {
  authToken: AuthToken
  totpCode: string
  totpRegistrationId: string
}) => {
  try {
    await kratosPublic.updateSettingsFlow({
      flow,
      updateSettingsFlowBody: {
        method: "totp",
        totp_code: totpCode,
      },
      xSessionToken: authToken,
    })
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const kratosElevatingSessionWithTotp = async ({
  authToken,
  totpCode,
}: {
  authToken: AuthToken
  totpCode: TotpCode
}): Promise<true | KratosError> => {
  try {
    const flow = await kratosPublic.createNativeLoginFlow({
      refresh: false,
      aal: "aal2",
      xSessionToken: authToken,
    })

    const method = "totp"
    await kratosPublic.updateLoginFlow({
      flow: flow.data.id,
      updateLoginFlowBody: {
        method,
        totp_code: totpCode,
      },
      xSessionToken: authToken,
    })
  } catch (err) {
    if (err instanceof Error && err.message === "Request failed with status code 400") {
      return new LikelyNoUserWithThisPhoneExistError(err.message)
    }

    if (err instanceof Error && err.message === "Request failed with status code 401") {
      return new AuthenticationKratosError(err.message)
    }

    return new UnknownKratosError(err)
  }

  return true
}

const refreshToken = async (authToken: AuthToken): Promise<void | KratosError> => {
  const method = "password"
  const password = KRATOS_MASTER_USER_PASSWORD

  const session = await kratosPublic.toSession({ xSessionToken: authToken })
  const identifier =
    session.data.identity?.traits?.phone || session.data.identity?.traits?.email

  if (!identifier) {
    return new UnknownKratosError("No identifier found")
  }

  try {
    const flow = await kratosPublic.createNativeLoginFlow({
      refresh: true,
      xSessionToken: authToken,
    })
    await kratosPublic.updateLoginFlow({
      flow: flow.data.id,
      updateLoginFlowBody: {
        identifier,
        method,
        password,
      },
      xSessionToken: authToken,
    })
  } catch (err) {
    return new UnknownKratosError(err)
  }
}

export const kratosRemoveTotp = async (token: AuthToken) => {
  let flow: string

  const res = await refreshToken(token)
  if (res instanceof Error) return res

  try {
    const res = await kratosPublic.createNativeSettingsFlow({ xSessionToken: token })
    flow = res.data.id
  } catch (err) {
    return new UnknownKratosError(err)
  }

  try {
    await kratosPublic.updateSettingsFlow({
      flow,
      updateSettingsFlowBody: {
        method: "totp",
        totp_unlink: true,
      },
      xSessionToken: token,
    })
  } catch (err) {
    if (isAxiosError(err)) {
      if (err.response?.data?.error?.id === "session_refresh_required") {
        return new SessionRefreshRequiredError()
      }
    }
    return new UnknownKratosError(err)
  }
}
