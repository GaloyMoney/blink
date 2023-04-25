import { getKratosPasswords } from "@config"

import { PhoneCodeInvalidError } from "@domain/phone-provider"

import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { kratosPublic } from "./private"
import { UnknownKratosError } from "./errors"

// login with email

export const AuthWithEmailPasswordlessService = (): IAuthWithEmailPasswordlessService => {
  const initiateEmailVerification = async ({ email }: { email: EmailAddress }) => {
    const method = "code"
    try {
      const { data } = await kratosPublic.createNativeRecoveryFlow()
      await kratosPublic.updateRecoveryFlow({
        flow: data.id,
        updateRecoveryFlowBody: {
          email,
          method,
        },
      })

      return data.id
    } catch (err) {
      return new UnknownKratosError(err.message || err)
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

      return new UnknownKratosError("happy case should error :/")
    } catch (err) {
      if (err.response.status === 422) {
        // FIXME bug in kratos? https://github.com/ory/kratos/discussions/2923
        // console.log("422 response, success?")
        return true
      }

      return new UnknownKratosError(err.message || err)
    }
  }

  const password = getKratosPasswords().masterUserPassword

  const login = async ({
    email,
  }: {
    email: EmailAddress
  }): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
    const identifier = email
    const method = "password"
    try {
      const flow = await kratosPublic.createNativeLoginFlow()
      const result = await kratosPublic.updateLoginFlow({
        flow: flow.data.id,
        updateLoginFlowBody: {
          identifier,
          method,
          password,
        },
      })
      const sessionToken = result.data.session_token as SessionToken

      // note: this only works when whoami: required_aal = aal1
      const kratosUserId = result.data.session.identity.id as UserId

      return { sessionToken, kratosUserId }
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.kratos.auth-email-no-password",
    fns: {
      initiateEmailVerification,
      validateEmailVerification,
      login,
    },
  })
}
