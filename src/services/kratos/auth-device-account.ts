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
  isDev,
} from "@config"

import jwksRsa from "jwks-rsa"
import jsonwebtoken from "jsonwebtoken"

import { AccountLevel } from "@domain/accounts"
import { createAccountForDeviceAccount } from "@app/accounts"

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
    deviceId: DeviceId
  }): Promise<CreateKratosUserForDeviceSchemaResponse | KratosError> => {
    const traits = { device: deviceId }
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
        device: deviceId,
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

    // Save a history of the device to the kratos admin metadata
    try {
      // in kratos datetime format
      const updated_at = getKratosDateNow()
      if (identity.metadata_admin) {
        // is array
        if (Array.isArray(identity.metadata_admin)) {
          identity.metadata_admin = [
            ...identity.metadata_admin,
            { device: identity.traits.device, updated_at },
          ]
        } else {
          // is json object
          identity.metadata_admin = [
            identity.metadata_admin,
            { device: identity.traits.device, updated_at },
          ]
        }
      } else {
        // new data
        identity.metadata_admin = [{ device: identity.traits.device, updated_at }]
      }
    } catch (err) {
      console.log(err)
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

    // if in dev environment, use local jwks.json if you dont have access to firebase appcheck debug token
    if (!kidJwk && isDev) {
      // client = await jwksRsa({
      //   jwksUri: getJwksArgs().jwksUri,
      // })
      // // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // jwkJson = (await client.getKeys()) as Array<any>
      // // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // kidJwk = jwkJson.find((j: any) => j.kid === kid)
      // TODO hard code to test in CI
      kidJwk = {
        use: "sig",
        kty: "RSA",
        kid: "1b97b221-ca08-4eb2-9d09-a5770fcceb37",
        alg: "RS256",
        n: "qlvfGDcdL8kM9L6svAi4DrR8XbIfznVilo0jJVHSzCMe6gW5H_RE-yYg7bWc6t2DRRP7UUcggI4c3m3o85DeWrd-pCWQaKxhJAvMrvzbBqk8Eh9HynwG_5garUf3CWEQJWrl7UAJgBThua9QJdN6RONfTlUFlahju4difLfAIYpJyRNeGZ8oAQSiPflQ6a_Ldl6oNP5KEKB526Bx9wG0ri_m2ZB-6gkenhLwjQ2Pc8dAsb-Y1FZnNxswfnW2VPMAun7aNZKGcUXBXim3uM-H4iLvBKSG7DokfA0icqf4xS4kYkCgoo17D-yU564IuckwUGjB6eziXhBlIj-O3dS4sQ",
        e: "AQAB",
        d: "g-fOvbku6CkL1xUsOgumN_yXrxSUfA933oo5hFPunBE1ho4X4R4Jq0zCgkv0zAXn9jyagzxHdkKTJ8aCcNTi1eruK7rKLcILFRXtzjAKhwXSdVWzCJ0v7gef4Duwk5qMHey_SwwiTwHcJSIRNLiiG2TSDpzWTiKr1i_lmhvMsCpXv1331F1Yp0jVDt098Gj5E5Ppqrp2zQay94fTj07sLbRgZPmVT-rTQwjLwRC_PvWWUpxIGGW9PHjy6640t7JrUOLtBQphXrgitkQ0TRxYuot16BOTmELAStFFOmUJ2NS0DPV0Horu7B6r7Qa_9iH4XelWTlZ-bxSaiz_d9OJ9YQ",
        p: "0lPl2OpzdlbAxI4_UZvcad0MnR2vZUqc84VZyqOiC5LFV557i5-AfBZ1X5m-8CLY4L32N0zJPgsiyH4SKg_iwlYGRZX9gbFGKIEuy2J66LhrMN4N6Gu32YF7NTKjVHIpEBv3esRGeARKw16oT8_Empff1rLw0PYWL9q_xHw4UvM",
        q: "z1obr3gdTPw6R2OtgIGnGXQfz0kCm0gQhUGZDVGBLoMYzQOoiIhncYD539gAXSDMXZHxM7z_jSvbwQ0tV9p6frVw4elxY6En_V3FzBVZO823qOdgwtiz5FENbSvJX3EDpFly6h26K5Iz4Q4S71_wQFIiYnAwrDJnsfNMFYGxxss",
        dp: "xj0BZKQF08IMyrXwBDFNXBJWszepe2UJ7ZUAfrggIZximCTt-TmK1mosksDMcHXHyHwDNzgObYX9cM8yu6Zhah2-p5OpbrXxlHe97UCS7An2Lgb9QNVWYZFi2U8zFoLLJT3W0kVwzenttZrgNOl1Ouhut2PNCocHfm9FVCJoy_U",
        dq: "NYuzcpC2IFdSRXU8LN9OY4hVXpYgEjF98quJ9qKBlZ1NHkQ_lWKENA92d5O0JFh_7fnuK8o2xCH7UdMxTmqhD2-TgwNhwLSxOwCoP5eTv5nUP83gcvC7I866hOK10evBYQOoZUTf-rh6pTeZNC-2PyX2syz9pLovhQirMTKY0hk",
        qi: "NUtIm6QtQKy0j4HFXuXweQTI778pBmGgY5Ob0ZX5brFMKN2TkFLYKgX9pgiw3Lv6o9QLvYi4_YACS2vTMxUyKUIqd5FYaGHU67kwWzFdtuEgM4zcINLPmSo5pYi7n4_eA8AHBUKwz3L-UchdWbCKopYR-BrUPUQdQTLPxnSRC3U",
      }
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
