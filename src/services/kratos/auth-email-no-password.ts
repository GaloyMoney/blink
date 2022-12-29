import { PhoneCodeInvalidError } from "@domain/phone-provider"

import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

import { getKratosPasswords } from "@config"

import { SuccessfulNativeLogin } from "@ory/client"

import { UnknownKratosError } from "./errors"

import { kratosPublic } from "./private"

// login with email

export const AuthWithEmailPasswordlessService = () => {
  const initiateEmailVerification = async (email: EmailAddress) => {
    const { data } = await kratosPublic.createNativeRecoveryFlow()

    const method = "code"

    try {
      await kratosPublic.updateRecoveryFlow({
        flow: data.id,
        updateRecoveryFlowBody: {
          email,
          method,
        },
      })

      return data.id
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const validateEmailVerification = async ({
    code,
    flow,
  }: {
    code: string
    flow: string
  }) => {
    const method = "code"

    try {
      const res = await kratosPublic.updateRecoveryFlow({
        flow,
        updateRecoveryFlowBody: {
          method,
          code,
        },
      })

      const wrongCodeMessage =
        "The recovery code is invalid or has already been used. Please try again."
      if (!!res.data.ui.messages && res.data.ui.messages[0].text === wrongCodeMessage) {
        return new PhoneCodeInvalidError()
      }

      // baseLogger.warn({ state: res.data.state }, "state")
      return new UnknownKratosError("happy case should error :/")
    } catch (err) {
      if (err.response.status === 422) {
        // FIXME bug in kratos? https://github.com/ory/kratos/discussions/2923
        // console.log("422 response, success?")
        return true
      }

      return new UnknownKratosError(err)
    }
  }

  const password = getKratosPasswords().masterUserPassword

  const login = async (
    email: EmailAddress,
  ): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
    const flow = await kratosPublic.createNativeLoginFlow()

    const identifier = email
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
      return new UnknownKratosError(err)
    }

    const sessionToken = result.data.session_token as SessionToken

    // note: this only works when whoami: required_aal = aal1
    const kratosUserId = result.data.session.identity.id as UserId

    return { sessionToken, kratosUserId }
  }

  return {
    initiateEmailVerification,
    validateEmailVerification,
    login,
  }
}
