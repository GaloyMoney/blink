import { getKratosPasswords } from "@config"
import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import { CreateIdentityBody, SuccessfulNativeRegistration } from "@ory/client"
import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

import { baseLogger } from "@services/logger"

import { AuthenticationKratosError, UnknownKratosError } from "./errors"

import { kratosAdmin, kratosPublic } from "./private"

// login with email

export const AuthWithEmailPasswordlessService = () => {
  const password = getKratosPasswords().masterUserPassword

  const register = async (email: EmailAddress): Promise<UserId | KratosError> => {
    const flow = await kratosPublic.createNativeRegistrationFlow()

    const traits = { email }
    const method = "password"

    let result: AxiosResponse<SuccessfulNativeRegistration>

    try {
      result = await kratosPublic.updateRegistrationFlow({
        flow: flow.data.id,
        updateRegistrationFlowBody: {
          traits,
          method,
          password,
        },
      })

      // would only return a valid session if `session` hook is activated
      // baseLogger.warn(result.data, flow.data.id)
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyNoUserWithThisPhoneExistError(err)
      }

      if (err.message === "Request failed with status code 401") {
        return new AuthenticationKratosError(err)
      }

      return new UnknownKratosError(err)
    }

    // const sessionToken = result.data.session_token as SessionToken

    // note: this only works when whoami: required_aal = aal1
    const kratosUserId = result.data.identity.id as UserId
    return kratosUserId
  }

  // TODO: type EmailCode
  const validateEmail = async ({
    email,
    code,
  }: {
    email: EmailAddress
    code: string
  }) => {
    const { data } = await kratosPublic.createNativeVerificationFlow()

    const flow = data.id

    console.log({ data, email })
    // const identifier = email
    const method = "code"

    try {
      const result = await kratosPublic.updateVerificationFlow({
        flow,
        updateVerificationFlowBody: {
          email,
          method,
          /* eslint @typescript-eslint/ban-ts-comment: "off" */
          // @ts-ignore-next-line no-implicit-any error
          code,
          flow,
        },
      })
      console.log({ result })
    } catch (err) {
      console.log({ err }, "err12")
      // if (err.message === "Request failed with status code 400") {
      //   return new LikelyNoUserWithThisPhoneExistError(err)
      // }

      // if (err.message === "Request failed with status code 401") {
      //   return new AuthenticationKratosError(err)
      // }

      // return new UnknownKratosError(err)
    }

    // const sessionToken = result.data.session_token as SessionToken

    // // note: this only works when whoami: required_aal = aal1
    // const kratosUserId = result.data.session.identity.id as UserId

    // return { sessionToken, kratosUserId }
  }

  const initiateEmailVerification = async (email: EmailAddress) => {
    const { data } = await kratosPublic.createNativeRecoveryFlow()

    const method = "code"

    try {
      const result = await kratosPublic.updateRecoveryFlow({
        flow: data.id,
        updateRecoveryFlowBody: {
          email,
          method,
        },
      })
      baseLogger.info({ result })

      return data.id
    } catch (err) {
      console.log({ err }, "err12")
      // if (err.message === "Request failed with status code 400") {
      //   return new LikelyNoUserWithThisPhoneExistError(err)
      // }

      // if (err.message === "Request failed with status code 401") {
      //   return new AuthenticationKratosError(err)
      // }

      // return new UnknownKratosError(err)
    }

    // const sessionToken = result.data.session_token as SessionToken

    // // note: this only works when whoami: required_aal = aal1
    // const kratosUserId = result.data.session.identity.id as UserId

    // return { sessionToken, kratosUserId }
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
      const result = await kratosPublic.updateRecoveryFlow({
        flow,
        updateRecoveryFlowBody: {
          method,
          code,
        },
      })
      baseLogger.warn("success")
      result
    } catch (err) {
      console.log({ err }, "err12")
      // if (err.message === "Request failed with status code 400") {
      //   return new LikelyNoUserWithThisPhoneExistError(err)
      // }

      // if (err.message === "Request failed with status code 401") {
      //   return new AuthenticationKratosError(err)
      // }

      // return new UnknownKratosError(err)
    }

    // const sessionToken = result.data.session_token as SessionToken

    // // note: this only works when whoami: required_aal = aal1
    // const kratosUserId = result.data.session.identity.id as UserId

    // return { sessionToken, kratosUserId }
  }

  const createIdentityNoSession = async (
    email: EmailAddress,
  ): Promise<UserId | KratosError> => {
    const adminIdentity: CreateIdentityBody = {
      credentials: { password: { config: { password } } },
      state: "active",
      schema_id: "phone_email_no_password_v0",
      traits: { email },
    }

    let kratosUserId: UserId

    try {
      const { data: identity } = await kratosAdmin.createIdentity({
        createIdentityBody: adminIdentity,
      })

      kratosUserId = identity.id as UserId
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err)
      }

      return new UnknownKratosError(err)
    }

    return kratosUserId
  }

  // doesn't work:
  // work only on default schema
  // const create = async (
  //   email: EmailAddress,
  // ): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
  //   const flow = await kratosPublic.createNativeRegistrationFlow()

  //   const traits = { email }
  //   const method = "password"

  //   let result: AxiosResponse<SuccessfulNativeRegistration>

  //   try {
  //     result = await kratosPublic.updateRegistrationFlow({
  //       flow: flow.data.id,
  //       updateRegistrationFlowBody: {
  //         traits,
  //         method,
  //         password,
  //       },
  //     })

  //     console.log({ data: result.data })
  //   } catch (err) {
  //     console.log({ err })
  //     if (err.message === "Request failed with status code 400") {
  //       return new LikelyNoUserWithThisPhoneExistError(err)
  //     }

  //     if (err.message === "Request failed with status code 401") {
  //       return new AuthenticationKratosError(err)
  //     }

  //     return new UnknownKratosError(err)
  //   }

  //   const sessionToken = result.data.session_token as SessionToken

  //   if (result.data.session === undefined) {
  //     throw new ConfigError("session shouldn't be undefined")
  //   }

  //   // note: this only works when whoami: required_aal = aal1
  //   const kratosUserId = result.data.session.identity.id as UserId

  //   return { sessionToken, kratosUserId }
  // }

  return {
    register,
    validateEmail,
    initiateEmailVerification,
    validateEmailVerification,
    createIdentityNoSession,
  }
}
