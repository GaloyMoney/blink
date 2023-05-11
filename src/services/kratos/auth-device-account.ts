import path from "path"

import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import { Identity, UpdateIdentityBody } from "@ory/client"
import * as jose from "node-jose"

import { getKratosPasswords, isDev } from "@config"

import jwksRsa from "jwks-rsa"
import jsonwebtoken from "jsonwebtoken"

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
    deviceId: DeviceToken
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
            device_id: identifier,
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
    deviceId: DeviceToken
  }): Promise<CreateKratosUserForDeviceSchemaResponse | KratosError> => {
    const traits = { device: deviceId }
    const method = "password"
    try {
      const flow = await kratosPublic.createNativeRegistrationFlow()
      const result = await kratosPublic.updateRegistrationFlow({
        flow: flow.data.id,
        updateRegistrationFlowBody: {
          traits,
          method,
          password,
        },
      })
      const sessionToken = result.data.session_token as SessionToken
      const kratosUserId = result.data.identity.id as UserId

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

    if (identity.schema_id !== "device_account_v0") {
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

  const verifyJwt = async (token: string) => {
    // TODO Read from config
    const audience = "projects/72279297366"
    const issuer = "https://firebaseappcheck.googleapis.com/72279297366"
    const jwksUri = "https://firebaseappcheck.googleapis.com/v1beta/jwks"

    // Get the JSON web keys (JWKS)
    const client = await jwksRsa({
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

    // if in dev environment, use local jwks.json if you dont have access to firebase appcheck debug token
    if (!kidJwk && isDev) {
      const jwkPath = path.resolve(__dirname, "../../../dev/ory", "jwks.json")
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const jwksFile = require(jwkPath)
      jwkJson = jwksFile.keys
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

  return {
    upgradeToPhoneSchema,
    loginDeviceAccount,
    createDeviceIdentity,
    verifyJwt,
  }
}
