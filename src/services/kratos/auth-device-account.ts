import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import { CreateIdentityBody, Identity, UpdateIdentityBody } from "@ory/client"
import * as jose from "node-jose"

import {
  getAppCheckConfig,
  getDefaultAccountsConfig,
  getJwksArgs,
  getKratosPasswords,
  isCI,
  isDev,
} from "@config"

import jwksRsa from "jwks-rsa"
import jsonwebtoken from "jsonwebtoken"

import { AccountLevel } from "@domain/accounts"
import { createAccountForDeviceAccount } from "@app/accounts"

import { baseLogger } from "@services/logger"

import {
  AuthenticationKratosError,
  IncompatibleSchemaUpgradeError,
  KratosError,
  UnknownKratosError,
} from "./errors"

import { kratosAdmin, kratosPublic, toDomainIdentityPhone } from "./private"

export const AuthWithDeviceAccountService = () => {
  const password = getKratosPasswords().masterUserPassword

  const loginDeviceAccount = async ({
    deviceId,
  }: {
    deviceId: DeviceId
  }): Promise<LoginWithDeviceSchemaResponse | KratosError> => {
    const identifier = deviceId
    const method = "password"

    try {
      const flow = await kratosPublic.createNativeLoginFlow()
      const result = await kratosPublic.updateLoginFlow({
        flow: flow.data.id,
        updateLoginFlowBody: {
          identifier,
          method,
          password,
          traits: {
            deviceId: identifier,
          },
        },
      })
      const sessionToken = result.data.session_token as SessionToken

      // note: this only works when whoami: required_aal = aal1
      const kratosUserId = result.data.session.identity.id as UserId

      return { sessionToken, kratosUserId }
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyNoUserWithThisPhoneExistError(err.message || err)
      }

      if (err.message === "Request failed with status code 401") {
        return new AuthenticationKratosError(err.message || err)
      }

      return new UnknownKratosError(err.message || err)
    }
  }

  const createDeviceIdentity = async ({
    deviceId,
  }: {
    deviceId: DeviceId
  }): Promise<CreateKratosUserForDeviceSchemaResponse | KratosError> => {
    const traits = { deviceId: deviceId }
    const identityBody: CreateIdentityBody = {
      credentials: { password: { config: { password } } },
      state: "active",
      schema_id: "device_account_v0",
      traits,
    }
    try {
      const identityResults = await kratosAdmin.createIdentity({
        createIdentityBody: identityBody,
      })
      console.log(identityResults.status)
      const result = await loginDeviceAccount({ deviceId })
      if (result instanceof KratosError) return result
      const sessionToken = result.sessionToken
      const kratosUserId = result.kratosUserId as UserId

      const levelZeroAccountsConfig = getDefaultAccountsConfig()
      levelZeroAccountsConfig.initialLevel = AccountLevel.Zero
      const account = await createAccountForDeviceAccount({
        userId: kratosUserId,
        config: levelZeroAccountsConfig,
        deviceId,
      })
      if (account instanceof Error) return account
      return { sessionToken, kratosUserId }
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err.message || err)
      }

      return new UnknownKratosError(err.message || err)
    }
  }

  const upgradeToPhoneSchema = async ({
    kratosUserId,
    phone,
  }: {
    kratosUserId: UserId
    phone: PhoneNumber
  }): Promise<IdentityPhone | KratosError> => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    if (identity.schema_id !== "device_account_v0") {
      return new IncompatibleSchemaUpgradeError()
    }

    // Save a history of the device to the kratos admin metadata
    try {
      // in kratos datetime format
      const updated_at = getKratosDateNow()
      if (identity.metadata_admin) {
        // is array
        if (Array.isArray(identity.metadata_admin)) {
          identity.metadata_admin = [
            ...identity.metadata_admin,
            { deviceId: identity.traits.deviceId, updated_at },
          ]
        } else {
          // is json object
          identity.metadata_admin = [
            identity.metadata_admin,
            { deviceId: identity.traits.deviceId, updated_at },
          ]
        }
      } else {
        // new data
        identity.metadata_admin = [{ deviceId: identity.traits.deviceId, updated_at }]
      }
    } catch (error) {
      baseLogger.error(
        { error },
        "error saving history of the device to the kratos metadata",
      )
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

  const verifyJwt = async (token: string) => {
    const audience = getAppCheckConfig().audience
    const issuer = getAppCheckConfig().issuer
    const jwksUri = getAppCheckConfig().jwksUri

    // Get the JSON web keys (JWKS)
    let client = await jwksRsa({
      jwksUri,
    })
    let jwkJson
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwkJson = (await client.getKeys()) as Array<any>

    // Decode the token
    const decodedToken = jsonwebtoken.decode(token, { complete: true })
    if (!decodedToken) return Error("problem with jwt")

    // Find the kid (Key Id) used to sign the token
    const kid = decodedToken.header.kid
    let kidJwk = jwkJson.find((j) => j.kid === kid)

    // if in dev environment, use local jwks.json if you dont have access to firebase appcheck debug
    if (!kidJwk && (isDev || isCI)) {
      client = await jwksRsa({
        jwksUri: getJwksArgs().jwksUri,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jwkJson = (await client.getKeys()) as Array<any>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kidJwk = jwkJson.find((j: any) => j.kid === kid)
    }

    // Create a Key object from the JWK and to PEM format
    const jwtAskey = await jose.JWK.asKey(kidJwk)
    const pem = jwtAskey.toPEM(false)

    // Verify the token
    const verifiedToken = jsonwebtoken.verify(token, pem, {
      algorithms: ["RS256"],
      audience,
      issuer,
    })

    return verifiedToken
  }

  const getKratosDateNow = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const day = now.getDate().toString().padStart(2, "0")
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    const seconds = now.getSeconds().toString().padStart(2, "0")
    const milliseconds = now.getMilliseconds().toString().padStart(3, "0")
    const updated_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
    return updated_at
  }

  return {
    upgradeToPhoneSchema,
    loginDeviceAccount,
    createDeviceIdentity,
    verifyJwt,
  }
}
