import { UiNodeTextAttributes } from "@ory/client"
import { LikelyNoUserWithThisPhoneExistError } from "@domain/authentication/errors"

import { kratosPublic } from "./private"
import {
  AuthenticationKratosError,
  MissingTotpKratosError,
  UnknownKratosError,
} from "./errors"

export const kratosInitiateTotp = async (token: SessionToken) => {
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
  authToken: SessionToken
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
  sessionToken,
  totpCode,
}: {
  sessionToken: SessionToken
  totpCode: TotpCode
}): Promise<true | KratosError> => {
  const flow = await kratosPublic.createNativeLoginFlow({
    refresh: false,
    aal: "aal2",
    xSessionToken: sessionToken,
  })

  const method = "totp"

  try {
    await kratosPublic.updateLoginFlow({
      flow: flow.data.id,
      updateLoginFlowBody: {
        method,
        totp_code: totpCode,
      },
      xSessionToken: sessionToken,
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
