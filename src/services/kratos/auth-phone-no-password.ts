import { getKratosMasterPhonePassword } from "@config"

import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import {
  CreateIdentityBody,
  UpdateIdentityBody,
  Identity,
  SuccessfulNativeLogin,
  SuccessfulNativeRegistration,
} from "@ory/client"

import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

import {
  AuthenticationKratosError,
  IncompatibleSchemaUpgradeError,
  KratosError,
  UnknownKratosError,
} from "./errors"

import { kratosAdmin, kratosPublic, toDomainIdentityPhone } from "./private"

// login with phone

export const AuthWithPhonePasswordlessService = (): IAuthWithPhonePasswordlessService => {
  const password = getKratosMasterPhonePassword()

  const login = async (
    phone: PhoneNumber,
  ): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
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

    // note: this only works when whoami: required_aal = aal1
    const kratosUserId = result.data.session.identity.id as UserId

    return { sessionToken, kratosUserId }
  }

  const createIdentityWithSession = async (
    phone: PhoneNumber,
  ): Promise<CreateKratosUserForPhoneNoPasswordSchemaResponse | KratosError> => {
    const flow = await kratosPublic.createNativeRegistrationFlow()

    const traits = { phone }
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
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err)
      }

      return new UnknownKratosError(err)
    }

    const sessionToken = result.data.session_token as SessionToken
    const kratosUserId = result.data.identity.id as UserId

    return { sessionToken, kratosUserId }
  }

  const createIdentityNoSession = async (
    phone: PhoneNumber,
  ): Promise<UserId | KratosError> => {
    const adminIdentity: CreateIdentityBody = {
      credentials: { password: { config: { password } } },
      state: "active",
      schema_id: "phone_no_password_v0",
      traits: { phone },
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

  const upgradeToPhoneWithPasswordSchema = async ({
    kratosUserId,
    password,
  }: {
    kratosUserId: UserId
    password: IdentityPassword
  }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err)
      }

      return new UnknownKratosError(err)
    }

    if (identity.schema_id !== "phone_no_password_v0") {
      return new IncompatibleSchemaUpgradeError()
    }

    if (identity.state === undefined)
      throw new KratosError("state undefined, probably impossible state") // type issue

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: "phone_with_password_v0",
    }

    const { data: newIdentity } = await kratosAdmin.updateIdentity({
      id: kratosUserId,
      updateIdentityBody: adminIdentity,
    })

    return toDomainIdentityPhone(newIdentity)
  }

  return {
    login,
    createIdentityWithSession,
    createIdentityNoSession,
    upgradeToPhoneWithPasswordSchema,
  }
}
