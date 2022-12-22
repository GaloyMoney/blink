import crypto from "crypto"

import { getKratosPasswords } from "@config"

import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import {
  CreateIdentityBody,
  Identity,
  SuccessfulNativeLogin,
  UpdateIdentityBody,
} from "@ory/client"

import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

import {
  AuthenticationKratosError,
  IncompatibleSchemaUpgradeError,
  KratosError,
  UnknownKratosError,
} from "./errors"

import { kratosAdmin, kratosPublic, toDomainIdentityPhone } from "./private"

// login with bearer token

export const AuthWithBearerTokenService = () => {
  const password = getKratosPasswords().masterUserPassword

  const create = async (): Promise<CreateBearerTokenSchemaResponse | KratosError> => {
    const random = crypto.randomUUID()

    const adminIdentity: CreateIdentityBody = {
      credentials: { password: { config: { password } } },
      state: "active",
      schema_id: "bearer_token",
      traits: { random },
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

    const flow = await kratosPublic.createNativeLoginFlow()

    const identifier = random
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

    return { sessionToken, kratosUserId }
  }

  const upgradeToPhoneSchema = async ({
    kratosUserId,
    phone,
  }: {
    kratosUserId: UserId
    phone: PhoneNumber
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

    if (identity.schema_id !== "bearer_token") {
      return new IncompatibleSchemaUpgradeError()
    }

    if (identity.state === undefined)
      throw new KratosError("state undefined, probably impossible state") // type issue

    identity.traits = { phone }

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: "phone_no_password_v0",
    }

    const { data: newIdentity } = await kratosAdmin.updateIdentity({
      id: kratosUserId,
      updateIdentityBody: adminIdentity,
    })

    return toDomainIdentityPhone(newIdentity)
  }

  return {
    create,
    upgradeToPhoneSchema,
  }
}
