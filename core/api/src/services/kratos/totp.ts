import { isAxiosError } from "axios"

import { UiNodeTextAttributes } from "@ory/client"

import { handleKratosErrors } from "./errors"

import { kratosAdmin, kratosPublic } from "./private"

import { LikelyBadCoreError } from "@/domain/authentication/errors"
import { MissingTotpKratosError } from "@/domain/kratos"

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
    return handleKratosErrors(err)
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
    if (isAxiosError(err)) {
      if (err.response?.status === 400 && err.response.statusText === "Bad Request") {
        return new LikelyBadCoreError()
      }
    }

    return handleKratosErrors(err)
  }
}

export const kratosElevatingSessionWithTotp = async ({
  authToken,
  totpCode,
}: {
  authToken: AuthToken
  totpCode: TotpCode
}): Promise<true | KratosError> => {
  const flow = await kratosPublic.createNativeLoginFlow({
    refresh: false,
    aal: "aal2",
    xSessionToken: authToken,
  })

  const method = "totp"

  try {
    await kratosPublic.updateLoginFlow({
      flow: flow.data.id,
      updateLoginFlowBody: {
        method,
        totp_code: totpCode,
      },
      xSessionToken: authToken,
    })
  } catch (err) {
    return handleKratosErrors(err)
  }

  return true
}

export const kratosRemoveTotp = async (userId: UserId) => {
  try {
    const removeTotpResponse = await kratosAdmin.deleteIdentityCredentials({
      id: userId,
      type: "totp",
    })

    if (removeTotpResponse instanceof Error) return removeTotpResponse
  } catch (err) {
    return handleKratosErrors(err)
  }
}
