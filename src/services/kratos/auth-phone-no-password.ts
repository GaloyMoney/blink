import { getKratosMasterPhonePassword } from "@config"

import {
  AuthenticationKratosError,
  IncompatibleSchemaUpgradeError,
  KratosError,
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
  UnknownKratosError,
} from "@domain/authentication/errors"
import {
  AdminCreateIdentityBody,
  AdminUpdateIdentityBody,
  Identity,
  SuccessfulSelfServiceLoginWithoutBrowser,
  SuccessfulSelfServiceRegistrationWithoutBrowser,
} from "@ory/client"

import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

import { kratosAdmin, kratosPublic, toDomainIdentityPhone } from "./private"

// login with phone

export const AuthWithPhonePasswordlessService = (): IAuthWithPhonePasswordlessService => {
  const password = getKratosMasterPhonePassword()

  const login = async (
    phone: PhoneNumber,
  ): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
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

    // note: this only works when whoami: required_aal = aal1
    const kratosUserId = result.data.session.identity.id as KratosUserId

    return { sessionToken, kratosUserId }
  }

  const createIdentityWithSession = async (
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

    const sessionToken = result.data.session_token as SessionToken
    const kratosUserId = result.data.identity.id as KratosUserId

    return { sessionToken, kratosUserId }
  }

  const createIdentityNoSession = async (
    phone: PhoneNumber,
  ): Promise<KratosUserId | KratosError> => {
    const adminIdentity: AdminCreateIdentityBody = {
      credentials: { password: { config: { password } } },
      state: "active",
      schema_id: "phone_no_password_v0",
      traits: { phone },
    }

    let kratosUserId: KratosUserId

    try {
      const { data: identity } = await kratosAdmin.adminCreateIdentity(adminIdentity)

      kratosUserId = identity.id as KratosUserId
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err)
      }

      return new UnknownKratosError(err)
    }

    return kratosUserId
  }

  const upgradeToPhoneWithPasswordSchema = async ({
    kratosUserId,
    password,
  }: {
    kratosUserId: KratosUserId
    password: IdentityPassword
  }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.adminGetIdentity(kratosUserId))
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err)
      }

      return new UnknownKratosError(err)
    }

    if (identity.schema_id !== "phone_no_password_v0") {
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

    return toDomainIdentityPhone(newIdentity)
  }

  return {
    login,
    createIdentityWithSession,
    createIdentityNoSession,
    upgradeToPhoneWithPasswordSchema,
  }
}
